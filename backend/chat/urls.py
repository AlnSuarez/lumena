from django.urls import path
from . import views

urlpatterns = [
    path('contacts/', views.list_chat_contacts, name='list_chat_contacts'),
    path('messages/<int:contact_id>/', views.get_chat_messages, name='get_chat_messages'),
    path('send/', views.send_chat_message, name='send_chat_message'),
    path('messages/<int:contact_id>/read/', views.mark_messages_read, name='mark_messages_read'),
    path('conversations/<int:contact_id>/delete/', views.delete_conversation, name='delete_conversation'),
]
