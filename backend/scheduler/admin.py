from django.contrib import admin
from .models import ScheduledPost


@admin.register(ScheduledPost)
class ScheduledPostAdmin(admin.ModelAdmin):
    list_display = ('content', 'client', 'scheduled_at', 'status', 'created_at')
    list_filter = ('status', 'platforms', 'scheduled_at')
    search_fields = ('content__client__username', 'caption')
    ordering = ('-scheduled_at',)
