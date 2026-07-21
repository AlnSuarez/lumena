from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from .models import ChatMessage
from .serializers import ChatMessageSerializer, ChatMessageCreateSerializer
from users.models import User


def _get_actor_from_request(request):
    if request.user and request.user.is_authenticated:
        return request.user

    user_id = request.query_params.get('user_id') or request.data.get('user_id')
    if not user_id:
        return None

    try:
        return User.objects.get(id=user_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return None


def _is_admin(user):
    return user and user.role in ['SUPERUSER', 'ADMIN']


@csrf_exempt
@api_view(['GET'])
def list_chat_contacts(request):
    user = _get_actor_from_request(request)
    if not user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if _is_admin(user):
        clients = ChatMessage.objects.values('client', 'client__username').distinct()
        contacts = {}
        for c in clients:
            msgs = ChatMessage.objects.filter(
                client_id=c['client'],
                is_deleted_by_admin=False
            )
            last_msg = msgs.order_by('-created_at').first()
            unread = msgs.filter(is_read=False).exclude(sender=user).count()
            contacts[c['client']] = {
                'contact_id': c['client'],
                'contact_name': c['client__username'],
                'last_message': last_msg.message[:100] if last_msg else '',
                'last_message_at': last_msg.created_at if last_msg else None,
                'unread_count': unread
            }
        return Response(list(contacts.values()))

    elif user.role == 'CLIENT':
        msgs = ChatMessage.objects.filter(client=user, is_deleted_by_admin=False)
        last_msg = msgs.order_by('-created_at').first()
        unread = msgs.filter(is_read=False).exclude(sender=user).count()
        return Response([{
            'contact_id': user.id,
            'contact_name': 'Chat',
            'last_message': last_msg.message[:100] if last_msg else '',
            'last_message_at': last_msg.created_at if last_msg else None,
            'unread_count': unread
        }])

    return Response([], status=status.HTTP_403_FORBIDDEN)


@csrf_exempt
@api_view(['GET'])
def get_chat_messages(request, contact_id):
    user = _get_actor_from_request(request)
    if not user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if _is_admin(user):
        messages = ChatMessage.objects.filter(
            client_id=contact_id,
            is_deleted_by_admin=False
        )
    elif user.role == 'CLIENT':
        messages = ChatMessage.objects.filter(
            client=user,
            is_deleted_by_admin=False
        )
    else:
        return Response([], status=status.HTTP_403_FORBIDDEN)

    serializer = ChatMessageSerializer(messages, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
def send_chat_message(request):
    user = _get_actor_from_request(request)
    if not user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    data = request.data.copy()
    if _is_admin(user):
        if 'client' not in data:
            return Response({'error': 'client is required'}, status=status.HTTP_400_BAD_REQUEST)
    elif user.role == 'CLIENT':
        data['client'] = user.id
    else:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ChatMessageCreateSerializer(data=data)
    if serializer.is_valid():
        message = serializer.save(sender=user)
        return Response(ChatMessageSerializer(message).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['PATCH'])
def mark_messages_read(request, contact_id):
    user = _get_actor_from_request(request)
    if not user:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    now = timezone.now()
    if _is_admin(user):
        updated = ChatMessage.objects.filter(
            client_id=contact_id,
            is_read=False,
            is_deleted_by_admin=False
        ).exclude(sender=user).update(is_read=True, read_at=now)
    elif user.role == 'CLIENT':
        updated = ChatMessage.objects.filter(
            client=user,
            is_read=False,
            is_deleted_by_admin=False
        ).exclude(sender=user).update(is_read=True, read_at=now)
    else:
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    return Response({'marked_read': updated})


@csrf_exempt
@api_view(['DELETE'])
def delete_conversation(request, contact_id):
    user = _get_actor_from_request(request)
    if not user or not _is_admin(user):
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    deleted, _ = ChatMessage.objects.filter(
        client_id=contact_id,
        is_deleted_by_admin=False
    ).update(is_deleted_by_admin=True)

    return Response({'deleted': deleted})
