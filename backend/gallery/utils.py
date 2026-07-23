from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys
import os

def auto_orient_image(uploaded_file):
    """
    Reads EXIF orientation metadata from an uploaded image file (iPhone/Android/camera photo)
    and returns an InMemoryUploadedFile with pixels physically oriented upright (0°).
    """
    if not uploaded_file:
        return uploaded_file

    try:
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
        img = Image.open(uploaded_file)
        
        # Apply EXIF transpose to automatically rotate pixels upright based on EXIF tag
        transposed_img = ImageOps.exif_transpose(img)
        
        output = BytesIO()
        fmt = img.format if img.format else 'JPEG'
        
        if transposed_img.mode in ('RGBA', 'LA', 'P') and fmt.upper() in ('JPG', 'JPEG'):
            background = Image.new('RGB', transposed_img.size, (255, 255, 255))
            if transposed_img.mode == 'P':
                transposed_img = transposed_img.convert('RGBA')
            background.paste(transposed_img, mask=transposed_img.split()[-1] if transposed_img.mode in ('RGBA', 'LA') else None)
            transposed_img = background
        elif transposed_img.mode not in ('RGB', 'RGBA') and fmt.upper() in ('JPG', 'JPEG'):
            transposed_img = transposed_img.convert('RGB')

        transposed_img.save(output, format=fmt, quality=95, optimize=True)
        output.seek(0)

        filename = getattr(uploaded_file, 'name', 'image.jpg')
        content_type = getattr(uploaded_file, 'content_type', 'image/jpeg')

        return InMemoryUploadedFile(
            output,
            'ImageField',
            filename,
            content_type,
            sys.getsizeof(output),
            None
        )
    except Exception as e:
        print(f"Error auto orienting image: {e}")
        try:
            if hasattr(uploaded_file, 'seek'):
                uploaded_file.seek(0)
        except Exception:
            pass
        return uploaded_file


def compress_image(uploaded_file, quality=85, max_width=1920, max_height=1080):
    """
    Compress an uploaded image file with auto EXIF orientation transposing.
    """
    try:
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
        # Open the image and transpose according to EXIF orientation
        img = Image.open(uploaded_file)
        img = ImageOps.exif_transpose(img)

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


def get_or_create_rotated_image(raw_url_or_path, rotation):
    """
    Physically rotates an image file on disk using Pillow by specified clockwise angle (90, 180, 270)
    and returns the relative media URL of the rotated image file.

    Args:
        raw_url_or_path (str): Relative or absolute URL/path to the image file.
        rotation (int): Clockwise rotation angle in degrees (e.g. 90, 180, 270).

    Returns:
        str: Media URL of the rotated image, or original URL if rotation is 0 or error occurs.
    """
    if not raw_url_or_path:
        return raw_url_or_path

    deg = int(rotation or 0) % 360
    if deg == 0:
        return raw_url_or_path

    try:
        from django.conf import settings
        media_root = getattr(settings, 'MEDIA_ROOT', '')
        media_url = getattr(settings, 'MEDIA_URL', '/media/')

        clean_path = raw_url_or_path
        if clean_path.startswith("http://") or clean_path.startswith("https://"):
            # If absolute URL containing media_url, extract relative media path
            if media_url in clean_path:
                clean_path = clean_path.split(media_url, 1)[1]
            else:
                return raw_url_or_path

        if clean_path.startswith(media_url):
            clean_path = clean_path[len(media_url):]

        clean_path = clean_path.lstrip('/')
        abs_path = os.path.join(media_root, clean_path)

        if not os.path.exists(abs_path):
            return raw_url_or_path

        rotated_dir = os.path.join(media_root, 'rotated')
        os.makedirs(rotated_dir, exist_ok=True)

        filename, ext = os.path.splitext(os.path.basename(abs_path))
        rotated_filename = f"{filename}_rot{deg}{ext or '.jpg'}"
        rotated_abs_path = os.path.join(rotated_dir, rotated_filename)
        rotated_rel_url = f"{media_url.rstrip('/')}/rotated/{rotated_filename}"

        if os.path.exists(rotated_abs_path):
            return rotated_rel_url

        with Image.open(abs_path) as img:
            img = ImageOps.exif_transpose(img)
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            rotated_img = img.rotate(-deg, expand=True)
            rotated_img.save(rotated_abs_path, format='JPEG', quality=95, optimize=True)

        return rotated_rel_url

    except Exception as e:
        print(f"Error rotating image physically: {e}")
        return raw_url_or_path

