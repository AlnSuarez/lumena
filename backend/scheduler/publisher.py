import os
import json
import logging
import urllib.request
from django.conf import settings

logger = logging.getLogger(__name__)

def get_api_key():
    return getattr(settings, "POSTPROXY_API_KEY", os.getenv("POSTPROXY_API_KEY"))

def fetch_profiles(api_key):
    url = "https://api.postproxy.dev/api/profiles"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            return res.get("data", [])
    except Exception as e:
        logger.error(f"[Postproxy] Failed to fetch profiles: {e}")
        return []

def publish_to_postproxy(post):
    """
    Publishes a ScheduledPost to the appropriate Postproxy profiles.
    """
    api_key = get_api_key()
    if not api_key:
        return {"success": False, "error": "POSTPROXY_API_KEY not configured in environment or settings"}

    # Map platforms to client's connected profile IDs in our database
    from .models import SocialAccount
    
    target_profile_ids = []
    for platform in post.platforms:
        accounts = SocialAccount.objects.filter(
            client=post.client,
            platform=platform.lower(),
            status='active'
        )
        if accounts.exists():
            for acc in accounts:
                target_profile_ids.append(acc.postproxy_profile_id)
        else:
            logger.warning(f"[Postproxy] No active database connection found for client {post.client.username} on platform: {platform}")

    if not target_profile_ids:
        return {
            "success": False,
            "error": f"No active connected profiles found in database for client {post.client.username} on platforms: {post.platforms}"
        }

    # Format content body
    body_text = post.caption
    if post.hashtags:
        hashtags_str = " ".join([h if h.startswith("#") else f"#{h}" for h in post.hashtags])
        body_text = f"{body_text}\n\n{hashtags_str}".strip()

    # Construct request payload
    post_payload = {
        "body": body_text
    }
    from django.utils import timezone
    if post.scheduled_at and post.scheduled_at > timezone.now():
        post_payload["scheduled_at"] = post.scheduled_at.isoformat()

    payload = {
        "post": post_payload,
        "profiles": target_profile_ids
    }

    # Extract media files (photos/videos) for carousels or single posts
    media_urls = []
    
    # Helper to resolve and test public URLs
    def clean_media_url(raw_url):
        if not raw_url:
            return None
        # If relative path, prefix with localhost/127.0.0.1 URL for completeness
        if raw_url.startswith("/"):
            raw_url = f"http://127.0.0.1:8000{raw_url}"
            
        # Postproxy cannot download from localhost/127.0.0.1.
        # Fallback to a high-quality public image for local development tests.
        if "127.0.0.1" in raw_url or "localhost" in raw_url:
            return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop"
        return raw_url

    from gallery.utils import get_or_create_rotated_image

    # 1. Check content_items (multiple items for carousels)
    if hasattr(post.content, "content_items") and post.content.content_items.exists():
        for item in post.content.content_items.all():
            url = None
            if item.gallery_image:
                try:
                    if item.gallery_image.image:
                        url = item.gallery_image.image.url
                    elif item.gallery_image.image_compressed:
                        url = item.gallery_image.image_compressed.url
                except Exception as e:
                    logger.error(f"[Postproxy] Failed to get URL for gallery image {item.gallery_image.id}: {e}")
            elif item.file_url:
                url = item.file_url

            if url and getattr(item, 'rotation', 0) and (item.rotation % 360 != 0):
                url = get_or_create_rotated_image(url, item.rotation)

            cleaned = clean_media_url(url)
            if cleaned:
                media_urls.append(cleaned)
                
    # 2. Fallback to linked_image if no content_items are present
    elif hasattr(post.content, "linked_image") and post.content.linked_image:
        url = None
        try:
            if post.content.linked_image.image:
                url = post.content.linked_image.image.url
            elif post.content.linked_image.image_compressed:
                url = post.content.linked_image.image_compressed.url
        except Exception as e:
            logger.error(f"[Postproxy] Failed to get URL for linked image {post.content.linked_image.id}: {e}")
        cleaned = clean_media_url(url)
        if cleaned:
            media_urls.append(cleaned)

    if media_urls:
        payload["media"] = media_urls

    url = "https://api.postproxy.dev/api/posts"
    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            logger.info(f"[Postproxy] Post published successfully: {res}")
            return {"success": True, "data": res}
    except urllib.error.HTTPError as e:
        error_content = e.read().decode()
        logger.error(f"[Postproxy] HTTP Error publishing: {e.code} - {error_content}")
        try:
            err_data = json.loads(error_content)
            return {"success": False, "error": err_data.get("message", error_content)}
        except Exception:
            return {"success": False, "error": f"HTTP {e.code}: {error_content}"}
    except Exception as e:
        logger.error(f"[Postproxy] Connection error publishing: {e}")
        return {"success": False, "error": str(e)}

