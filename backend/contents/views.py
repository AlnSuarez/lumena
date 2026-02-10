from rest_framework import generics, permissions
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from .models import MonthlyRequest
from .serializers import MonthlyRequestSerializer
from .utils import suggest_content_creator, assign_to_least_busy_qa
from users.models import User

class MonthlyRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = MonthlyRequestSerializer
    permission_classes = [permissions.AllowAny] # Changed for dev/prototype without token auth

    def get_queryset(self):
        # In a real app, use self.request.user and IsAuthenticated
        # Here we rely on query param for "simulation"
        user_id = self.request.query_params.get('user_id')
        role = self.request.query_params.get('role') # Pass role from frontend

        queryset = MonthlyRequest.objects.filter(
            Q(available_from__isnull=True) | Q(available_from__lte=timezone.now().date())
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

        # QA: solo ve lo asignado a él en status QA
        elif role == "QA":
            return queryset.filter(
                qa_assigned_to_id=user_id,
                status='QA'
            )

        # Cualquier otro caso: vacío
        return MonthlyRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(_current_user=user)

class MonthlyRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MonthlyRequestSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Similar logic or just AllowAny for detail if ID is known
        return MonthlyRequest.objects.all()

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.instance._current_user = user
        serializer.save()


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
