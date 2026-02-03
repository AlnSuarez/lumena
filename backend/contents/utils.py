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
