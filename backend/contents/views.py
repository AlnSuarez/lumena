from rest_framework import generics, permissions
from .models import MonthlyRequest
from .serializers import MonthlyRequestSerializer

class MonthlyRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = MonthlyRequestSerializer
    permission_classes = [permissions.AllowAny] # Changed for dev/prototype without token auth

    def get_queryset(self):
        # In a real app, use self.request.user and IsAuthenticated
        # Here we rely on query param for "simulation"
        user_id = self.request.query_params.get('user_id')
        role = self.request.query_params.get('role') # Pass role from frontend

        queryset = MonthlyRequest.objects.all()

        if role == "SUPERUSER":
            return queryset

        if not user_id or not role:
            return MonthlyRequest.objects.none()

        # CONTENT_CREATOR: solo ven lo asignado a ellos
        if role == "CONTENT_CREATOR":
            return queryset.filter(assigned_to_id=user_id)

        # CLIENT: solo ve lo que creó
        elif role == "CLIENT":
            return queryset.filter(client_id=user_id)

        # QA: solo ve lo asignado a él en status QA
        elif role == "QA":
            return queryset.filter(
                qa_assigned_to_id=user_id,
                status='QA'
            )

        # Cualquier otro caso: vacío
        return MonthlyRequest.objects.none()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(_current_user=user)

class MonthlyRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MonthlyRequestSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Similar logic or just AllowAny for detail if ID is known
        return MonthlyRequest.objects.all()

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.instance._current_user = user
        serializer.save()
