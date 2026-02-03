from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERUSER = "SUPERUSER", _("Superuser")
        QA = "QA", _("QA")
        CLIENT = "CLIENT", _("Client")
        CONTENT_CREATOR = "CONTENT_CREATOR", _("Content Creator")
        EDITOR = "EDITOR", _("Editor")

    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.CONTENT_CREATOR,
        verbose_name=_("Role")
    )

    access_permissions = models.JSONField(default=dict, blank=True, verbose_name=_("Access Permissions"))

    def save(self, *args, **kwargs):
        if self.role == self.Role.SUPERUSER:
            self.is_superuser = True
            self.is_staff = True
        super().save(*args, **kwargs)

class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    
    # 1. Client Basics
    practice_name = models.CharField(max_length=255, blank=True)
    primary_contact = models.CharField(max_length=255, blank=True)
    role_title = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    practice_address = models.TextField(blank=True)
    time_zone = models.CharField(max_length=100, blank=True)

    # 2. Industry & Practice Details
    medical_specialty = models.CharField(max_length=255, blank=True)
    sub_specialty = models.CharField(max_length=255, blank=True)
    practice_type = models.CharField(max_length=100, blank=True)  # Private, Group, Clinic, etc.
    target_patient_type = models.TextField(blank=True)

    # 3. Brand Assets
    logo = models.ImageField(upload_to='client_logos/', blank=True, null=True)
    brand_colors = models.TextField(blank=True, help_text="Comma separated or description")
    brand_fonts = models.TextField(blank=True)
    website_url = models.URLField(blank=True)
    social_media_links = models.TextField(blank=True)

    # 4. Brand Pillars
    primary_brand_pillars = models.TextField(blank=True)

    # 5. Voice & Tone
    overall_voice = models.CharField(max_length=255, blank=True)
    emojis = models.CharField(max_length=100, blank=True) # Yes/No/Limited
    humor = models.CharField(max_length=100, blank=True) # Yes/No/Subtle
    formality_level = models.CharField(max_length=100, blank=True) # High/Medium/Low
    words_to_use = models.TextField(blank=True)
    words_to_avoid = models.TextField(blank=True)
    doctor_voice_preference = models.TextField(blank=True)

    # 6. Content Boundaries & Compliance
    topics_to_emphasize = models.TextField(blank=True)
    topics_to_avoid = models.TextField(blank=True)
    medical_claims_limitations = models.TextField(blank=True)
    hipaa_considerations = models.TextField(blank=True)
    faces_allowed = models.CharField(max_length=50, blank=True) # Yes/No
    testimonials_allowed = models.CharField(max_length=50, blank=True) # Yes/No
    consent_required = models.CharField(max_length=50, blank=True) # Yes/No

    # 7. Goals & KPIs
    primary_goal = models.TextField(blank=True)
    secondary_goals = models.TextField(blank=True)
    kpis_to_track = models.TextField(blank=True)
    success_looks_like = models.TextField(blank=True)

    # 8. Communication Preferences (Using 8 to match images section 10, skipping 9 if missing in my internal logic but images had 9 as Goals)
    communication_channel = models.CharField(max_length=100, blank=True) # Email, Slack, etc.
    feedback_style = models.CharField(max_length=100, blank=True) # Written, Call, etc.

    def __str__(self):
        return f"Profile for {self.user.username}"
