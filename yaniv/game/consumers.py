# game/consumers.py
from random import shuffle
import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import Player, Room


class GameConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'game_%s' % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        type_msg = str(next(iter(text_data_json)))
        msg = next(iter(text_data_json.values()))

        if "ready" in type_msg:
            player = Player.objects.filter(user__username=msg).first()
            if player:
                if type_msg == "ready_msg":
                    player.ready = True
                    player.save()
                    room = Room.objects.filter(name=self.room_name).first()
                    nb_users = room.nb_users
                    if nb_users > 1:
                        players = Player.objects.filter(room__name=self.room_name)
                        all_ready = True
                        for player in players:
                            if not player.ready:
                                all_ready = False
                        if all_ready:
                            # Randomize order
                            dict = {}
                            players = list(players)
                            shuffle(players)
                            for i, player in enumerate(players):
                                dict[player.user.username] = i
                            # Send message to room group
                            async_to_sync(self.channel_layer.group_send)(
                                self.room_group_name,
                                {
                                    'type': 'ready_msg',
                                    'type_msg': type_msg,
                                    'nb_users': str(nb_users),
                                    'users_order': dict
                                }
                            )
                else:
                    player.ready = False
                    player.save()
        else:
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'game_msg',
                    'type_msg': type_msg,
                    'message': msg
                }
            )


    # Receive message from room group
    def game_msg(self, event):
        type_msg = event['type_msg']
        msg = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            type_msg: msg
        }))

    # Receive message from room group
    def ready_msg(self, event):
        type_msg = event['type_msg']
        msg = event['nb_users']
        dict = { type_msg: msg }
        dict['users_order'] = event['users_order']
        # Send message to WebSocket
        self.send(text_data=json.dumps(dict))
