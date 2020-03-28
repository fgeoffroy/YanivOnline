from django.db import models

class Room(models.Model):
    name = models.CharField(max_length=30)
    nb_users = models.IntegerField(default=0)

class User(models.Model):
    name = models.CharField(max_length=30)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
