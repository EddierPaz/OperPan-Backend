from django import forms
from .models import User, PerfilEmpleado

class UserForm(forms.ModelForm):

    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'password', 'rol']

class PerfilEmpleadoForm(forms.ModelForm):

    class Meta:
        model = PerfilEmpleado
        fields = '__all__'

        