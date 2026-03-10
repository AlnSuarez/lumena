from django.contrib import admin
from .models import MonthlyRequest, LetsTalkSubmission

@admin.register(MonthlyRequest)
class MonthlyRequestAdmin(admin.ModelAdmin):
    list_display = ('client', 'assigned_to', 'month', 'status', 'created_at')
    list_filter = ('status', 'month', 'client', 'assigned_to')
    search_fields = ('client__username', 'client__email', 'notes')
    ordering = ('-month',)


@admin.register(LetsTalkSubmission)
class LetsTalkSubmissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'specialty', 'created_at', 'reviewed')
    list_filter = ('reviewed', 'created_at')
    search_fields = ('name', 'email', 'specialty', 'message')
    ordering = ('-created_at',)
