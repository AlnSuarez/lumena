from django.urls import path
from . import views

urlpatterns = [
    path('schedule/', views.SchedulePostView.as_view(), name='schedule-post'),
    path('schedules/', views.ScheduledPostListCreateView.as_view(), name='scheduled-post-list'),
    path('schedules/<int:pk>/', views.ScheduledPostDetailView.as_view(), name='scheduled-post-detail'),
    path('social-accounts/', views.SocialAccountListCreateView.as_view(), name='social-account-list'),
    path('social-accounts/connect/', views.ConnectSocialAccountView.as_view(), name='social-account-connect'),
    path('social-accounts/callback/', views.SocialAccountCallbackView.as_view(), name='social-account-callback'),
    path('social-accounts/<int:pk>/', views.SocialAccountDestroyView.as_view(), name='social-account-delete'),
    path('schedules/<int:pk>/metrics/', views.ScheduledPostMetricsView.as_view(), name='scheduled-post-metrics'),
]
