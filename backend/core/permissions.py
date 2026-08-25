from rest_framework.permissions import BasePermission

from users.models import User

STAFF_ROLES = frozenset({
    User.Role.SUPERUSER,
    User.Role.QA,
    User.Role.CONTENT_CREATOR,
    User.Role.EDITOR,
})


def actor(request):
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return user
    return None


def is_superuser_role(user):
    return bool(user and user.is_authenticated and user.role == User.Role.SUPERUSER)


def is_staff_role(user):
    return bool(user and user.is_authenticated and user.role in STAFF_ROLES)


def can_access_client(user, client_id):
    if not user or not user.is_authenticated:
        return False
    if user.role == User.Role.CLIENT:
        try:
            return int(client_id) == int(user.id)
        except (TypeError, ValueError):
            return False
    return is_staff_role(user)


class IsSuperUserRole(BasePermission):
    message = "Only administrators can access this resource."

    def has_permission(self, request, view):
        return is_superuser_role(request.user)


class IsStaffRole(BasePermission):
    message = "Staff access required."

    def has_permission(self, request, view):
        return is_staff_role(request.user)
