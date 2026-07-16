import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from scheduler.models import SocialAccount
from users.models import User

# Re-assign Rachel's profile (profile ID: 4pU2Vj) back to Rachel (user ID: 8)
try:
    rachel_user = User.objects.get(id=8)
    updated = SocialAccount.objects.filter(postproxy_profile_id="4pU2Vj").update(client=rachel_user)
    print(f"Successfully re-assigned Rachel's profile. Updated records: {updated}")
except User.DoesNotExist:
    print("User Rachel (ID: 8) does not exist in database.")
except Exception as e:
    print(f"Error re-assigning profile: {e}")
