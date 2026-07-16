import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User, ClientProfile

def create_client():
    username = "alansuarez"
    email = "alan.suarez@example.com"
    password = "AlanSuarez2026!"
    
    # Check if user already exists
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'role': User.Role.CLIENT
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        print(f"Created client user: {username}")
    else:
        print(f"User {username} already exists.")
        
    # Check/Create Client Profile
    profile, p_created = ClientProfile.objects.get_or_create(
        user=user,
        defaults={
            'practice_name': "Alan Suarez Consulting",
            'primary_contact': "Alan Suarez",
            'contact_email': email
        }
    )
    
    if p_created:
        print("Created client profile.")
    else:
        print("Client profile already exists.")
        
    print("\n--- Credentials ---")
    print(f"Username: {username}")
    print(f"Password: {password}")
    print("Role: CLIENT")
    print("-------------------")

if __name__ == '__main__':
    create_client()
