from django.shortcuts import render, redirect
from .forms import MatchmakingForm
from .models import Room, User



def view_matchmaking(request):
    form = MatchmakingForm(request.POST or None)
    if form.is_valid():
        user_name = form.cleaned_data['user_name']
        room_name = form.cleaned_data['room_name']

        if User.objects.filter(name=user_name, room__name=room_name):
            conflictUser_name = True
            return render(request, 'game/matchmaking_form.html', locals())

        if Room.objects.filter(name=room_name):
            room = Room.objects.get(name=room_name)
        else:
            room = Room(name = room_name)
        room.nbUsers += 1
        room.save()

        user = User(name = user_name, room=room)
        user.save()
        return redirect(view_room, room_name=room_name)

    else:
        conflictUser_name = False
        return render(request, 'game/matchmaking_form.html', locals())


def view_room(request, room_name):
    return render(request, 'game/room.html', locals())
