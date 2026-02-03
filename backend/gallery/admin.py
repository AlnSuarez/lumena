from django.contrib import admin
from .models import ClientFolder, ClientImage

@admin.register(ClientFolder)
class ClientFolderAdmin(admin.ModelAdmin):
    list_display = ['client', 'folder_name', 'created_at', 'created_by']
    search_fields = ['client__username', 'folder_name']
    list_filter = ['created_at']
    readonly_fields = ['created_at', 'created_by']

@admin.register(ClientImage)
class ClientImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'folder', 'image', 'uploaded_at', 'uploaded_by']
    search_fields = ['folder__folder_name', 'folder__client__username']
    list_filter = ['uploaded_at']
    readonly_fields = ['uploaded_at']
