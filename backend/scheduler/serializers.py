from rest_framework import serializers
from .models import ScheduledPost, SocialAccount


class ScheduledPostSerializer(serializers.ModelSerializer):
    client_details = serializers.SerializerMethodField(read_only=True)
    content_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ScheduledPost
        fields = [
            'id', 'content', 'client', 'platforms', 'scheduled_at',
            'caption', 'hashtags', 'status', 'error_message',
            'created_by', 'created_at', 'updated_at', 'published_at',
            'client_details', 'content_details',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'published_at', 'error_message']

    def get_client_details(self, obj):
        return {"id": obj.client.id, "username": obj.client.username}

    def get_content_details(self, obj):
        linked_image = None
        if obj.content.linked_image:
            linked_image = {
                "image": obj.content.linked_image.image.url if hasattr(obj.content.linked_image, 'image') and obj.content.linked_image.image else None,
                "image_compressed": obj.content.linked_image.image_compressed.url if hasattr(obj.content.linked_image, 'image_compressed') and obj.content.linked_image.image_compressed else None
            }
        return {
            "id": obj.content.id,
            "request_type": obj.content.request_type,
            "month": obj.content.month,
            "linked_image_details": linked_image
        }

    def validate_platforms(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("At least one platform must be selected.")
        valid_platforms = {'instagram', 'linkedin', 'twitter', 'facebook', 'tiktok', 'youtube', 'threads', 'bluesky', 'pinterest', 'telegram'}
        for p in value:
            if p not in valid_platforms:
                raise serializers.ValidationError(f"Invalid platform: {p}")
        return value


class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = [
            'id', 'client', 'platform', 'postproxy_profile_id',
            'name', 'avatar_url', 'status', 'created_at',
        ]
        read_only_fields = ['created_at']

