from django import forms
from django.utils import timezone
from .models import Task, Turno, Prioridad, EstadoTarea
from apps.usuarios.models import User, PerfilEmpleado
from apps.asistencia.models import Horario


class TaskForm(forms.ModelForm):
    """
    Formulario para crear y editar tareas (Solo Administrador)
    """

    class Meta:
        model = Task
        fields = [
            'titulo', 'empleado', 'prioridad', 'descripcion',
            'fecha_limite', 'hora_limite', 'turno_asociado'
        ]
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: Limpieza de vitrina'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Instrucciones detalladas...'}),
            'empleado': forms.Select(attrs={'class': 'form-select'}),
            'prioridad': forms.Select(attrs={'class': 'form-select'}),
            'turno_asociado': forms.Select(attrs={'class': 'form-select'}),
            'fecha_limite': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'hora_limite': forms.TimeInput(attrs={'class': 'form-control', 'type': 'time'}),
        }
        labels = {
            'titulo': 'Título *',
            'empleado': 'Empleado *',
            'prioridad': 'Prioridad *',
            'descripcion': 'Descripción *',
            'fecha_limite': 'Fecha límite *',
            'hora_limite': 'Hora límite',
            'turno_asociado': 'Turno *',
        }
        help_texts = {
            'titulo': 'Título breve y descriptivo de la tarea.',
            'descripcion': 'Instrucciones detalladas para realizar la tarea.',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['empleado'].queryset = PerfilEmpleado.objects.filter(
            user__rol='empleado',
            estado='activo'
        ).select_related('user')

        self.fields['empleado'].label_from_instance = lambda obj: f"{obj.nombre_completo()} ({obj.get_cargo_display()})"

        # El turno ahora es obligatorio (se autocompleta desde el horario del empleado)
        self.fields['turno_asociado'].required = True

    def clean_fecha_limite(self):
        fecha = self.cleaned_data.get('fecha_limite')
        hoy = timezone.now().date()
        if fecha and fecha < hoy:
            raise forms.ValidationError("La fecha límite no puede ser en el pasado.")
        return fecha

    def clean_hora_limite(self):
        hora = self.cleaned_data.get('hora_limite')
        fecha = self.cleaned_data.get('fecha_limite')

        if hora and not fecha:
            raise forms.ValidationError("Debe especificar una fecha límite para asignar una hora límite.")

        if hora and fecha == timezone.now().date():
            ahora = timezone.now().time()
            if hora < ahora:
                raise forms.ValidationError("La hora límite no puede ser en el pasado.")

        return hora

    def clean(self):
        """La hora límite no puede superar la hora de salida del horario activo del empleado."""
        cleaned_data = super().clean()
        hora = cleaned_data.get('hora_limite')
        empleado = cleaned_data.get('empleado')

        if hora and empleado:
            horario = Horario.objects.filter(
                empleado=empleado, estado=True
            ).order_by('-fecha_creacion').first()

            if horario and horario.hora_salida and hora > horario.hora_salida:
                self.add_error(
                    'hora_limite',
                    f"La hora límite no puede superar el fin de la jornada del empleado "
                    f"({horario.hora_salida.strftime('%H:%M')})."
                )
        return cleaned_data


class TaskEstadoForm(forms.Form):
    estado = forms.ChoiceField(
        choices=[
            ('', '--- Seleccionar estado ---'),
            (EstadoTarea.PENDIENTE, 'Pendiente'),
            (EstadoTarea.EN_PROGRESO, 'En progreso'),
            (EstadoTarea.FINALIZADA, 'Finalizada'),
        ],
        label='Nuevo estado',
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    observacion = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Observaciones sobre el cambio de estado (opcional)...'}),
        label='Observaciones'
    )


class TaskFilterForm(forms.Form):
    estado = forms.ChoiceField(
        choices=[
            ('', 'Todos los estados'),
            (EstadoTarea.PENDIENTE, 'Pendientes'),
            (EstadoTarea.EN_PROGRESO, 'En progreso'),
            (EstadoTarea.FINALIZADA, 'Finalizadas'),
        ],
        required=False,
        label='Estado',
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    empleado = forms.ModelChoiceField(
        queryset=PerfilEmpleado.objects.filter(user__rol='empleado'),
        required=False,
        label='Empleado',
        empty_label='Todos los empleados',
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    prioridad = forms.ChoiceField(
        choices=[('', 'Todas las prioridades')] + Prioridad.choices,
        required=False,
        label='Prioridad',
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    turno = forms.ChoiceField(
        choices=[('', 'Todos los turnos')] + Turno.choices,
        required=False,
        label='Turno',
        widget=forms.Select(attrs={'class': 'form-select'})
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['empleado'].label_from_instance = lambda obj: obj.nombre_completo()


class TaskSearchForm(forms.Form):
    busqueda = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Buscar por título, empleado...'}),
        label=''
    )