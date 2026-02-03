
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser")
    fieldsets = UserAdmin.fieldsets + (
        (None, {"fields": ("role",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {"fields": ("role",)}),
    )

from .models import ClientProfile

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "practice_name", "primary_contact")