def sync_post_status(post):
    """
    Queries Postproxy to get the latest status of the post and updates our database.
    """
    if not post.postproxy_id:
        return
    
    api_key = get_api_key()
    if not api_key:
        return

    url = f"https://api.postproxy.dev/api/posts/{post.postproxy_id}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            post_data = res.get("data", {})
            if isinstance(post_data, dict):
                overall_status = post_data.get("overall_status")
                
                # Check platforms list for status and errors
                platforms_data = post_data.get("platforms", [])
                platform_errors = []
                if isinstance(platforms_data, list):
                    for plat in platforms_data:
                        plat_status = plat.get("status")
                        plat_err = plat.get("error")
                        if plat_status == "failed" and plat_err:
                            if isinstance(plat_err, dict):
                                err_msg = plat_err.get("message") or plat_err.get("error", {}).get("message") or str(plat_err)
                            else:
                                err_msg = str(plat_err)
                            platform_errors.append(f"{plat.get('platform', '').capitalize()}: {err_msg}")
                
                if overall_status == "failed" or platform_errors:
                    post.status = 'FAILED'
                    post.error_message = " | ".join(platform_errors) or "Postproxy publication failed"
                    post.save(update_fields=['status', 'error_message'])
                elif overall_status == "complete":
                    post.status = 'PUBLISHED'
                    post.error_message = None
                    post.save(update_fields=['status', 'error_message'])
    except Exception as e:
        logger.error(f"[Postproxy] Failed to sync post status for {post.id}: {e}")


def fetch_post_analytics(postproxy_id):
    """
    Fetches analytics and metrics from Postproxy for a published post.
    """
    if not postproxy_id:
        return None

    api_key = get_api_key()
    if not api_key:
        return None

    url = f"https://api.postproxy.dev/api/posts/{postproxy_id}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            post_data = res.get("data", {})
            if isinstance(post_data, dict):
                metrics = post_data.get("metrics") or post_data.get("analytics") or {}
                platforms = post_data.get("platforms", [])
                
                likes = metrics.get("likes", 0) if isinstance(metrics, dict) else 0
                comments = metrics.get("comments", 0) if isinstance(metrics, dict) else 0
                shares = metrics.get("shares", 0) if isinstance(metrics, dict) else 0
                views = (metrics.get("views") or metrics.get("impressions") or metrics.get("reach", 0)) if isinstance(metrics, dict) else 0
                saves = metrics.get("saves", 0) if isinstance(metrics, dict) else 0

                if isinstance(platforms, list):
                    for p in platforms:
                        if isinstance(p, dict):
                            p_metrics = p.get("metrics") or p.get("analytics") or {}
                            if isinstance(p_metrics, dict):
                                likes += p_metrics.get("likes", 0)
                                comments += p_metrics.get("comments", 0)
                                shares += p_metrics.get("shares", 0)
                                views += p_metrics.get("views") or p_metrics.get("impressions") or p_metrics.get("reach", 0)
                                saves += p_metrics.get("saves", 0)

                if likes > 0 or comments > 0 or shares > 0 or views > 0 or saves > 0:
                    return {
                        "likes": likes,
                        "comments": comments,
                        "shares": shares,
                        "views": views,
                        "saves": saves,
                    }
                elif isinstance(metrics, dict) and metrics:
                    return metrics
    except Exception as e:
        logger.error(f"[Postproxy] Failed to fetch analytics for post {postproxy_id}: {e}")
    return None


def delete_from_postproxy(postproxy_id):
    """
    Deletes (cancels) a scheduled post on Postproxy.
    """
    if not postproxy_id:
        return {"success": False, "error": "No postproxy_id provided"}

    api_key = get_api_key()
    if not api_key:
        return {"success": False, "error": "POSTPROXY_API_KEY not configured"}

    url = f"https://api.postproxy.dev/api/posts/{postproxy_id}"
    req = urllib.request.Request(
        url,
        method="DELETE",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            logger.info(f"[Postproxy] Post {postproxy_id} deleted successfully: {res}")
            return {"success": True, "data": res}
    except Exception as e:
        logger.error(f"[Postproxy] Connection error deleting post {postproxy_id}: {e}")
        return {"success": False, "error": str(e)}


def delete_profile_from_postproxy(profile_id):
    """
    Deletes (disconnects) a social profile on Postproxy.
    """
    if not profile_id:
        return {"success": False, "error": "No profile_id provided"}

    api_key = get_api_key()
    if not api_key:
        return {"success": False, "error": "POSTPROXY_API_KEY not configured"}

    url = f"https://api.postproxy.dev/api/profiles/{profile_id}"
    req = urllib.request.Request(
        url,
        method="DELETE",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            logger.info(f"[Postproxy] Profile {profile_id} deleted successfully: {res}")
            return {"success": True, "data": res}
    except Exception as e:
        logger.error(f"[Postproxy] Connection error deleting profile {profile_id}: {e}")
        return {"success": False, "error": str(e)}


