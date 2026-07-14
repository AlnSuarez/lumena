from django.urls import path
from . import views

urlpatterns = [
    path('schedule/', views.SchedulePostView.as_view(), name='schedule-post'),
    path('schedules/', views.ScheduledPostListCreateView.as_view(), name='scheduled-post-list'),
    path('schedules/<int:pk>/', views.ScheduledPostDetailView.as_view(), name='scheduled-post-detail'),
]
