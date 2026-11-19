# apps/usuarios/forms.py
import re
from datetime import date
from django import forms
from .models import User, PerfilEmpleado


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'rol']

    def clean_username(self):
        username = self.cleaned_data["username"]
        # Validar que solo tenga letras, números y guiones bajos
        if not re.match(r'^\w+$', username):
            raise forms.ValidationError("El usuario solo puede contener letras, números y guiones bajos.")
        
        qs = User.objects.filter(username=username)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Ese nombre de usuario ya existe.")
        return username


class PerfilEmpleadoForm(forms.ModelForm):

    class Meta:
        model = PerfilEmpleado
        exclude = ["user", "estado"]

    def _validar_nombre(self, valor, nombre_campo):
        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-]+$', valor):
            raise forms.ValidationError(f"El {nombre_campo} solo puede contener letras, espacios y guiones.")
        if len(valor) < 2:
            raise forms.ValidationError(f"El {nombre_campo} debe tener al menos 2 caracteres.")
        return valor

    def clean_primer_nombre(self):
        return self._validar_nombre(self.cleaned_data.get('primer_nombre'), 'primer nombre')

    def clean_segundo_nombre(self):
        val = self.cleaned_data.get('segundo_nombre')
        return self._validar_nombre(val, 'segundo nombre') if val else val

    def clean_primer_apellido(self):
        return self._validar_nombre(self.cleaned_data.get('primer_apellido'), 'primer apellido')

    def clean_segundo_apellido(self):
        val = self.cleaned_data.get('segundo_apellido')
        return self._validar_nombre(val, 'segundo apellido') if val else val

    def clean_numero_documento(self):
        numero = self.cleaned_data.get("numero_documento")
        tipo_doc = self.cleaned_data.get("tipo_documento")

        if not numero or not numero.isdigit():
            raise forms.ValidationError("El número de documento debe contener solo números.")

        if tipo_doc == 'PPT' and len(numero) != 7:
            raise forms.ValidationError("El PPT debe tener exactamente 7 números.")

        qs = PerfilEmpleado.objects.filter(numero_documento=numero)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Ya existe un empleado con ese documento.")
        return numero

    def clean_correo(self):
        correo = self.cleaned_data.get("correo")
        qs = PerfilEmpleado.objects.filter(correo=correo)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Este correo electrónico ya está registrado.")
        return correo

    def clean_telefono(self):
        telefono = self.cleaned_data.get('telefono')
        if telefono and (not telefono.isdigit() or len(telefono) < 7 or len(telefono) > 10):
            raise forms.ValidationError("El teléfono debe tener entre 7 y 10 números.")
        return telefono

    def clean_telefono_emergencia(self):
        telefono = self.cleaned_data.get('telefono_emergencia')
        if telefono and (not telefono.isdigit() or len(telefono) < 7 or len(telefono) > 10):
            raise forms.ValidationError("El teléfono de emergencia debe tener entre 7 y 10 números.")
        return telefono

    def clean_direccion(self):
        direccion = self.cleaned_data.get('direccion')
        if direccion and (len(direccion) < 10 or len(direccion) > 100):
            raise forms.ValidationError("La dirección debe tener entre 10 y 100 caracteres.")
        return direccion

    # Reemplaza tu clean_fecha_nacimiento actual por este:
    def clean_fecha_nacimiento(self):
        fecha_nac = self.cleaned_data.get('fecha_nacimiento')
        if fecha_nac:
            today = date.today()
            edad = today.year - fecha_nac.year - ((today.month, today.day) < (fecha_nac.month, fecha_nac.day))
            if edad < 16:
                raise forms.ValidationError("El empleado debe tener mínimo 16 años de edad.")
            if edad > 80:
                raise forms.ValidationError("La fecha de nacimiento no es válida (excede los 80 años).")
        return fecha_nac

    # Reemplaza tu clean_fecha_ingreso actual por este:
    def clean_fecha_ingreso(self):
        fecha_ingreso = self.cleaned_data.get('fecha_ingreso')
        fecha_nac = self.cleaned_data.get('fecha_nacimiento')
        
        if fecha_ingreso:
            if fecha_ingreso > date.today():
                raise forms.ValidationError("La fecha de ingreso no puede ser futura.")
                
            if fecha_nac:
                edad_ingreso = fecha_ingreso.year - fecha_nac.year - ((fecha_ingreso.month, fecha_ingreso.day) < (fecha_nac.month, fecha_nac.day))
                if edad_ingreso < 16:
                    raise forms.ValidationError("La fecha de ingreso no puede ser anterior a los 16 años de edad.")
        return fecha_ingreso


class EstablecerPasswordForm(forms.Form):
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