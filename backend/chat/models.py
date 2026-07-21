from django.db import models
from django.conf import settings


class ChatMessage(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_client_messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sent_messages'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted_by_admin = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
