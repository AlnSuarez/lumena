from rest_framework import serializers
from .models import MonthlyRequest, RequestHistory
from users.serializers import UserSerializer
from gallery.serializers import ClientImageSerializer

class RequestHistorySerializer(serializers.ModelSerializer):
    changed_by_details = UserSerializer(source='changed_by', read_only=True)

    class Meta:
        model = RequestHistory
        fields = ['id', 'previous_status', 'new_status', 'timestamp', 'notes', 'changed_by', 'changed_by_details']

class MonthlyRequestSerializer(serializers.ModelSerializer):
    client_details = UserSerializer(source='client', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    qa_assigned_to_details = UserSerializer(source='qa_assigned_to', read_only=True)
    linked_image_details = ClientImageSerializer(source='linked_image', read_only=True)
    history = RequestHistorySerializer(many=True, read_only=True)

    def create(self, validated_data):
        current_user = validated_data.pop('_current_user', None)
        instance = MonthlyRequest(**validated_data)
        if current_user:
            instance._current_user = current_user
        instance.save()
        return instance

    class Meta:
        model = MonthlyRequest
        fields = ['id', 'client', 'client_details', 'assigned_to', 'assigned_to_details', 'qa_assigned_to', 'qa_assigned_to_details', 'linked_image', 'linked_image_details', 'month', 'request_type', 'status', 'notes', 'content_text', 'ai_caption', 'feedback', 'created_at', 'updated_at', 'history']
