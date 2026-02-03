from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
import os

def compress_image(uploaded_file, quality=85, max_width=1920, max_height=1080):
    """
    Compress an uploaded image file.

    Args:
        uploaded_file: The uploaded image file
        quality: JPEG quality (1-100), default 85
        max_width: Maximum width in pixels, default 1920
        max_height: Maximum height in pixels, default 1080

    Returns:
        InMemoryUploadedFile: Compressed image file
    """
    try:
        # Open the image
        img = Image.open(uploaded_file)

        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Calculate new dimensions while maintaining aspect ratio
        width, height = img.size
        if width > max_width or height > max_height:
            # Calculate the scaling factor
            width_ratio = max_width / width
            height_ratio = max_height / height
            scale_factor = min(width_ratio, height_ratio)

            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)

            # Resize the image with high-quality downsampling
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Save the compressed image to a BytesIO object
        output = BytesIO()
        img.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)

        # Generate filename for compressed version
        original_name = os.path.splitext(uploaded_file.name)[0]
        compressed_name = f"{original_name}_compressed.jpg"

        # Create InMemoryUploadedFile
        compressed_file = InMemoryUploadedFile(
            output,
            'ImageField',
            compressed_name,
            'image/jpeg',
            sys.getsizeof(output),
            None
        )

        return compressed_file

    except Exception as e:
        print(f"Error compressing image: {e}")
        return None
