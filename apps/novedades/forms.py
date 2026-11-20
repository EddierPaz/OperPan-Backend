from datetime import date, timedelta
from django import forms
from .models import Solicitud, Incapacidad, Certificado
from apps.asistencia.services.horario_service import obtener_o_generar_horario_vigente, ultimo_dia_del_mes

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
    DIAS_ANTICIPACION = 3

    class Meta:
        model = Solicitud
        fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'justificacion', 'nuevo_horario', 'archivo']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, empleado=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.empleado = empleado

    def clean(self):
        cleaned_data = super().clean()
        tipo = cleaned_data.get('tipo')
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        nuevo_horario = cleaned_data.get('nuevo_horario')
        justificacion = cleaned_data.get('justificacion')
        archivo = cleaned_data.get('archivo')
        hoy = date.today()

        if fecha_inicio:
            if tipo in ['luto', 'calamidad']:
                if fecha_inicio < hoy:
                    self.add_error('fecha_inicio', "La fecha no puede ser en el pasado.")
            else:
                minimo = hoy + timedelta(days=self.DIAS_ANTICIPACION)
                if fecha_inicio < minimo:
                    self.add_error('fecha_inicio', f"Debes avisar con al menos {self.DIAS_ANTICIPACION} días de anticipación.")

        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            self.add_error('fecha_fin', "La fecha de inicio no puede ser mayor que la fecha de fin.")

        if tipo == 'cambio_turno':
            cleaned_data['fecha_fin'] = fecha_inicio
            if not nuevo_horario:
                self.add_error('nuevo_horario', "El nuevo horario es obligatorio.")
            else:
                s = nuevo_horario.strip().lower()
                if not ('mañana' in s or 'manana' in s or 'tarde' in s):
                    self.add_error('nuevo_horario', "Solo se permite cambio a turno Mañana o Tarde. El turno Fijo no admite cambio.")
            
            if not justificacion:
                self.add_error('justificacion', "Debes explicar el motivo del cambio de turno.")

            if self.empleado is not None:
                horario = obtener_o_generar_horario_vigente(self.empleado)
                if horario is None:
                    self.add_error('tipo', "No tienes un horario vigente asignado.")
                elif horario.turno not in ('MANANA', 'TARDE'):
                    self.add_error('tipo', "Tu turno es Fijo y no admite cambio de turno.")
                elif fecha_inicio:
                    inicio_mes = horario.ciclo_inicio
                    fin_mes = ultimo_dia_del_mes(inicio_mes)
                    if not (inicio_mes <= fecha_inicio <= fin_mes):
                        self.add_error('fecha_inicio', f"El cambio de turno debe ser dentro del mes actual ({inicio_mes.strftime('%d/%m/%Y')} - {fin_mes.strftime('%d/%m/%Y')}).")

        elif tipo in ['luto', 'citas_medicas', 'maternidad_paternidad']:
            if not archivo: self.add_error('archivo', "Este tipo de solicitud exige adjuntar un soporte obligatorio.")
            cleaned_data['justificacion'] = ''
        elif tipo == 'vacaciones':
            cleaned_data['justificacion'] = ''
        else:
            if not justificacion: self.add_error('justificacion', "Debes ingresar una justificación para este tipo de solicitud.")

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
        fields = ['fecha_inicio', 'fecha_fin', 'archivo']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        empleado = getattr(self.instance, 'empleado', None)

        if fecha_inicio and fecha_inicio < date.today():
            self.add_error('fecha_inicio', "La fecha de inicio no puede ser anterior a hoy.")

        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            self.add_error('fecha_fin', "La fecha de fin no puede ser menor a la fecha de inicio.")

        if empleado and fecha_inicio and fecha_fin:
            solapamiento = Incapacidad.objects.filter(
                empleado=empleado, estado__in=['pendiente', 'aprobado'],
                fecha_inicio__lte=fecha_fin, fecha_fin__gte=fecha_inicio
            ).exclude(pk=self.instance.pk).exists()

            if solapamiento:
                raise forms.ValidationError("Ya tienes una incapacidad registrada en este rango de fechas.")
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