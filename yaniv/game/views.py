from django.shortcuts import render, redirect
from .forms import MatchmakingForm
from .models import Player, Room
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout


def view_matchmaking(request):
    logout(request);
    rooms = Room.objects.all()
    for room in rooms:
        if room.nb_users < 1:
            room.delete()
        users = User.objects.filter(player__room=room)
        if not users:
            room.delete()

    form = MatchmakingForm(request.POST or None)
    conflict_user_name = False
    conflict_game_started = False
    conflict_nb_users = False
    users = User.objects.all()
    rooms = Room.objects.all()

    if form.is_valid():
        user_name = form.cleaned_data['user_name']
        room_name = form.cleaned_data['room_name']

        # if User.objects.filter(name=user_name, room__name=room_name):
        if User.objects.filter(username=user_name):
            conflict_user_name = True
            return render(request, 'game/matchmaking_form.html', locals())

        if Room.objects.filter(name=room_name):
            room = Room.objects.get(name=room_name)
            if room.started:
                conflict_game_started = True
                return render(request, 'game/matchmaking_form.html', locals())
            max_nb_players = 10
            if room.nb_users >= max_nb_players:
                conflict_nb_users = True
                return render(request, 'game/matchmaking_form.html', locals())
        else:
            room = Room(name = room_name)
        room.nb_users += 1
        room.save()

        password = "password"
        user = User.objects.create_user(user_name, password=password)
        player = Player(user = user, room=room)
        player.save()
        user = authenticate(username=user_name, password=password)
        login(request, user)
        request.session['form_just_completed'] = True
        request.session['user_name'] = user_name
        return redirect(view_room, room_name=room_name)
        # return render(request, 'game/room.html', locals())

    else:
        return render(request, 'game/matchmaking_form.html', locals())


def view_room(request, room_name):
    current_user = request.user
    if current_user.is_authenticated and current_user.player.room.name == room_name and request.session.get('form_just_completed'):
        request.session['form_just_completed'] = False
        user_name = request.session['user_name']
        return render(request, 'game/room.html', locals())
    else:
        return redirect(view_matchmaking)


def view_rules(request):
    return render(request, 'game/rules.html', locals())
#
#
# def view_disconnect(request):
#     current_user = request.user
#     # xx UPDATE THE STATE OF THE ROOM ?
#     current_user.delete()
#     return redirect(view_matchmaking)
