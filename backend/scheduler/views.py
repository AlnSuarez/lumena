from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from .models import ScheduledPost
from .serializers import ScheduledPostSerializer
from contents.models import MonthlyRequest
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


class SchedulePostView(generics.CreateAPIView):
    queryset = ScheduledPost.objects.all()
    serializer_class = ScheduledPostSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        user = _get_actor_from_request(request)

        content_id = request.data.get('content_id')
        client_id = request.data.get('client_id')
        platforms = request.data.get('platforms', [])
        schedule_date = request.data.get('schedule_date')
        release_time = request.data.get('release_time', '10:00')
        caption = request.data.get('caption', '')
        hashtags = request.data.get('hashtags', [])
        status_val = request.data.get('status', 'DRAFT')

        if not content_id or not client_id:
            return Response(
                {"error": "content_id and client_id are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            content = MonthlyRequest.objects.get(pk=content_id)
            client = User.objects.get(pk=client_id)
        except (MonthlyRequest.DoesNotExist, User.DoesNotExist) as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )

        if not platforms:
            return Response(
                {"error": "At least one platform is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        scheduled_at_str = f"{schedule_date} {release_time}"
        try:
            scheduled_at = timezone.datetime.fromisoformat(scheduled_at_str)
            if timezone.is_naive(scheduled_at):
                scheduled_at = timezone.make_aware(scheduled_at)
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date/time format."},
                status=status.HTTP_400_BAD_REQUEST
            )

        scheduled_post = ScheduledPost.objects.create(
            content=content,
            client=client,
            platforms=platforms,
            scheduled_at=scheduled_at,
            caption=caption,
            hashtags=hashtags,
            status=status_val,
            created_by=user,
        )

        serializer = self.get_serializer(scheduled_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ScheduledPostListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduledPostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        status_filter = self.request.query_params.get('status')
        client_id = self.request.query_params.get('client_id')

        queryset = ScheduledPost.objects.all()

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if user_id:
            queryset = queryset.filter(client_id=user_id)

        return queryset

    def perform_create(self, serializer):
        user = _get_actor_from_request(self.request)
        serializer.save(created_by=user)


class ScheduledPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ScheduledPost.objects.all()
    serializer_class = ScheduledPostSerializer
    permission_classes = [permissions.AllowAny]

    def perform_update(self, serializer):
        user = _get_actor_from_request(self.request)
        serializer.save(created_by=user)
