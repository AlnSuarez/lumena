from rest_framework import serializers
from .models import ScheduledPost


class ScheduledPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledPost
        fields = [
            'id', 'content', 'client', 'platforms', 'scheduled_at',
            'caption', 'hashtags', 'status', 'error_message',
            'created_by', 'created_at', 'updated_at', 'published_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'published_at', 'error_message']

    def validate_platforms(self, value):
        if not isinstance(value, list) or len(value) == 0:
            raise serializers.ValidationError("At least one platform must be selected.")
        valid_platforms = {'instagram', 'linkedin', 'twitter', 'facebook', 'tiktok', 'youtube', 'threads', 'bluesky', 'pinterest', 'telegram'}
        for p in value:
            if p not in valid_platforms:
                raise serializers.ValidationError(f"Invalid platform: {p}")
        return value
