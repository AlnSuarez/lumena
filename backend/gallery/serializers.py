from rest_framework import serializers
from .models import ClientFolder, ClientImage, SharedDocument

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

class SharedDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()
    is_video = serializers.SerializerMethodField()
    is_pdf = serializers.SerializerMethodField()

    class Meta:
        model = SharedDocument
        fields = ['id', 'file', 'file_url', 'title', 'file_type', 'file_size', 'uploaded_at', 'uploaded_by', 'is_image', 'is_video', 'is_pdf']
        read_only_fields = ['uploaded_at', 'uploaded_by', 'file_type', 'file_size']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_is_image(self, obj):
        return obj.file_type in ('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico')

    def get_is_video(self, obj):
        return obj.file_type in ('mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'flv')

    def get_is_pdf(self, obj):
        return obj.file_type == 'pdf'

class ClientFolderSerializer(serializers.ModelSerializer):
    images = ClientImageSerializer(many=True, read_only=True)
    image_count = serializers.SerializerMethodField()
    shared_documents = SharedDocumentSerializer(many=True, read_only=True)
    shared_document_count = serializers.SerializerMethodField()

    class Meta:
        model = ClientFolder
        fields = ['id', 'client', 'folder_name', 'created_at', 'created_by', 'images', 'image_count', 'shared_documents', 'shared_document_count', 'is_system_folder']
        read_only_fields = ['created_at', 'created_by', 'is_system_folder']

    def get_image_count(self, obj):
        return obj.images.count()

    def get_shared_document_count(self, obj):
        return obj.shared_documents.count()
