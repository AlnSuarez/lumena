from datetime import date

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from contents.models import MonthlyRequest, ContentItem, PipelineSettings
from scheduler.models import ScheduledPost
from users.models import User
from contents.pipeline import mark_request_done_if_published


def _make_user(username, role, email=None):
    user = User(
        username=username,
        email=email or f"{username}@lumena.test",
        role=role,
    )
    user.set_password("pass12345")
    user.save()
    return user


class PipelineTransitionTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = _make_user("admin", User.Role.SUPERUSER)
        self.creator = _make_user("creator", User.Role.CONTENT_CREATOR)
        self.qa = _make_user("qa", User.Role.QA)
        self.client_user = _make_user("clinic", User.Role.CLIENT)
        PipelineSettings.objects.all().delete()
        PipelineSettings.objects.create(pk=1, require_qa_review=True)
        self.request_obj = MonthlyRequest.objects.create(
            client=self.client_user,
            assigned_to=self.creator,
            month=date(2026, 9, 1),
            status=MonthlyRequest.Status.IN_PROGRESS,
        )
        ContentItem.objects.create(
            request=self.request_obj,
            media_type=ContentItem.MediaType.IMAGE,
            file_url="https://example.com/photo.jpg",
        )

    def test_creator_cannot_skip_to_approved(self):
        self.api.force_authenticate(user=self.creator)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"status": "APPROVED"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, MonthlyRequest.Status.IN_PROGRESS)

    def test_creator_sends_to_qa_when_qa_is_required(self):
        self.api.force_authenticate(user=self.creator)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"status": "QA"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, MonthlyRequest.Status.QA)

    def test_creator_cannot_skip_qa_when_required(self):
        self.api.force_authenticate(user=self.creator)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"status": "CLIENT_REVIEW"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_send_without_media_is_rejected(self):
        bare = MonthlyRequest.objects.create(
            client=self.client_user,
            assigned_to=self.creator,
            month=date(2026, 10, 1),
            status=MonthlyRequest.Status.IN_PROGRESS,
        )
        self.api.force_authenticate(user=self.creator)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{bare.id}/",
            {"status": "QA"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("media", response.json().get("error", "").lower())

    def test_qa_deny_requires_feedback(self):
        self.request_obj.status = MonthlyRequest.Status.QA
        self.request_obj.qa_assigned_to = self.qa
        self.request_obj.save()
        self.api.force_authenticate(user=self.qa)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"status": "IN_REVISION"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        ok = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"status": "IN_REVISION", "feedback": "Please recrop the hero photo."},
            format="json",
        )
        self.assertEqual(ok.status_code, 200)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, MonthlyRequest.Status.IN_REVISION)

    def test_client_can_approve_from_review(self):
        self.request_obj.status = MonthlyRequest.Status.CLIENT_REVIEW
        self.request_obj.save()
        self.api.force_authenticate(user=self.client_user)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"status": "APPROVED"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, MonthlyRequest.Status.APPROVED)

    def test_empty_content_items_does_not_wipe_media(self):
        self.api.force_authenticate(user=self.creator)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"content_text": "Kept caption", "content_items": []},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.request_obj.content_items.count(), 1)

    def test_ai_caption_is_persisted(self):
        self.api.force_authenticate(user=self.creator)
        response = self.api.patch(
            f"/api/contents/monthly-requests/{self.request_obj.id}/",
            {"ai_caption": "Edited caption for Instagram"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.ai_caption, "Edited caption for Instagram")

    def test_schedule_rejects_non_approved_content(self):
        self.api.force_authenticate(user=self.admin)
        response = self.api.post(
            "/api/scheduler/schedule/",
            {
                "content_id": self.request_obj.id,
                "client_id": self.client_user.id,
                "platforms": ["instagram"],
                "schedule_date": "2026-09-02",
                "release_time": "10:00",
                "status": "SCHEDULED",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_publish_marks_approved_content_done(self):
        self.request_obj.status = MonthlyRequest.Status.APPROVED
        self.request_obj.save()
        post = ScheduledPost.objects.create(
            content=self.request_obj,
            client=self.client_user,
            platforms=["instagram"],
            scheduled_at=timezone.now(),
            status=ScheduledPost.Status.PUBLISHED,
        )
        mark_request_done_if_published(self.request_obj)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, MonthlyRequest.Status.DONE)
        self.assertTrue(ScheduledPost.objects.filter(id=post.id).exists())

    def test_scheduled_post_does_not_mark_done_yet(self):
        self.request_obj.status = MonthlyRequest.Status.APPROVED
        self.request_obj.save()
        ScheduledPost.objects.create(
            content=self.request_obj,
            client=self.client_user,
            platforms=["instagram"],
            scheduled_at=timezone.now(),
            status=ScheduledPost.Status.SCHEDULED,
        )
        mark_request_done_if_published(self.request_obj)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, MonthlyRequest.Status.APPROVED)


class PipelineSettingsTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = _make_user("admin", User.Role.SUPERUSER)
        self.creator = _make_user("creator", User.Role.CONTENT_CREATOR)
        PipelineSettings.objects.all().delete()
        PipelineSettings.objects.create(pk=1, require_qa_review=False)

    def test_anyone_authenticated_can_read_settings(self):
        self.api.force_authenticate(user=self.creator)
        response = self.api.get("/api/contents/pipeline-settings/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["require_qa_review"])

    def test_only_superuser_can_change_settings(self):
        self.api.force_authenticate(user=self.creator)
        denied = self.api.patch(
            "/api/contents/pipeline-settings/",
            {"require_qa_review": True},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)
        self.api.force_authenticate(user=self.admin)
        ok = self.api.patch(
            "/api/contents/pipeline-settings/",
            {"require_qa_review": True},
            format="json",
        )
        self.assertEqual(ok.status_code, 200)
        self.assertTrue(ok.json()["require_qa_review"])
