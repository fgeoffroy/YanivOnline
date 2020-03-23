from django.db import models

# Create your models here.


class Game(models.Model):
    gameID = models.IntegerField(max_length=100)

    class Meta:
        verbose_name = "game"
        ordering = ['gameID']

    def __str__(self):
        return str(self.gameID)
