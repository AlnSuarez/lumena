from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, authentication_classes, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Q, Count
from django.conf import settings
import base64
import json
import os
import socket
import uuid
from urllib import request as urlrequest
from urllib.error import URLError, HTTPError
from .models import MonthlyRequest, LetsTalkSubmission, ContentItem
from .serializers import (
    MonthlyRequestSerializer,
    MonthlyRequestCreateSerializer,
    LetsTalkSubmissionCreateSerializer,
    LetsTalkSubmissionAdminSerializer,
)
from .utils import suggest_content_creator, assign_to_least_busy_qa
from users.models import User

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5vl:7b")
OLLAMA_FALLBACK_MODEL = os.getenv("OLLAMA_FALLBACK_MODEL", "qwen2.5vl:3b")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "240"))


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


def _get_admin_actor_from_request(request):
    if request.user and request.user.is_authenticated and request.user.role == User.Role.SUPERUSER:
        return request.user

    user_id = request.query_params.get('user_id') or request.data.get('user_id')
    if not user_id:
        return None

    try:
        user = User.objects.get(id=user_id)
    except (User.DoesNotExist, ValueError, TypeError):
        return None

    return user if user.role == User.Role.SUPERUSER else None


def _to_abs_url(django_request, maybe_relative_url):
    if not maybe_relative_url:
        return None
    if maybe_relative_url.startswith("http://") or maybe_relative_url.startswith("https://"):
        return maybe_relative_url
    return django_request.build_absolute_uri(maybe_relative_url)


def _download_image_b64(image_url):
    with urlrequest.urlopen(image_url, timeout=20) as response:
        return base64.b64encode(response.read()).decode("utf-8")


def _build_client_context(client):
    profile = getattr(client, "client_profile", None)
    if not profile:
        return "Client profile not available."

    context_bits = [
        f"Practice: {profile.practice_name or 'N/A'}",
        f"Specialty: {profile.medical_specialty or 'N/A'}",
        f"Voice: {profile.overall_voice or 'N/A'}",
        f"Formality: {profile.formality_level or 'N/A'}",
        f"Primary goal: {profile.primary_goal or 'N/A'}",
        f"Words to use: {profile.words_to_use or 'N/A'}",
        f"Words to avoid: {profile.words_to_avoid or 'N/A'}",
        f"Topics to emphasize: {profile.topics_to_emphasize or 'N/A'}",
        f"Topics to avoid: {profile.topics_to_avoid or 'N/A'}",
        f"Medical claim limitations: {profile.medical_claims_limitations or 'N/A'}",
    ]
    return "\n".join(context_bits)


