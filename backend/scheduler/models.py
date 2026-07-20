from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class ScheduledPost(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        SCHEDULED = 'SCHEDULED', _('Scheduled')
        PUBLISHING = 'PUBLISHING', _('Publishing')
        PUBLISHED = 'PUBLISHED', _('Published')
        FAILED = 'FAILED', _('Failed')

    content = models.ForeignKey(
        'contents.MonthlyRequest',
        on_delete=models.CASCADE,
        related_name='scheduled_posts',
        verbose_name=_("Content")
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scheduled_posts',
        verbose_name=_("Client")
    )
    platforms = models.JSONField(default=list, verbose_name=_("Platforms"))
    scheduled_at = models.DateTimeField(verbose_name=_("Scheduled At"))
    caption = models.TextField(blank=True, verbose_name=_("Caption"))
    hashtags = models.JSONField(default=list, verbose_name=_("Hashtags"))
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    error_message = models.TextField(blank=True, null=True, verbose_name=_("Error Message"))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_schedules',
        verbose_name=_("Created By")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Published At"))
    postproxy_id = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Postproxy ID"))

    class Meta:
        verbose_name = _("Scheduled Post")
        verbose_name_plural = _("Scheduled Posts")
        ordering = ['scheduled_at']

    def __str__(self):
        return f"{self.content} @ {self.scheduled_at}"


class SocialAccount(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='social_accounts',
        verbose_name=_("Client")
    )
    platform = models.CharField(max_length=50, verbose_name=_("Platform"))
    postproxy_profile_id = models.CharField(max_length=50, unique=True, verbose_name=_("Postproxy Profile ID"))
    name = models.CharField(max_length=100, verbose_name=_("Name"))
    avatar_url = models.URLField(blank=True, null=True, verbose_name=_("Avatar URL"))
    status = models.CharField(max_length=20, default='active', verbose_name=_("Status"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Social Account")
        verbose_name_plural = _("Social Accounts")

    def __str__(self):
        return f"{self.name} ({self.platform}) for {self.client.username}"

