from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework import permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import ClientFolder, ClientImage, SharedDocument, SHARED_CONTENT_FOLDER_NAME
from .serializers import ClientFolderSerializer, ClientImageSerializer, SharedDocumentSerializer
from .permissions import IsSuperUser
from .utils import compress_image

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_client_folders(request, client_id):
    """List all folders for a client"""
    folders = ClientFolder.objects.filter(client_id=client_id)
    serializer = ClientFolderSerializer(folders, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_client_folder(request, client_id):
    """Create a new folder for a client"""
    print(f"DEBUG: create_client_folder called by user: {request.user} for client_id: {client_id}")
    print(f"DEBUG: Request data: {request.data}")
    
    folder_name = request.data.get('folder_name')

    if not folder_name:
        print("DEBUG: folder_name is missing")
        return Response(
            {'error': 'folder_name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if folder_name.lower() == SHARED_CONTENT_FOLDER_NAME:
        return Response(
            {'error': 'This folder name is reserved'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if folder already exists
    if ClientFolder.objects.filter(client_id=client_id, folder_name=folder_name).exists():
        print("DEBUG: Folder already exists")
        return Response(
            {'error': 'Folder with this name already exists for this client'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        folder = ClientFolder.objects.create(
            client_id=client_id,
            folder_name=folder_name,
            created_by=request.user
        )
        serializer = ClientFolderSerializer(folder, context={'request': request})
        print("DEBUG: Folder created successfully")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        print(f"DEBUG: Exception creating folder: {e}")
        return Response(
            {'error': f'Server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def get_or_create_shared_content_folder(request, client_id):
    """Get or auto-create the 'shared content' folder for a client"""
    folder, created = ClientFolder.objects.get_or_create(
        client_id=client_id,
        folder_name=SHARED_CONTENT_FOLDER_NAME,
        defaults={
            'created_by': request.user,
            'is_system_folder': True,
        }
    )
    serializer = ClientFolderSerializer(folder, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_shared_content(request, client_id):
    """List all images AND shared documents in the 'shared content' folder for a client"""
    folder = ClientFolder.objects.filter(
        client_id=client_id,
        folder_name=SHARED_CONTENT_FOLDER_NAME
    ).first()
    if not folder:
        return Response([])
    images = folder.images.all()
    docs = folder.shared_documents.all()
    image_data = ClientImageSerializer(images, many=True, context={'request': request}).data
    doc_data = SharedDocumentSerializer(docs, many=True, context={'request': request}).data

    for item in image_data:
        item['_type'] = 'image'
    for item in doc_data:
        item['_type'] = 'document'

    combined = sorted(
        image_data + doc_data,
        key=lambda x: x.get('uploaded_at', ''),
        reverse=True
    )
    return Response(combined)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_client_folder(request, folder_id):
    """Delete a folder (optional endpoint)"""
    folder = get_object_or_404(ClientFolder, id=folder_id)
    if folder.is_system_folder:
        return Response(
            {'error': 'System folders cannot be deleted'},
            status=status.HTTP_403_FORBIDDEN
        )
    folder.delete()
    return Response(
        {'message': 'Folder deleted successfully'},
        status=status.HTTP_204_NO_CONTENT
    )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_folder_images(request, folder_id):
    """List all images in a folder"""
    folder = get_object_or_404(ClientFolder, id=folder_id)
    images = folder.images.all()
    serializer = ClientImageSerializer(images, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_folder_images(request, folder_id):
    """Upload multiple images to a folder with compression"""
    folder = get_object_or_404(ClientFolder, id=folder_id)
    files = request.FILES.getlist('images')

    if not files:
        return Response(
            {'error': 'No images provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    created_images = []
    errors = []

    for file in files:
        try:
            # Create compressed version
            compressed_file = compress_image(file)

            # Create the image object with both original and compressed versions
            image = ClientImage.objects.create(
                folder=folder,
                image=file,
                image_compressed=compressed_file,
                uploaded_by=request.user
            )
            created_images.append(image)
        except Exception as e:
            errors.append({
                'filename': file.name,
                'error': str(e)
            })

    # Return response with created images and any errors
    response_data = {
        'images': ClientImageSerializer(created_images, many=True, context={'request': request}).data,
    }

    if errors:
        response_data['errors'] = errors
        response_data['message'] = f'{len(created_images)} images uploaded successfully, {len(errors)} failed'

    if created_images:
        return Response(response_data, status=status.HTTP_201_CREATED)

    return Response(
        {
            'error': 'All uploads failed',
            'message': 'No image could be processed. Check file type/format and try again.',
            'details': errors
        },
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_shared_documents(request, client_id):
    """Upload any file type to the shared content folder"""
    folder = ClientFolder.objects.filter(
        client_id=client_id,
        folder_name=SHARED_CONTENT_FOLDER_NAME
    ).first()
    if not folder:
        folder = ClientFolder.objects.create(
            client_id=client_id,
            folder_name=SHARED_CONTENT_FOLDER_NAME,
            created_by=request.user,
            is_system_folder=True,
        )

    files = request.FILES.getlist('files')
    if not files:
        return Response({'error': 'No files provided'}, status=status.HTTP_400_BAD_REQUEST)

    created = []
    errors = []
    for f in files:
        try:
            doc = SharedDocument.objects.create(
                folder=folder,
                file=f,
                uploaded_by=request.user,
            )
            created.append(doc)
        except Exception as e:
            errors.append({'filename': f.name, 'error': str(e)})

    data = {'documents': SharedDocumentSerializer(created, many=True, context={'request': request}).data}
    if errors:
        data['errors'] = errors
    return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_shared_document(request, doc_id):
    doc = get_object_or_404(SharedDocument, id=doc_id)
    try:
        doc.file.delete()
    except Exception as e:
        print(f"Warning: Failed to delete physical file from storage: {e}")
    doc.delete()
    return Response({'message': 'Document deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_image(request, image_id):
    """Delete an image"""
    image = get_object_or_404(ClientImage, id=image_id)
    try:
        # Delete from storage first
        image.image.delete()
    except Exception as e:
        print(f"Warning: Failed to delete physical file from storage: {e}")
    # Then delete from database
    image.delete()
    return Response(
        {'message': 'Image deleted successfully'},
        status=status.HTTP_204_NO_CONTENT
    )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_image_by_folio(request):
    """Search for an image by folio number"""
    folio = request.GET.get('folio', '').strip()

    if not folio:
        return Response(
            {'error': 'Folio parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        image = ClientImage.objects.get(folio=folio)
        serializer = ClientImageSerializer(image, context={'request': request})
        return Response(serializer.data)
    except ClientImage.DoesNotExist:
        return Response(
            {'error': f'No image found with folio: {folio}'},
            status=status.HTTP_404_NOT_FOUND
        )
