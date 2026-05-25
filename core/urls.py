from django.urls import path
from .views import global_landing, index, maze, map_home

urlpatterns = [
    path('', global_landing, name='global_landing'),
    path('maze_home/', index, name='index'),
    path('maze/', maze, name='maze'),
    path('map_home/', map_home, name='map_home'),
]