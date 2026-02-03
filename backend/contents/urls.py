from django.urls import path
from . import views

urlpatterns = [
    path('monthly-requests/', views.MonthlyRequestListCreateView.as_view(), name='monthly-request-list'),
    path('monthly-requests/<int:pk>/', views.MonthlyRequestDetailView.as_view(), name='monthly-request-detail'),
]
