from django import forms
from .models import Permiso, Incapacidad, Certificado, Memorando

from apps.usuarios.models import PerfilEmpleado

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
        
        # Validación condicional: si el tipo es cambio_turno, nuevo_horario es obligatorio
        tipo = cleaned_data.get('tipo')
        nuevo_horario = cleaned_data.get('nuevo_horario')
        if tipo == 'cambio_turno' and not nuevo_horario:
            raise forms.ValidationError("El nuevo horario es obligatorio para solicitudes de cambio de turno.")
        
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
        
        tipo = cleaned_data.get('tipo')
        nuevo_horario = cleaned_data.get('nuevo_horario')
        if tipo == 'cambio_turno' and not nuevo_horario:
            raise forms.ValidationError("El nuevo horario es obligatorio para solicitudes de cambio de turno.")
        
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


# ----- Formularios para Memorandos -----
class MemorandoForm(forms.ModelForm):
    """Formulario para que el administrador genere un memorando."""
    class Meta:
        model = Memorando
        fields = ['empleado', 'tipo', 'asunto', 'contenido']
        widgets = {
            'empleado': forms.Select(attrs={'class': 'form-select'}),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'asunto': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Asunto del memorando'}),
            'contenido': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Redacte el contenido completo del memorando...'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['empleado'].queryset = PerfilEmpleado.objects.filter(estado='activo').order_by('primer_nombre', 'primer_apellido')
        self.fields['empleado'].label_from_instance = lambda obj: obj.nombre_completo()


class MemorandoFiltroForm(forms.Form):
    """Formulario para filtrar memorandos en el panel de administración."""
    empleado = forms.ModelChoiceField(
        queryset=PerfilEmpleado.objects.filter(estado='activo').order_by('primer_nombre', 'primer_apellido'),
        required=False,
        label='Empleado',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    tipo = forms.ChoiceField(
        choices=[('', 'Todos')] + list(Memorando.TIPO_CHOICES),
        required=False,
        label='Tipo',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    desde = forms.DateField(
        required=False,
        label='Fecha desde',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    hasta = forms.DateField(
        required=False,
        label='Fecha hasta',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )