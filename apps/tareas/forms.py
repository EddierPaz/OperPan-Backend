from django import forms
from django.core.exceptions import ValidationError
from .models import Task, EstadoTarea, Prioridad, Area, Turno
from apps.usuarios.models import PerfilEmpleado
from apps.asistencia.models import Horario


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = [
            'empleado', 'titulo', 'descripcion', 'area', 'turno_asociado',
            'prioridad', 'fecha_limite', 'hora_limite'
        ]
        widgets = {
            'fecha_limite': forms.DateInput(attrs={'type': 'date'}),
            'hora_limite': forms.TimeInput(attrs={'type': 'time'}),  # Se mantiene como time
            'descripcion': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'hora_limite': 'Hora límite *',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Hacer hora_limite obligatorio
        self.fields['hora_limite'].required = True
        self.fields['hora_limite'].help_text = 'Obligatorio. Debe estar dentro del rango de la jornada del empleado.'

    def clean_hora_limite(self):
        hora_limite = self.cleaned_data.get('hora_limite')
        empleado = self.cleaned_data.get('empleado')

        if not hora_limite:
            raise ValidationError('La hora límite es obligatoria.')

        if empleado:
            horario_activo = Horario.objects.filter(
                empleado=empleado,
                estado=True
            ).order_by('-fecha_creacion').first()

            if horario_activo and horario_activo.hora_entrada and horario_activo.hora_salida:
                hora_entrada = horario_activo.hora_entrada
                hora_salida = horario_activo.hora_salida

                if not (hora_entrada <= hora_limite <= hora_salida):
                    raise ValidationError(
                        f'La hora límite debe estar dentro del rango de la jornada '
                        f'({hora_entrada.strftime("%H:%M")} - {hora_salida.strftime("%H:%M")}) '
                        f'del empleado.'
                    )

        return hora_limite


class TaskFilterForm(forms.Form):
    estado = forms.ChoiceField(
        choices=[('', 'Todos los estados')] + list(EstadoTarea.choices),
        required=False
    )
    empleado = forms.ModelChoiceField(
        queryset=PerfilEmpleado.objects.filter(user__rol='empleado', estado='activo'),
        required=False,
        empty_label='Todos los empleados'
    )
    area = forms.ChoiceField(
        choices=[('', 'Todas las áreas')] + list(Area.choices),
        required=False
    )
    prioridad = forms.ChoiceField(
        choices=[('', 'Todas las prioridades')] + list(Prioridad.choices),
        required=False
    )
    turno = forms.ChoiceField(
        choices=[('', 'Todos los turnos')] + list(Turno.choices),
        required=False
    )