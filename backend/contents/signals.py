from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from .models import MonthlyRequest
from .utils import assign_to_least_busy_qa, suggest_content_creator

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
            # Sugerir content creator basado en historial/carga
            suggested_creator_id = suggest_content_creator(instance.client.id)

            # Create the new request with suggested assignment and 1 month delay timer
            MonthlyRequest.objects.create(
                client=instance.client,
                month=next_month_date,
                request_type=MonthlyRequest.RequestType.MONTHLY_CONTENT,
                status=MonthlyRequest.Status.TO_DO,
                assigned_to_id=suggested_creator_id,
                notes=f"Suggested assignment - requires confirmation" if suggested_creator_id else None,
                available_from=timezone.now().date() + relativedelta(months=1) # Timer: 1 month from completion
            )


@receiver(post_save, sender='users.User')
def create_initial_request_for_new_client(sender, instance, created, **kwargs):
    """
    Ensure every new client gets their first Monthly Request immediately.
    """
    if created and instance.role == 'CLIENT':
        # Check if request exists just in case
        if not MonthlyRequest.objects.filter(client=instance).exists():
            current_month = timezone.now().date().replace(day=1)
            
            # Suggest creator
            suggested_creator_id = suggest_content_creator(instance.id)

            MonthlyRequest.objects.create(
                client=instance,
                month=current_month,
                request_type=MonthlyRequest.RequestType.MONTHLY_CONTENT,
                status=MonthlyRequest.Status.TO_DO,
                assigned_to_id=suggested_creator_id,
                notes="Initial Request",
                available_from=timezone.now().date() # Available immediately
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
