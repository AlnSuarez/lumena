from django.contrib import admin
from .models import MonthlyRequest

@admin.register(MonthlyRequest)
class MonthlyRequestAdmin(admin.ModelAdmin):
    list_display = ('client', 'assigned_to', 'month', 'status', 'created_at')
    list_filter = ('status', 'month', 'client', 'assigned_to')
    search_fields = ('client__username', 'client__email', 'notes')
    ordering = ('-month',)
