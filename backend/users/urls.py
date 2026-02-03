from django.urls import path
from . import views

urlpatterns = [
    path('content-creators/', views.get_content_creators, name='get_content_creators'),
    path('clients/', views.get_clients, name='get_clients'),
    path('create-client/', views.create_client, name='create_client'),
    path('login/', views.login_user, name='login_user'),
    
    # User Management Endpoints
    path('manage/', views.list_manageable_users, name='list_manageable_users'),
    path('manage/add/', views.add_user, name='add_user'),
    path('manage/<int:user_id>/update/', views.update_user, name='update_user'),
    path('manage/<int:user_id>/delete/', views.delete_user, name='delete_user'),
]
