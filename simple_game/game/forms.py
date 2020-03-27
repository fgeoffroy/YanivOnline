from django import forms

class MatchmakingForm(forms.Form):
    user_name = forms.CharField(max_length=30, label="Choose a name")
    room_name = forms.CharField(max_length=30, label="What room would you like to create / enter?")
