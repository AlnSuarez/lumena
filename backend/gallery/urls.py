from django.urls import path
from . import views

urlpatterns = [
    path('clients/<int:client_id>/folders/', views.list_client_folders, name='list_client_folders'),
    path('clients/<int:client_id>/folders/create/', views.create_client_folder, name='create_client_folder'),
    path('folders/<int:folder_id>/', views.delete_client_folder, name='delete_client_folder'),
    path('folders/<int:folder_id>/images/', views.list_folder_images, name='list_folder_images'),
    path('folders/<int:folder_id>/images/upload/', views.upload_folder_images, name='upload_folder_images'),
    path('images/<int:image_id>/', views.delete_image, name='delete_image'),
    path('images/search/', views.search_image_by_folio, name='search_image_by_folio'),
]
