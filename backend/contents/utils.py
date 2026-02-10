from django.db.models import Count, Q
from users.models import User


def assign_to_least_busy_qa():
    """
    Encuentra el QA con menos requests asignados actualmente en status QA
    y retorna su ID. Si no hay QAs, retorna None.
    """
    qa_users = User.objects.filter(role='QA')

    if not qa_users.exists():
        return None

    # Contar requests activos en QA por cada QA
    qa_workload = qa_users.annotate(
        active_qa_count=Count(
            'qa_assigned_requests',
            filter=Q(qa_assigned_requests__status='QA')
        )
    ).order_by('active_qa_count')

    # Retornar el QA con menos carga
    return qa_workload.first().id if qa_workload.exists() else None


def suggest_content_creator(client_id):
    """
    Sugiere un content creator para un cliente basándose en:
    1. Historial previo (mantener relación)
    2. Carga de trabajo actual (balanceo)

    Returns: User ID del creator sugerido o None
    """
    from .models import MonthlyRequest

    # Paso 1: Buscar el último content creator asignado a este cliente
    last_assignment = MonthlyRequest.objects.filter(
        client_id=client_id,
        request_type=MonthlyRequest.RequestType.MONTHLY_CONTENT,
        assigned_to__isnull=False
    ).order_by('-month').first()

    if last_assignment and last_assignment.assigned_to:
        # Verificar que el creator siga activo y disponible
        if last_assignment.assigned_to.role == 'CONTENT_CREATOR':
            return last_assignment.assigned_to.id

    # Paso 2: No hay historial o creator no disponible, balancear carga
    content_creators = User.objects.filter(role='CONTENT_CREATOR')

    if not content_creators.exists():
        return None

    # Contar requests activos (TO_DO + IN_PROGRESS) por creator
    cc_workload = content_creators.annotate(
        active_request_count=Count(
            'assigned_monthly_requests',
            filter=Q(
                assigned_monthly_requests__status__in=['TO_DO', 'IN_PROGRESS'],
                assigned_monthly_requests__request_type='MONTHLY_CONTENT'
            )
        )
    ).order_by('active_request_count')

    return cc_workload.first().id
