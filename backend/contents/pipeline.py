from users.models import User

HAPPY_PATH = ("TO_DO", "IN_PROGRESS", "QA", "CLIENT_REVIEW", "APPROVED", "DONE")
PRODUCTION_STATUSES = frozenset({"TO_DO", "IN_PROGRESS", "IN_REVISION"})
REVIEW_ENTRY_STATUSES = frozenset({"QA", "CLIENT_REVIEW"})

GRAPH = {
    "TO_DO": frozenset({"IN_PROGRESS", "QA", "CLIENT_REVIEW"}),
    "IN_PROGRESS": frozenset({"TO_DO", "QA", "CLIENT_REVIEW"}),
    "QA": frozenset({"CLIENT_REVIEW", "IN_REVISION", "IN_PROGRESS"}),
    "IN_REVISION": frozenset({"IN_PROGRESS", "QA", "CLIENT_REVIEW"}),
    "CLIENT_REVIEW": frozenset({"APPROVED", "IN_REVISION", "QA", "IN_PROGRESS"}),
    "APPROVED": frozenset({"DONE", "CLIENT_REVIEW"}),
    "DONE": frozenset({"APPROVED"}),
}

ROLE_TRANSITIONS = {
    User.Role.CONTENT_CREATOR: {
        "TO_DO": frozenset({"IN_PROGRESS", "QA", "CLIENT_REVIEW"}),
        "IN_PROGRESS": frozenset({"TO_DO", "QA", "CLIENT_REVIEW"}),
        "IN_REVISION": frozenset({"IN_PROGRESS", "QA", "CLIENT_REVIEW"}),
    },
    User.Role.QA: {
        "QA": frozenset({"CLIENT_REVIEW", "IN_REVISION"}),
    },
    User.Role.CLIENT: {
        "CLIENT_REVIEW": frozenset({"APPROVED", "IN_REVISION"}),
    },
}


def require_qa_review():
    from .models import PipelineSettings
    return PipelineSettings.get().require_qa_review


def allowed_status_targets(from_status, role, qa_required=None):
    if qa_required is None:
        qa_required = require_qa_review()

    if role == User.Role.SUPERUSER:
        targets = set(GRAPH.get(from_status, ()))
    else:
        targets = set(ROLE_TRANSITIONS.get(role, {}).get(from_status, ()))

    if from_status in PRODUCTION_STATUSES:
        if qa_required:
            targets.discard("CLIENT_REVIEW")
        else:
            targets.discard("QA")

    return targets


def request_has_media(instance, incoming_items=None):
    if incoming_items:
        return True
    if instance.content_items.exists():
        return True
    if instance.linked_image_id:
        return True
    return False


def validate_status_transition(instance, new_status, user, data=None):
    data = data or {}
    current = instance.status
    if not new_status or new_status == current:
        return None

    role = getattr(user, "role", None)
    targets = allowed_status_targets(current, role)
    if new_status not in targets:
        return f"Cannot move from {current} to {new_status}."

    entering_review = (
        current in PRODUCTION_STATUSES and new_status in REVIEW_ENTRY_STATUSES
    )
    if entering_review:
        incoming = data.get("content_items")
        if not request_has_media(instance, incoming):
            return "Add media before sending this to review."

    if current == "QA" and new_status == "IN_REVISION":
        feedback = (data.get("feedback") if "feedback" in data else instance.feedback) or ""
        if not str(feedback).strip():
            return "Feedback is required when sending a piece back to revision."

    if current == "CLIENT_REVIEW" and new_status == "IN_REVISION":
        client_feedback = data.get("client_feedback")
        feedback = data.get("feedback")
        note = client_feedback if client_feedback is not None else feedback
        if note is None:
            note = instance.client_feedback or instance.feedback or ""
        if not str(note).strip():
            return "Describe the adjustments required before sending this back."

    return None


def mark_request_done_if_published(content):
    """Move Approved content to Done once it has gone live and nothing else is queued."""
    if not content:
        return

    from scheduler.models import ScheduledPost

    pending = content.scheduled_posts.filter(
        status__in=[
            ScheduledPost.Status.SCHEDULED,
            ScheduledPost.Status.PUBLISHING,
        ]
    ).exists()
    if pending:
        return

    published = content.scheduled_posts.filter(status=ScheduledPost.Status.PUBLISHED).exists()
    if not published:
        return

    if content.status != content.Status.APPROVED:
        return

    content.status = content.Status.DONE
    content.save(update_fields=["status", "updated_at"])
