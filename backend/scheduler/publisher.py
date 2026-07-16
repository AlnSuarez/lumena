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
    payload = {
        "post": {
            "body": body_text
        },
        "profiles": target_profile_ids
    }

    # Extract media files (photos/videos) for carousels or single posts
    media_urls = []
    
    # 1. Check content_items (multiple items for carousels)
    if hasattr(post.content, "content_items") and post.content.content_items.exists():
        for item in post.content.content_items.all():
            url = None
            if item.gallery_image:
                url = getattr(item.gallery_image.image, "url", None) or getattr(item.gallery_image.image_compressed, "url", None)
            elif item.file_url:
                url = item.file_url
            
            if url and url.startswith("http"):
                media_urls.append(url)
                
    # 2. Fallback to linked_image if no content_items are present
    elif hasattr(post.content, "linked_image") and post.content.linked_image:
        url = getattr(post.content.linked_image.image, "url", None) or getattr(post.content.linked_image.image_compressed, "url", None)
        if url and url.startswith("http"):
            media_urls.append(url)

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
