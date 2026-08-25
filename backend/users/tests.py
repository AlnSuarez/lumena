from django.test import TestCase
from rest_framework.test import APIClient

from users.models import User
from contents.models import MonthlyRequest


def _make_user(username, role, email=None):
    user = User(
        username=username,
        email=email or f"{username}@lumena.test",
        role=role,
    )
    user.set_password("pass12345")
    user.save()
    return user


class UserApiAuthTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = _make_user("admin", User.Role.SUPERUSER)
        self.creator = _make_user("creator", User.Role.CONTENT_CREATOR)
        self.client_user = _make_user("clinic", User.Role.CLIENT)
        self.other_client = _make_user("otherclinic", User.Role.CLIENT)

    def test_anonymous_cannot_list_or_mutate_users(self):
        self.assertIn(self.api.get("/api/users/manage/").status_code, (401, 403))
        self.assertIn(self.api.get("/api/users/clients/").status_code, (401, 403))
        self.assertIn(
            self.api.post("/api/users/manage/add/", {"username": "x", "role": "QA"}, format="json").status_code,
            (401, 403),
        )
        self.assertIn(self.api.delete(f"/api/users/manage/{self.creator.id}/delete/").status_code, (401, 403))

    def test_client_cannot_create_or_delete_users(self):
        self.api.force_authenticate(user=self.client_user)
        create = self.api.post(
            "/api/users/manage/add/",
            {"username": "hacker", "email": "h@test.com", "role": "SUPERUSER", "password": "secret"},
            format="json",
        )
        self.assertEqual(create.status_code, 403)
        delete = self.api.delete(f"/api/users/manage/{self.creator.id}/delete/")
        self.assertEqual(delete.status_code, 403)
        self.assertTrue(User.objects.filter(id=self.creator.id).exists())

    def test_admin_can_list_and_create_users(self):
        self.api.force_authenticate(user=self.admin)
        listed = self.api.get("/api/users/manage/")
        self.assertEqual(listed.status_code, 200)
        created = self.api.post(
            "/api/users/manage/add/",
            {"username": "qa1", "email": "qa1@test.com", "role": "QA", "password": "secretpass"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)


class ImpersonationTests(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.admin = _make_user("admin", User.Role.SUPERUSER)
        self.client_user = _make_user("clinic", User.Role.CLIENT)
        self.other_client = _make_user("otherclinic", User.Role.CLIENT)
        self.own_request = MonthlyRequest.objects.create(
            client=self.client_user,
            month="2026-08-01",
            status=MonthlyRequest.Status.CLIENT_REVIEW,
        )
        self.other_request = MonthlyRequest.objects.create(
            client=self.other_client,
            month="2026-08-01",
            status=MonthlyRequest.Status.CLIENT_REVIEW,
        )

    def test_anonymous_cannot_list_requests_or_schedules(self):
        self.assertIn(self.api.get("/api/contents/monthly-requests/").status_code, (401, 403))
        self.assertIn(self.api.get("/api/scheduler/schedules/").status_code, (401, 403))
        self.assertIn(
            self.api.post(
                "/api/scheduler/schedule/",
                {"content_id": self.own_request.id, "client_id": self.client_user.id, "platforms": ["instagram"]},
                format="json",
            ).status_code,
            (401, 403),
        )

    def test_client_cannot_impersonate_superuser_via_query(self):
        self.api.force_authenticate(user=self.client_user)
        response = self.api.get(
            "/api/contents/monthly-requests/",
            {"user_id": self.admin.id, "role": "SUPERUSER"},
        )
        self.assertEqual(response.status_code, 200)
        ids = {item["id"] for item in response.json()}
        self.assertIn(self.own_request.id, ids)
        self.assertNotIn(self.other_request.id, ids)

    def test_client_cannot_read_another_clients_request(self):
        self.api.force_authenticate(user=self.client_user)
        response = self.api.get(f"/api/contents/monthly-requests/{self.other_request.id}/")
        self.assertEqual(response.status_code, 404)
