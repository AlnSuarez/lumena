import logging
from datetime import datetime, timedelta
from django.utils import timezone
from .models import ScheduledPost

logger = logging.getLogger(__name__)


def publish_due_posts():
    now = timezone.now()
    logger.info(f"[publish_due_posts] Checking for posts due at {now}...")

    due_posts = ScheduledPost.objects.filter(
        status='SCHEDULED',
        scheduled_at__lte=now,
    )

    count = 0
    for post in due_posts:
        count += 1
        logger.info(
            f"[publish_due_posts] Publishing post {post.id} - "
            f"content={post.content_id}, platforms={post.platforms}, "
            f"scheduled_at={post.scheduled_at}"
        )

        try:
            post.status = 'PUBLISHING'
            post.save(update_fields=['status'])

            # TODO: Integrate with Postproxy.dev here
            # Example:
            # from .publisher import publish_to_postproxy
            # result = publish_to_postproxy(post)
            # if result['success']:
            #     post.status = 'PUBLISHED'
            #     post.published_at = now
            #     post.error_message = None
            # else:
            #     post.status = 'FAILED'
            #     post.error_message = result['error']

            post.status = 'PUBLISHED'
            post.published_at = now
            post.error_message = None
            post.save(update_fields=['status', 'published_at', 'error_message'])

            logger.info(f"[publish_due_posts] Post {post.id} published successfully")

        except Exception as e:
            post.status = 'FAILED'
            post.error_message = str(e)
            post.save(update_fields=['status', 'error_message'])
            logger.error(f"[publish_due_posts] Post {post.id} failed: {e}")

    if count == 0:
        logger.info("[publish_due_posts] No posts due for publishing")
    else:
        logger.info(f"[publish_due_posts] Published {count} post(s)")
