# chat/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path('disconnect/', views.view_disconnect, name='view_disconnect'),
    path('', views.view_matchmaking, name='view_matchmaking'),
    path('<str:room_name>/', views.view_room, name='view_room'),
]
