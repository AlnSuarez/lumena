from rest_framework import serializers
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    client_name = serializers.CharField(source='client.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = [
            'id', 'client', 'sender', 'message', 'created_at',
            'is_read', 'read_at', 'sender_name', 'sender_role',
            'client_name', 'is_deleted_by_admin'
        ]


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['client', 'message']
