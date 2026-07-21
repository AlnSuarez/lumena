from django.contrib import admin
from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'sender', 'message_preview', 'created_at', 'is_read']
    list_filter = ['is_read', 'created_at']
    search_fields = ['client__username', 'sender__username', 'message']

    @admin.display(description='Message')
    def message_preview(self, obj):
        return obj.message[:80]
