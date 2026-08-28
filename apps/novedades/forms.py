from datetime import date, timedelta

from django import forms
from .models import Permiso, Incapacidad, Certificado


class RechazoForm(forms.Form):
    motivo = forms.CharField(max_length=500, widget=forms.Textarea, required=True)


class CertificadoFiltroForm(forms.Form):
    empleado = forms.CharField(required=False)
    tipo = forms.ChoiceField(
        choices=[('', 'Todos')] + [('laboral', 'Certificado laboral'), ('ingresos', 'Certificado de ingresos'), ('antiguedad', 'Certificado de antigüedad')],
        required=False
    )
    desde = forms.DateField(required=False, input_formats=['%Y-%m-%d'])
    hasta = forms.DateField(required=False, input_formats=['%Y-%m-%d'])

    def clean(self):
        cleaned_data = super().clean()
        desde = cleaned_data.get('desde')
        hasta = cleaned_data.get('hasta')
        if desde and hasta and desde > hasta:
            raise forms.ValidationError('La fecha "desde" no puede ser mayor que "hasta".')
        return cleaned_data


class PermisoCrearForm(forms.ModelForm):
    archivo = forms.FileField(required=False)

    # Días mínimos de anticipación exigidos para solicitar un permiso.
    # Con DIAS_ANTICIPACION = 3, si hoy es 28, los días 29/30/31 quedan
    # bloqueados y el primer día disponible es el 1 (28 + 4).
    DIAS_ANTICIPACION = 3

    class Meta:
        model = Permiso
        fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'justificacion', 'nuevo_horario', 'archivo']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean_fecha_inicio(self):
        fecha_inicio = self.cleaned_data.get('fecha_inicio')
        if fecha_inicio:
            minimo = date.today() + timedelta(days=self.DIAS_ANTICIPACION + 1)
            if fecha_inicio < minimo:
                raise forms.ValidationError(
                    f"Los permisos deben solicitarse con al menos {self.DIAS_ANTICIPACION} "
                    f"días de anticipación. La fecha más próxima disponible es "
                    f"{minimo.strftime('%d/%m/%Y')}."
                )
        return fecha_inicio

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            raise forms.ValidationError("La fecha de inicio no puede ser mayor que la fecha de fin.")

        tipo = cleaned_data.get('tipo')
        nuevo_horario = cleaned_data.get('nuevo_horario')
        if tipo == 'cambio_turno' and not nuevo_horario:
            raise forms.ValidationError("El nuevo horario es obligatorio para solicitudes de cambio de turno.")

        return cleaned_data

    def clean_archivo(self):
        archivo = self.cleaned_data.get('archivo')
        if archivo:
            if archivo.size > 5 * 1024 * 1024:
                raise forms.ValidationError("El archivo no debe superar los 5MB.")
            if not archivo.name.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                raise forms.ValidationError("Solo se permiten archivos PDF, JPG o PNG.")
        return archivo


class IncapacidadCrearForm(forms.ModelForm):
    archivo = forms.FileField(required=True)

    class Meta:
        model = Incapacidad
        fields = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'archivo', 'entidad_emisora', 'numero_incapacidad']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean_fecha_inicio(self):
        fecha_inicio = self.cleaned_data.get('fecha_inicio')
        if fecha_inicio and fecha_inicio < date.today():
            raise forms.ValidationError("La fecha de inicio no puede ser anterior a hoy.")
        return fecha_inicio

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            raise forms.ValidationError("La fecha de inicio no puede ser mayor que la fecha de fin.")
        return cleaned_data

    def clean_archivo(self):
        archivo = self.cleaned_data.get('archivo')
        if archivo:
            if archivo.size > 5 * 1024 * 1024:
                raise forms.ValidationError("El archivo no debe superar los 5MB.")
            if not archivo.name.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                raise forms.ValidationError("Solo se permiten archivos PDF, JPG o PNG.")
        return archivo


class CertificadoCrearForm(forms.ModelForm):
    archivo = forms.FileField(required=False)

    class Meta:
        model = Certificado
        fields = ['tipo', 'proposito', 'dirigido_a', 'periodo', 'archivo']

    def clean_archivo(self):
        archivo = self.cleaned_data.get('archivo')
        if archivo:
            if archivo.size > 5 * 1024 * 1024:
                raise forms.ValidationError("El archivo no debe superar los 5MB.")
            if not archivo.name.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                raise forms.ValidationError("Solo se permiten archivos PDF, JPG o PNG.")
        return archivo