@api_view(['POST'])
def generate_caption(request, pk):
    """
    Generate a social caption using local Ollama model with:
    - linked image
    - request requirements/instructions
    - client profile context
    """
    try:
        monthly_request = MonthlyRequest.objects.select_related('client', 'linked_image').get(pk=pk)
    except MonthlyRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    if not monthly_request.linked_image:
        return Response(
            {"error": "No linked image found for this request. Link an image first."},
            status=status.HTTP_400_BAD_REQUEST
        )

    incoming_requirements = (request.data.get('requirements') or '').strip()
    incoming_content_text = (request.data.get('content_text') or '').strip()

    requirements = incoming_requirements or monthly_request.notes or monthly_request.content_text or ""
    content_text = incoming_content_text or monthly_request.content_text or ""
    if not requirements and not content_text:
        return Response(
            {"error": "Provide requirements or content text to generate a caption."},
            status=status.HTTP_400_BAD_REQUEST
        )

    image_obj = monthly_request.linked_image
    image_url = _to_abs_url(
        request,
        image_obj.image_compressed.url if getattr(image_obj, "image_compressed", None) else image_obj.image.url
    )

    try:
        image_b64 = _download_image_b64(image_url)
    except (URLError, HTTPError, ValueError) as exc:
        return Response(
            {"error": f"Unable to load linked image for AI generation: {exc}"},
            status=status.HTTP_400_BAD_REQUEST
        )

    client_context = _build_client_context(monthly_request.client)

    system_prompt = (
        "You are an expert social media copywriter for healthcare and professional service brands. "
        "Write one high-quality caption in Spanish based on the provided image and requirements. "
        "Use a clear hook, value-focused body, and soft CTA. Keep it natural and human. "
        "Respect compliance constraints (no risky medical claims, no guaranteed outcomes). "
        "Output only the caption text, no markdown, no quotes, no labels."
    )

    user_prompt = (
        f"Client context:\n{client_context}\n\n"
        f"Requirements:\n{requirements or 'N/A'}\n\n"
        f"Draft content/context:\n{content_text or 'N/A'}\n\n"
        "Task:\n"
        "- Analyze the attached image and align the caption with what is visually happening.\n"
        "- Keep it concise: 70 to 140 words.\n"
        "- Include at most 1 emoji.\n"
        "- End with a subtle CTA.\n"
    )

    def call_ollama(model_name):
        payload = {
            "model": model_name,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt, "images": [image_b64]},
            ],
            "options": {
                "temperature": 0.6,
                "num_predict": 220,
                "num_ctx": 1536,
            },
        }

        req = urlrequest.Request(
            f"{OLLAMA_BASE_URL}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlrequest.urlopen(req, timeout=OLLAMA_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))

    used_model = OLLAMA_MODEL
    try:
        ollama_data = call_ollama(OLLAMA_MODEL)
    except (socket.timeout, TimeoutError):
        if OLLAMA_FALLBACK_MODEL and OLLAMA_FALLBACK_MODEL != OLLAMA_MODEL:
            try:
                used_model = OLLAMA_FALLBACK_MODEL
                ollama_data = call_ollama(OLLAMA_FALLBACK_MODEL)
            except Exception as fallback_exc:
                return Response(
                    {
                        "error": "AI generation timed out on primary model and fallback failed.",
                        "details": str(fallback_exc),
                    },
                    status=status.HTTP_504_GATEWAY_TIMEOUT
                )
        else:
            return Response(
                {"error": "AI generation timed out. Try again or use a lighter model."},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
    except HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        return Response(
            {"error": f"Ollama error ({exc.code})", "details": error_body},
            status=status.HTTP_502_BAD_GATEWAY
        )
    except URLError as exc:
        reason = str(getattr(exc, "reason", exc))
        if "timed out" in reason.lower() and OLLAMA_FALLBACK_MODEL and OLLAMA_FALLBACK_MODEL != OLLAMA_MODEL:
            try:
                used_model = OLLAMA_FALLBACK_MODEL
                ollama_data = call_ollama(OLLAMA_FALLBACK_MODEL)
            except Exception as fallback_exc:
                return Response(
                    {
                        "error": "AI generation timed out on primary model and fallback failed.",
                        "details": str(fallback_exc),
                    },
                    status=status.HTTP_504_GATEWAY_TIMEOUT
                )
        else:
            return Response(
                {"error": f"Cannot connect to Ollama at {OLLAMA_BASE_URL}: {reason}"},
                status=status.HTTP_502_BAD_GATEWAY
            )
    except Exception as exc:
        return Response(
            {"error": f"Unexpected AI generation error: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    caption = (ollama_data.get("message", {}) or {}).get("content", "").strip()
    if not caption:
        return Response(
            {"error": "Ollama returned an empty caption."},
            status=status.HTTP_502_BAD_GATEWAY
        )

    monthly_request.ai_caption = caption
    monthly_request._current_user = _get_actor_from_request(request)
    monthly_request.save()

    return Response({
        "caption": caption,
        "model": used_model,
        "request_id": monthly_request.id,
    })


class MonthlyRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny] # Changed for dev/prototype without token auth

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MonthlyRequestCreateSerializer
        return MonthlyRequestSerializer

    def get_queryset(self):
        # In a real app, use self.request.user and IsAuthenticated
        # Here we rely on query param for "simulation"
        user_id = self.request.query_params.get('user_id')
        role = self.request.query_params.get('role') # Pass role from frontend

        queryset = MonthlyRequest.objects.filter(
            Q(available_from__isnull=True) | 
            Q(available_from__lte=timezone.now().date()) |
            ~Q(status='TO_DO')
        )

        if role == "SUPERUSER":
            return queryset

        if not user_id or not role:
            return MonthlyRequest.objects.none()

        # CONTENT_CREATOR: solo ven lo asignado a ellos
        if role == "CONTENT_CREATOR":
            return queryset.filter(assigned_to_id=user_id)

        # CLIENT: solo ve lo que creó
        elif role == "CLIENT":
            return queryset.filter(client_id=user_id)

        # QA: ve lo asignado a él o lo que no esté asignado a ningún QA
        elif role == "QA":
            return queryset.filter(
                Q(qa_assigned_to_id=user_id) | Q(qa_assigned_to__isnull=True),
                status='QA'
            )

        # Cualquier otro caso: vacío
        return MonthlyRequest.objects.none()

    def perform_create(self, serializer):
        user = _get_actor_from_request(self.request)
        serializer.save(_current_user=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        read_serializer = MonthlyRequestSerializer(instance, context=self.get_serializer_context())
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

class MonthlyRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return MonthlyRequestCreateSerializer
        return MonthlyRequestSerializer

    def get_queryset(self):
        # Similar logic or just AllowAny for detail if ID is known
        return MonthlyRequest.objects.all()

    def perform_update(self, serializer):
        user = _get_actor_from_request(self.request)
        serializer.instance._current_user = user
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        read_serializer = MonthlyRequestSerializer(instance, context=self.get_serializer_context())
        return Response(read_serializer.data)


@api_view(['POST'])
def confirm_assignment(request, pk):
    """
    Confirma la asignación sugerida.
    Limpia el note de "Suggested assignment".
    """
    try:
        monthly_request = MonthlyRequest.objects.get(pk=pk)
    except MonthlyRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    # Validar que tenga un assigned_to
    if not monthly_request.assigned_to:
        return Response({"error": "No assignment to confirm"}, status=400)

    # Limpiar el note de sugerencia
    if monthly_request.notes and "Suggested assignment" in monthly_request.notes:
        monthly_request.notes = ""
        monthly_request._current_user = _get_actor_from_request(request)
        monthly_request.save(update_fields=['notes'])

    serializer = MonthlyRequestSerializer(monthly_request)
    return Response(serializer.data)


@api_view(['POST'])
def reassign_creator(request, pk):
    """
    Reasigna manualmente un content creator.
    Puede recibir un creator_id específico o 'suggest' para regenerar sugerencia.
    """
    try:
        monthly_request = MonthlyRequest.objects.get(pk=pk)
    except MonthlyRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    new_creator_id = request.data.get('creator_id')

    if new_creator_id == 'suggest':
        # Regenerar sugerencia
        suggested_id = suggest_content_creator(monthly_request.client.id)
        if not suggested_id:
            return Response({"error": "No creators available"}, status=400)
        new_creator_id = suggested_id
        monthly_request.notes = "Suggested assignment - requires confirmation"
    else:
        # Validar que sea un content creator válido
        try:
            creator = User.objects.get(id=new_creator_id, role='CONTENT_CREATOR')
        except User.DoesNotExist:
            return Response({"error": "Invalid creator"}, status=400)
        monthly_request.notes = ""  # Limpiar sugerencia

    monthly_request.assigned_to_id = new_creator_id
    monthly_request._current_user = _get_actor_from_request(request)
    monthly_request.save()

    serializer = MonthlyRequestSerializer(monthly_request)
    return Response(serializer.data)


@api_view(['POST'])
def reassign_qa(request, pk):
    """
    Reasigna manualmente un QA.
    Puede recibir un qa_id específico o 'auto' para usar la lógica de menor carga.
    """
    try:
        monthly_request = MonthlyRequest.objects.get(pk=pk)
    except MonthlyRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    new_qa_id = request.data.get('qa_id')

    if new_qa_id == 'auto':
        # Usar lógica de 'least busy'
        best_qa_id = assign_to_least_busy_qa()
        if not best_qa_id:
             return Response({"error": "No QAs available"}, status=400)
        new_qa_id = best_qa_id
    else:
        # Validar que sea un QA válido
        try:
            qa_user = User.objects.get(id=new_qa_id, role='QA')
        except User.DoesNotExist:
            return Response({"error": "Invalid QA user"}, status=400)

    monthly_request.qa_assigned_to_id = new_qa_id
    monthly_request._current_user = _get_actor_from_request(request)
    monthly_request.save()

    serializer = MonthlyRequestSerializer(monthly_request)
    return Response(serializer.data)


@api_view(['GET'])
def creator_workload_stats(request):
    """
    Retorna estadísticas de carga de trabajo para cada content creator.
    Útil para el panel administrativo.
    """
    content_creators = User.objects.filter(role='CONTENT_CREATOR')

    stats = []
    for creator in content_creators:
        active_count = MonthlyRequest.objects.filter(
            assigned_to=creator,
            status__in=['TO_DO', 'IN_PROGRESS'],
            request_type='MONTHLY_CONTENT'
        ).count()

        pending_confirmation = MonthlyRequest.objects.filter(
            assigned_to=creator,
            notes__icontains="Suggested assignment"
        ).count()

        completed_this_month = MonthlyRequest.objects.filter(
            assigned_to=creator,
            status='DONE',
            updated_at__month=timezone.now().month
        ).count()

        stats.append({
            'creator': {
                'id': creator.id,
                'username': creator.username,
                'email': creator.email
            },
            'active_requests': active_count,
            'pending_confirmation': pending_confirmation,
            'completed_this_month': completed_this_month
        })

    return Response(stats)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def create_lets_talk_submission(request):
    serializer = LetsTalkSubmissionCreateSerializer(data=request.data)
    if serializer.is_valid():
        submission = serializer.save()
        return Response(
            {
                "message": "Submission received.",
                "id": submission.id,
            },
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_lets_talk_submissions(request):
    admin_user = _get_admin_actor_from_request(request)
    if not admin_user:
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    submissions = LetsTalkSubmission.objects.select_related('reviewed_by').all()
    serializer = LetsTalkSubmissionAdminSerializer(submissions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@authentication_classes([])
@permission_classes([AllowAny])
def upload_attachment(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(file.name)[1] or '.jpg'
    filename = f"attachments/{uuid.uuid4().hex}{ext}"
    dest = settings.MEDIA_ROOT / filename
    os.makedirs(dest.parent, exist_ok=True)
    with open(dest, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)

    url = request.build_absolute_uri(f"{settings.MEDIA_URL}{filename}")
    return Response({"url": url, "filename": file.name}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_content_video(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    if not file.content_type.startswith('video/'):
        return Response({"error": "File must be a video."}, status=status.HTTP_400_BAD_REQUEST)

    ext = '.mp4'
    filename = f"videos/{uuid.uuid4().hex}{ext}"
    dest = settings.MEDIA_ROOT / filename
    os.makedirs(dest.parent, exist_ok=True)
    with open(dest, 'wb') as f:
        for chunk in file.chunks():
            f.write(chunk)

    url = request.build_absolute_uri(f"{settings.MEDIA_URL}{filename}")
    return Response({"url": url, "filename": file.name}, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
def mark_lets_talk_submission_reviewed(request, pk):
    admin_user = _get_admin_actor_from_request(request)
    if not admin_user:
        return Response({"error": "Admin access required."}, status=status.HTTP_403_FORBIDDEN)

    try:
        submission = LetsTalkSubmission.objects.get(pk=pk)
    except LetsTalkSubmission.DoesNotExist:
        return Response({"error": "Submission not found."}, status=status.HTTP_404_NOT_FOUND)

    reviewed = request.data.get('reviewed', True)
    reviewed_bool = str(reviewed).lower() not in ['false', '0', 'no']

    submission.reviewed = reviewed_bool
    if reviewed_bool:
        submission.reviewed_at = timezone.now()
        submission.reviewed_by = admin_user
    else:
        submission.reviewed_at = None
        submission.reviewed_by = None
    submission.save(update_fields=['reviewed', 'reviewed_at', 'reviewed_by'])

    serializer = LetsTalkSubmissionAdminSerializer(submission)
    return Response(serializer.data)
