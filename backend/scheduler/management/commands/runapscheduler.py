import logging

from django.conf import settings

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution

logger = logging.getLogger(__name__)


def run_scheduler():
    scheduler = BlockingScheduler(timezone=settings.TIME_ZONE)
    scheduler.add_jobstore(DjangoJobStore(), "default")

    from scheduler.jobs import publish_due_posts

    scheduler.add_job(
        publish_due_posts,
        trigger=CronTrigger(minute="*", second="0"),
        id="publish_due_posts",
        max_instances=1,
        replace_existing=True,
    )
    logger.info("Scheduler started. Checking for due posts every minute...")

    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")
        scheduler.shutdown()


from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Runs APScheduler to check and publish due posts."

    def handle(self, *args, **options):
        run_scheduler()
