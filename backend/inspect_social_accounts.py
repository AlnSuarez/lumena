import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from scheduler.models import SocialAccount

for acc in SocialAccount.objects.all():
    print(f"ID: {acc.id}, Client: {acc.client.username} (ID: {acc.client.id}), Platform: {acc.platform}, Name: {acc.name}")
