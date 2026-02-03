from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from dateutil.relativedelta import relativedelta
from .models import MonthlyRequest
from .utils import assign_to_least_busy_qa

@receiver(post_save, sender=MonthlyRequest)
def create_next_month_request(sender, instance, created, **kwargs):
    """
    Automatically create the next month's request when the current month's
    request is marked as DONE.
    """
    if instance.status == MonthlyRequest.Status.DONE and instance.request_type == MonthlyRequest.RequestType.MONTHLY_CONTENT:
        # Calculate next month
        next_month_date = instance.month + relativedelta(months=1)
        
        # Check if next month's request already exists to avoid duplicates
        exists = MonthlyRequest.objects.filter(
            client=instance.client,
            month=next_month_date,
            request_type=MonthlyRequest.RequestType.MONTHLY_CONTENT
        ).exists()

        if not exists:
            # Create the new request
            MonthlyRequest.objects.create(
                client=instance.client,
                month=next_month_date,
                request_type=MonthlyRequest.RequestType.MONTHLY_CONTENT,
                status=MonthlyRequest.Status.TO_DO,
                # assigned_to is left blank intentionally for reassignment logic,
                # unless we want sticky assignment. Leaving blank for now.
            )


@receiver(pre_save, sender=MonthlyRequest)
def auto_assign_qa(sender, instance, **kwargs):
    """
    Cuando un request cambia a status QA, asigna automáticamente
    al QA con menos carga de trabajo.
    """
    if instance.pk:  # Solo si ya existe (update)
        try:
            old_instance = MonthlyRequest.objects.get(pk=instance.pk)

            # Detectar cambio a status QA
            if old_instance.status != 'QA' and instance.status == 'QA':
                # Asignar al QA con menos carga
                qa_id = assign_to_least_busy_qa()
                if qa_id:
                    instance.qa_assigned_to_id = qa_id

            # Detectar cambio de QA a IN_REVISION (rechazo)
            elif old_instance.status == 'QA' and instance.status == 'IN_REVISION':
                # Mantener assigned_to original, limpiar qa_assigned_to
                instance.qa_assigned_to = None

        except MonthlyRequest.DoesNotExist:
            pass
