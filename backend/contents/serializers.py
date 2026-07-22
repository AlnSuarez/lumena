from rest_framework import serializers
from .models import MonthlyRequest, ContentItem, RequestHistory, LetsTalkSubmission
from users.serializers import UserSerializer
from gallery.serializers import ClientImageSerializer


class ContentItemSerializer(serializers.ModelSerializer):
    gallery_image_details = ClientImageSerializer(source='gallery_image', read_only=True)

    class Meta:
        model = ContentItem
        fields = ['id', 'media_type', 'order', 'gallery_image', 'gallery_image_details', 'file_url', 'file_name', 'caption', 'rotation', 'created_at']


class ContentItemCreateSerializer(serializers.ModelSerializer):
    file_url = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ContentItem
        fields = ['media_type', 'order', 'gallery_image', 'file_url', 'file_name', 'caption', 'rotation']


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
    content_items = ContentItemSerializer(many=True, read_only=True)

    class Meta:
        model = MonthlyRequest
        fields = ['id', 'client', 'client_details', 'assigned_to', 'assigned_to_details', 'qa_assigned_to', 'qa_assigned_to_details', 'linked_image', 'linked_image_details', 'month', 'request_type', 'status', 'notes', 'content_text', 'ai_caption', 'feedback', 'client_feedback', 'content_items', 'created_at', 'updated_at', 'history']


class MonthlyRequestCreateSerializer(serializers.ModelSerializer):
    content_items = ContentItemCreateSerializer(many=True, required=False)

    class Meta:
        model = MonthlyRequest
        fields = ['client', 'assigned_to', 'request_type', 'month', 'status', 'notes', 'content_text', 'linked_image', 'feedback', 'client_feedback', 'content_items']

    def create(self, validated_data):
        content_items_data = validated_data.pop('content_items', [])
        current_user = validated_data.pop('_current_user', None)
        linked_image = validated_data.get('linked_image')

        instance = MonthlyRequest(**validated_data)
        if current_user:
            instance._current_user = current_user
        instance.save()

        if linked_image and not content_items_data:
            ContentItem.objects.create(
                request=instance,
                media_type=ContentItem.MediaType.IMAGE,
                order=0,
                gallery_image=linked_image,
            )
        else:
            for i, item_data in enumerate(content_items_data):
                ContentItem.objects.create(request=instance, **item_data)

        return instance

    def update(self, instance, validated_data):
        content_items_data = validated_data.pop('content_items', None)
        current_user = validated_data.pop('_current_user', None)

        if current_user:
            instance._current_user = current_user

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if content_items_data is not None:
            instance.content_items.all().delete()
            for i, item_data in enumerate(content_items_data):
                ContentItem.objects.create(request=instance, **item_data)

        return instance


class LetsTalkSubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LetsTalkSubmission
        fields = ['name', 'email', 'specialty', 'phone', 'message']


class LetsTalkSubmissionAdminSerializer(serializers.ModelSerializer):
    reviewed_by_details = UserSerializer(source='reviewed_by', read_only=True)

    class Meta:
        model = LetsTalkSubmission
        fields = [
            'id',
            'name',
            'email',
            'specialty',
            'phone',
            'message',
            'created_at',
            'reviewed',
            'reviewed_at',
            'reviewed_by',
            'reviewed_by_details',
        ]
