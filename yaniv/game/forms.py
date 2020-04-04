from django import forms
from django.core.validators import RegexValidator

class MatchmakingForm(forms.Form):
    alphaSpaces = RegexValidator(r'^[a-zA-Z]+$', 'Only letters and spaces are allowed in the user and room Names.')

    user_name = forms.CharField(max_length=30,
                                label="Choose a name",
                                widget=forms.TextInput(attrs={'autofocus': 'autofocus'}),
                                validators=[alphaSpaces])
    room_name = forms.CharField(max_length=30,
                                label="What room would you like to create / enter?",
                                validators=[alphaSpaces])
