from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

def client_folder_upload_path(instance, filename):
    """Generate upload path: client_images/{client_id}/{folder_name}/{filename}"""
    return f'client_images/{instance.folder.client.id}/{instance.folder.folder_name}/{filename}'

def client_folder_compressed_upload_path(instance, filename):
    """Generate upload path for compressed images"""
    return f'client_images/{instance.folder.client.id}/{instance.folder.folder_name}/compressed/{filename}'

class ClientFolder(models.Model):
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gallery_folders')
    folder_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_folders')

    class Meta:
        unique_together = ('client', 'folder_name')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.client.username} - {self.folder_name}"

class ClientImage(models.Model):
    folder = models.ForeignKey(ClientFolder, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=client_folder_upload_path)  # Original image
    image_compressed = models.ImageField(upload_to=client_folder_compressed_upload_path, null=True, blank=True)  # Compressed version
    title = models.CharField(max_length=255, blank=True)  # Image title/name
    folio = models.CharField(max_length=50, unique=True, editable=False, null=True)  # Unique identifier
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_images')

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.folio} - {self.title or self.image.name}"

    def save(self, *args, **kwargs):
        """Generate folio if not exists"""
        if not self.folio:
            # Generate folio format: C{client_id}F{folder_id}-{count}
            # Example: C5F12-001
            image_count = ClientImage.objects.filter(folder=self.folder).count() + 1
            self.folio = f"C{self.folder.client.id}F{self.folder.id}-{image_count:03d}"

        # Set title from filename if not provided
        if not self.title and self.image:
            import os
            filename = os.path.basename(self.image.name)
            self.title = os.path.splitext(filename)[0]

        super().save(*args, **kwargs)
