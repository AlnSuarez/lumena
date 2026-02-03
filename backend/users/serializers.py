from rest_framework import serializers
from .models import User, ClientProfile

class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        exclude = ('user',)

class UserSerializer(serializers.ModelSerializer):
    client_profile = ClientProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'client_profile', 'access_permissions']

class CreateClientSerializer(serializers.ModelSerializer):
    profile = ClientProfileSerializer()
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'profile']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        password = validated_data.pop('password')
        
        # User creation
        user = User(**validated_data) # username, email are here
        user.role = User.Role.CLIENT
        user.set_password(password)
        user.save()
        
        # Profile creation
        ClientProfile.objects.create(user=user, **profile_data)
        
        return user

class ManageUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'access_permissions']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
