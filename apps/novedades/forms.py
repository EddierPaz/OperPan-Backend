from django import forms
from .models import Permiso, Incapacidad, Certificado

# ----- Formularios existentes -----
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

# ----- Formularios de creación (empleado) -----
class PermisoCrearForm(forms.ModelForm):
    class Meta:
        model = Permiso
        fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'justificacion', 'nuevo_horario']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            raise forms.ValidationError("La fecha de inicio no puede ser mayor que la fecha de fin.")
        return cleaned_data


class IncapacidadCrearForm(forms.ModelForm):
    archivo = forms.FileField(required=True)

    class Meta:
        model = Incapacidad
        fields = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'archivo', 'entidad_emisora', 'numero_incapacidad']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean_archivo(self):
        archivo = self.cleaned_data.get('archivo')
        if archivo:
            if archivo.size > 5 * 1024 * 1024:
                raise forms.ValidationError("El archivo no debe superar los 5MB.")
            if not archivo.name.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                raise forms.ValidationError("Solo se permiten archivos PDF, JPG o PNG.")
        return archivo


class CertificadoCrearForm(forms.ModelForm):
    class Meta:
        model = Certificado
        fields = ['tipo', 'proposito', 'dirigido_a', 'periodo']