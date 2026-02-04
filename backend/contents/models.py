from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class MonthlyRequest(models.Model):
    class Status(models.TextChoices):
        TO_DO = 'TO_DO', _('To Do')
        IN_PROGRESS = 'IN_PROGRESS', _('In Progress')
        QA = 'QA', _('QA')
        IN_REVISION = 'IN_REVISION', _('In Revision')
        DONE = 'DONE', _('Done')

    class RequestType(models.TextChoices):
        MONTHLY_CONTENT = 'MONTHLY_CONTENT', _('Monthly Content')
        VIDEO_SHOOT = 'VIDEO_SHOOT', _('Video Shoot')
        CONTENT_REQUEST = 'CONTENT_REQUEST', _('Content Request')

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='monthly_requests',
        limit_choices_to={'role': 'CLIENT'}
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='assigned_monthly_requests',
        null=True,
        blank=True,
        limit_choices_to={'role__in': ['SUPERUSER', 'CONTENT_CREATOR']},
        verbose_name=_("Assigned To")
    )
    qa_assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='qa_assigned_requests',
        limit_choices_to={'role': 'QA'},
        verbose_name=_("QA Assigned To")
    )
    month = models.DateField(help_text="The month this request is for (e.g., 2023-10-01)")
    request_type = models.CharField(
        max_length=50,
        choices=RequestType.choices,
        default=RequestType.MONTHLY_CONTENT,
        verbose_name=_("Request Type")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TO_DO
    )
    notes = models.TextField(blank=True, null=True)
    content_text = models.TextField(blank=True, null=True, verbose_name=_("Content Text"))
    ai_caption = models.TextField(blank=True, null=True, verbose_name=_("AI Caption"))
    feedback = models.TextField(blank=True, null=True, verbose_name=_("Feedback"))
    linked_image = models.ForeignKey(
        'gallery.ClientImage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_requests',
        verbose_name=_("Linked Gallery Image")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status
        self._original_content_text = self.content_text
        self._original_ai_caption = self.ai_caption
        self._original_feedback = self.feedback

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        
        status_changed = not is_new and self.status != self._original_status
        content_changed = not is_new and self.content_text != self._original_content_text
        caption_changed = not is_new and self.ai_caption != self._original_ai_caption
        feedback_changed = not is_new and self.feedback != self._original_feedback and self.feedback
        
        super().save(*args, **kwargs)

        history_notes = []

        if feedback_changed:
             history_notes.append(f"QA Feedback: {self.feedback}")

        if content_changed:
             history_notes.append(f"Content changes:\n- Previous: {self._original_content_text or '(empty)'}\n+ New: {self.content_text or '(empty)'}")

        if caption_changed:
             history_notes.append(f"Caption changes:\n- Previous: {self._original_ai_caption or '(empty)'}\n+ New: {self.ai_caption or '(empty)'}")

        if status_changed or content_changed or caption_changed or feedback_changed:
            final_notes = "\n\n".join(history_notes)
            
            # Use specific notes if we have them, otherwise fallback to "Status change" if it was just a status change without notes
            if not final_notes and status_changed:
                 final_notes = None # No extra notes, just the status change recorded by fields

            RequestHistory.objects.create(
                request=self,
                previous_status=self._original_status if status_changed else self.status,
                new_status=self.status,
                notes=final_notes,
                changed_by=getattr(self, '_current_user', None)
            )
        elif is_new:
             RequestHistory.objects.create(
                request=self,
                previous_status=None,
                new_status=self.status,
                notes="Initial creation",
                changed_by=getattr(self, '_current_user', None)
            )
        
        self._original_status = self.status
        self._original_content_text = self.content_text
        self._original_ai_caption = self.ai_caption
        self._original_feedback = self.feedback

    def __str__(self):
        return f"{self.client.username} - {self.month.strftime('%B %Y')}"

    class Meta:
        verbose_name = _("Monthly Request")
        verbose_name_plural = _("Monthly Requests")
        ordering = ['-month', 'client__username']

class RequestHistory(models.Model):
    request = models.ForeignKey(MonthlyRequest, on_delete=models.CASCADE, related_name='history')
    previous_status = models.CharField(max_length=50, null=True, blank=True)
    new_status = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

class ImagenProyecto(models.Model):
    imagen = models.ImageField(upload_to='galeria/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Imagen {self.id} - {self.imagen.name}"


