# game/consumers.py
import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

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
        if 'chat_msg' in text_data_json:
            chat_msg = text_data_json['chat_msg']
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'chat_msg',
                    'chat_msg': chat_msg
                }
            )
        elif 'ready_msg' in text_data_json:
            ready_msg = text_data_json['ready_msg']
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'ready_msg',
                    'ready_msg': ready_msg
                }
            )
        elif 'card_msg' in text_data_json:
            card_msg = text_data_json['card_msg']
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'card_msg',
                    'card_msg': card_msg
                }
            )
        elif 'quit_msg' in text_data_json:
            quit_msg = text_data_json['quit_msg']
            # Send message to room group
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'quit_msg',
                    'quit_msg': quit_msg
                }
            )
        else:
            pass

    # Receive message from room group
    def chat_msg(self, event):
        chat_msg = event['chat_msg']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'chat_msg': chat_msg
        }))

    # Receive message from room group
    def ready_msg(self, event):
        ready_msg = event['ready_msg']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'ready_msg': ready_msg
        }))

    # Receive message from room group
    def card_msg(self, event):
        card_msg = event['card_msg']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'card_msg': card_msg
        }))

    # Receive message from room group
    def quit_msg(self, event):
        quit_msg = event['quit_msg']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'quit_msg': quit_msg
        }))
