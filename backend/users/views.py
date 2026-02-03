from rest_framework.decorators import api_view, parser_classes, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status, parsers
from rest_framework.permissions import AllowAny
from .models import User
from .serializers import UserSerializer, CreateClientSerializer, ManageUserSerializer
import json
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate as django_authenticate, login as django_login

@api_view(['GET'])
def get_content_creators(request):
    creators = User.objects.filter(role=User.Role.CONTENT_CREATOR)
    serializer = UserSerializer(creators, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_clients(request):
    clients = User.objects.filter(role=User.Role.CLIENT)
    serializer = UserSerializer(clients, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@parser_classes([parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser])
def create_client(request):
    # Check if we have multipart data with 'json_data' field
    if 'json_data' in request.data:
        try:
            data = json.loads(request.data['json_data'])
        except ValueError:
            return Response({"error": "Invalid JSON in json_data"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Add file to profile data if it exists
        if 'logo' in request.FILES:
            if 'profile' not in data:
                data['profile'] = {}
            data['profile']['logo'] = request.FILES['logo']
            
    else:
        # Assume standard JSON request if no file upload intended or testing
        data = request.data

    serializer = CreateClientSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- USER MANAGEMENT VIEWS ---

@api_view(['GET'])
def list_manageable_users(request):
    """List all users except superusers."""
    users = User.objects.exclude(is_superuser=True).order_by('username')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def add_user(request):
    """Add a new user (internal staff or other roles)."""
    serializer = ManageUserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
def update_user(request, user_id):
    """Update user details including password and role."""
    user = get_object_or_404(User, id=user_id)
    if user.is_superuser:
        return Response({"error": "Cannot modify superuser via this endpoint"}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ManageUserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_user(request, user_id):
    """Delete a user."""
    user = get_object_or_404(User, id=user_id)
    if user.is_superuser:
        return Response({"error": "Cannot delete superuser via this endpoint"}, status=status.HTTP_403_FORBIDDEN)
    
    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    """Authenticate a user and return their details."""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Please provide both email and password'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Try to find user by email to get the username (authenticate expects username usually, or customized backend)
    # The default authenticate uses 'username' kwarg, but if the User model uses email as USERNAME_FIELD it might differ.
    # Users in this app seem to have 'username' and 'email'.
    # Authenticate usually matches 'username' against the model's USERNAME_FIELD.
    
    # Let's try to find the user first by email
    try:
        user_obj = User.objects.get(email=email)
        # authenticate takes 'username' (which acts as the credential identifier) and 'password'
        user = django_authenticate(username=user_obj.username, password=password)
    except User.DoesNotExist:
        # Also try treating email as username just in case
        user = django_authenticate(username=email, password=password)
        
    if user:
        # Create session for the user
        django_login(request, user)
        return Response(UserSerializer(user).data)
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
