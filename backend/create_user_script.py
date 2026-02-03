from django.contrib.auth import get_user_model
User = get_user_model()
email = "cc_user@lumena.com"
password = "cc_password_123!"
username = "content_creator"

if not User.objects.filter(username=username).exists():
    user = User.objects.create_user(username=username, email=email, password=password)
    user.role = User.Role.CONTENT_CREATOR
    user.save()
    print(f"User created: {email} / {password}")
else:
    print("User already exists")
