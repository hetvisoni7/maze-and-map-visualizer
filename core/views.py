from django.shortcuts import render

def global_landing(request):
    return render(request, "global_landing.html")

def map_home(request):
    return render(request, "map_home.html")

def index(request):
    return render(request, "index.html")

def maze(request):
    return render(request, "maze.html")