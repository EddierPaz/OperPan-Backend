from django import forms
from .models import User, PerfilEmpleado

class UserForm(forms.ModelForm):

    password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ['username', 'password', 'rol']
    
    def clean_username(self):
        username = self.cleaned_data["username"]

        if User.objects.filter(username=username).exists():
            raise forms.ValidationError(
                "Ese nombre de usuario ya existe."
            )
        return username

class PerfilEmpleadoForm(forms.ModelForm):

    class Meta:
        model = PerfilEmpleado
        exclude = ["user"]

    def clean_numero_documento(self):
        numero = self.cleaned_data["numero_documento"]

        if PerfilEmpleado.objects.filter(
            numero_documento=numero
        ).exists():
            raise forms.ValidationError(
                "Ya existe un empleado con ese documento."
            )

        return numero

        