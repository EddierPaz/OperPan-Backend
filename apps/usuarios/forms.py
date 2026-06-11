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
        fields = [
            'primer_nombre', 'segundo_nombre', 'primer_apellido',
            'segundo_apellido', 'tipo_documento', 'numero_documento',
            'fecha_nacimiento', 'genero', 'estado_civil',
            'tipo_sangre', 'telefono', 'correo'
        ]