from django.shortcuts import render
from game.models import Game

# Create your views here.

def start_game(request):
    game = Game(gameID = 1)
    return render(request, 'game/game.html')
