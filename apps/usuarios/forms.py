from django import forms
from .models import User, PerfilEmpleado


class UserForm(forms.ModelForm):
    """
    Formulario de creación/edición de usuario.
    NO incluye password: la contraseña inicial se calcula en la vista
    a partir de numero_documento (RN-CT-01). Nunca se digita a mano.
    """

    class Meta:
        model = User
        fields = ['username', 'rol']

    def clean_username(self):
        username = self.cleaned_data["username"]
        qs = User.objects.filter(username=username)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Ese nombre de usuario ya existe.")
        return username


class PerfilEmpleadoForm(forms.ModelForm):

    class Meta:
        model = PerfilEmpleado
        exclude = ["user", "estado"]  # estado laboral ya no se edita libremente aquí (sección M)

    def clean_numero_documento(self):
        numero = self.cleaned_data["numero_documento"]
        qs = PerfilEmpleado.objects.filter(numero_documento=numero)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Ya existe un empleado con ese documento.")
        return numero


class EstablecerPasswordForm(forms.Form):
    """
    Usado en primer_acceso_view (RF-CT-03) y en cualquier reset manual.
    Valida que la nueva contraseña no sea igual al documento (RN-CT-04).
    """
    password1 = forms.CharField(widget=forms.PasswordInput, label="Nueva contraseña")
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirmar contraseña")

    def __init__(self, *args, numero_documento=None, **kwargs):
        self.numero_documento = numero_documento
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        p1, p2 = cleaned.get("password1"), cleaned.get("password2")

        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Las contraseñas no coinciden.")

        if p1 and self.numero_documento and p1 == self.numero_documento:
            raise forms.ValidationError(
                "La nueva contraseña no puede ser igual a tu número de documento."
            )
        return cleaned