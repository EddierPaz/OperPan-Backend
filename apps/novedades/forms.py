from datetime import date, timedelta

from django import forms
from .models import Solicitud, Incapacidad, Certificado


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


class SolicitudCrearForm(forms.ModelForm):
    archivo = forms.FileField(required=False)

    class Meta:
        model = Solicitud
        fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'justificacion', 'nuevo_horario', 'archivo']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        tipo = cleaned_data.get('tipo')
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        nuevo_horario = cleaned_data.get('nuevo_horario')
        justificacion = cleaned_data.get('justificacion')
        archivo = cleaned_data.get('archivo')
        
        hoy = date.today()

        # 1. Reglas de Fechas y Anticipación
        if fecha_inicio:
            if tipo in ['luto', 'calamidad']:
                # Permiten hoy mismo, no fechas pasadas
                if fecha_inicio < hoy:
                    self.add_error('fecha_inicio', "La fecha no puede ser en el pasado.")
            else:
                # Exigen 3 días de anticipación
                minimo = hoy + timedelta(days=3)
                if fecha_inicio < minimo:
                    self.add_error('fecha_inicio', 
                        f"Para este tipo de solicitud debes avisar con al menos 3 días de anticipación. "
                        f"La fecha más próxima es {minimo.strftime('%d/%m/%Y')}."
                    )

        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            self.add_error('fecha_fin', "La fecha de inicio no puede ser mayor que la fecha de fin.")

        # 2. Reglas específicas por tipo
        if tipo == 'cambio_turno':
            if not nuevo_horario:
                self.add_error('nuevo_horario', "El nuevo horario es obligatorio.")
            if not justificacion:
                self.add_error('justificacion', "Debes explicar el motivo del cambio de turno.")
            cleaned_data['fecha_fin'] = fecha_inicio # Solo dura un día
            
        elif tipo in ['luto', 'citas_medicas', 'maternidad_paternidad']:
            if not archivo:
                self.add_error('archivo', "Este tipo de solicitud exige adjuntar un soporte obligatorio.")
            cleaned_data['justificacion'] = '' # Forzamos a vacío
            
        elif tipo == 'vacaciones':
            cleaned_data['justificacion'] = '' # No requiere justificación
            
        else:
            # no_remunerado, calamidad, escolares, legales, otro
            if not justificacion:
                self.add_error('justificacion', "Debes ingresar una justificación para este tipo de solicitud.")

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
        # Solo pedimos lo esencial: fechas y archivo
        fields = ['fecha_inicio', 'fecha_fin', 'archivo']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        empleado = self.instance.empleado # Ojo: debes pasar el empleado al instanciar el form en la vista

        # 1. Validar que no sea en el pasado
        if fecha_inicio and fecha_inicio < date.today():
            self.add_error('fecha_inicio', "La fecha de inicio no puede ser anterior a hoy.")

        # 2. Validar orden de fechas
        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            self.add_error('fecha_fin', "La fecha de fin no puede ser menor a la fecha de inicio.")

        # 3. REGLA DE NEGOCIO: Evitar solapamiento de incapacidades
        if empleado and fecha_inicio and fecha_fin:
            # Buscamos si hay una incapacidad pendiente o aprobada que se cruce en fechas
            solapamiento = Incapacidad.objects.filter(
                empleado=empleado,
                estado__in=['pendiente', 'aprobado'],
                fecha_inicio__lte=fecha_fin,
                fecha_fin__gte=fecha_inicio
            ).exclude(pk=self.instance.pk).exists()

            if solapamiento:
                raise forms.ValidationError(
                    "Ya tienes una incapacidad registrada en este rango de fechas. "
                    "Debes esperar a que finalice o sea procesada por administración."
                )

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