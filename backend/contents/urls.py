from django.urls import path
from . import views

urlpatterns = [
    path('monthly-requests/', views.MonthlyRequestListCreateView.as_view(), name='monthly-request-list'),
    path('monthly-requests/<int:pk>/', views.MonthlyRequestDetailView.as_view(), name='monthly-request-detail'),
    path('monthly-requests/<int:pk>/generate-caption/', views.generate_caption, name='generate_caption'),
    path('monthly-requests/<int:pk>/confirm-assignment/', views.confirm_assignment, name='confirm_assignment'),
    path('monthly-requests/<int:pk>/reassign/', views.reassign_creator, name='reassign_creator'),
    path('monthly-requests/<int:pk>/reassign-qa/', views.reassign_qa, name='reassign_qa'),
    path('creator-workload-stats/', views.creator_workload_stats, name='creator_workload_stats'),
    path('lets-talk/', views.create_lets_talk_submission, name='create_lets_talk_submission'),
    path('lets-talk/admin/', views.list_lets_talk_submissions, name='list_lets_talk_submissions'),
    path('lets-talk/admin/<int:pk>/reviewed/', views.mark_lets_talk_submission_reviewed, name='mark_lets_talk_submission_reviewed'),
]
