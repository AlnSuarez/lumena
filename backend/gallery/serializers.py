from rest_framework import serializers
from .models import ClientFolder, ClientImage

class ClientImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    image_url_original = serializers.SerializerMethodField()

    class Meta:
        model = ClientImage
        fields = ['id', 'image', 'image_url', 'image_url_original', 'title', 'folio', 'uploaded_at', 'uploaded_by']
        read_only_fields = ['folio']

    def get_image_url(self, obj):
        """Return the full URL of the compressed image (default for display)"""
        # Prefer compressed version if available
        if obj.image_compressed:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image_compressed.url)
            return obj.image_compressed.url
        # Fallback to original if compressed doesn't exist
        elif obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_image_url_original(self, obj):
        """Return the full URL of the original high-quality image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ClientFolderSerializer(serializers.ModelSerializer):
    images = ClientImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()

    class Meta:
        model = ClientFolder
        fields = ['id', 'client', 'folder_name', 'created_at', 'created_by', 'images', 'image_count']
        read_only_fields = ['created_at', 'created_by']

    def get_image_count(self, obj):
        """Return the count of images in the folder"""
        return obj.images.count()
