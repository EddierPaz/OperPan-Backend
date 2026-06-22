from django import forms
from django.utils import timezone
from .models import Task, Area, Turno, Prioridad, EstadoTarea
from apps.usuarios.models import User


class TaskForm(forms.ModelForm):
    """
    Formulario para crear y editar tareas (Solo Administrador)
    """
    
    class Meta:
        model = Task
        fields = [
            'titulo', 
            'empleado', 
            'prioridad', 
            'descripcion',
            'fecha_limite', 
            'hora_limite', 
            'area', 
            'turno_asociado'
        ]
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Limpieza de vitrina'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Instrucciones detalladas...'
            }),
            'empleado': forms.Select(attrs={
                'class': 'form-select'
            }),
            'prioridad': forms.Select(attrs={
                'class': 'form-select'
            }),
            'area': forms.Select(attrs={
                'class': 'form-select'
            }),
            'turno_asociado': forms.Select(attrs={
                'class': 'form-select'
            }),
            'fecha_limite': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'hora_limite': forms.TimeInput(attrs={
                'class': 'form-control',
                'type': 'time'
            }),
        }
        labels = {
            'titulo': 'Título *',
            'empleado': 'Empleado *',
            'prioridad': 'Prioridad *',
            'descripcion': 'Descripción *',
            'fecha_limite': 'Fecha límite *',
            'hora_limite': 'Hora límite',
            'area': 'Área',
            'turno_asociado': 'Turno asociado',
        }
        help_texts = {
            'titulo': 'Título breve y descriptivo de la tarea.',
            'descripcion': 'Instrucciones detalladas para realizar la tarea.',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Filtrar solo empleados activos
        self.fields['empleado'].queryset = User.objects.filter(
            rol='empleado',
            perfil__estado='activo'
        ).select_related('perfil')
        
        # Ordenar empleados por nombre completo
        self.fields['empleado'].label_from_instance = lambda obj: obj.perfil.nombre_completo()
        
        # Marcar campos obligatorios con asterisco
        for field_name in self.fields:
            if self.fields[field_name].required:
                self.fields[field_name].label = f"{self.fields[field_name].label}"

    def clean_fecha_limite(self):
        """
        Validar que la fecha límite no sea en el pasado
        """
        fecha = self.cleaned_data.get('fecha_limite')
        hoy = timezone.now().date()
        
        if fecha and fecha < hoy:
            raise forms.ValidationError("La fecha límite no puede ser en el pasado.")
        return fecha

    def clean_hora_limite(self):
        """
        Validar que si hay hora límite, también haya fecha límite
        """
        hora = self.cleaned_data.get('hora_limite')
        fecha = self.cleaned_data.get('fecha_limite')
        
        if hora and not fecha:
            raise forms.ValidationError("Debe especificar una fecha límite para asignar una hora límite.")
        
        # Si es hoy, validar que la hora no haya pasado
        if hora and fecha == timezone.now().date():
            ahora = timezone.now().time()
            if hora < ahora:
                raise forms.ValidationError("La hora límite no puede ser en el pasado.")
        
        return hora


class TaskEstadoForm(forms.Form):
    """
    Formulario para cambiar estado de tarea (Empleado y Administrador)
    """
    estado = forms.ChoiceField(
        choices=[
            ('', '--- Seleccionar estado ---'),
            (EstadoTarea.PENDIENTE, 'Pendiente'),
            (EstadoTarea.EN_PROGRESO, 'En progreso'),
            (EstadoTarea.FINALIZADA, 'Finalizada'),
        ],
        label='Nuevo estado',
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    
    observacion = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 3,
            'placeholder': 'Observaciones sobre el cambio de estado (opcional)...'
        }),
        label='Observaciones'
    )


class TaskFilterForm(forms.Form):
    """
    Formulario para filtrar tareas (Administrador)
    """
    estado = forms.ChoiceField(
        choices=[
            ('', 'Todos los estados'),
            (EstadoTarea.PENDIENTE, 'Pendientes'),
            (EstadoTarea.EN_PROGRESO, 'En progreso'),
            (EstadoTarea.FINALIZADA, 'Finalizadas'),
        ],
        required=False,
        label='Estado',
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    
    empleado = forms.ModelChoiceField(
        queryset=User.objects.filter(rol='empleado').select_related('perfil'),
        required=False,
        label='Empleado',
        empty_label='Todos los empleados',
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    
    area = forms.ChoiceField(
        choices=[('', 'Todas las áreas')] + Area.choices,
        required=False,
        label='Área',
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    
    prioridad = forms.ChoiceField(
        choices=[('', 'Todas las prioridades')] + Prioridad.choices,
        required=False,
        label='Prioridad',
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )
    
    turno = forms.ChoiceField(
        choices=[('', 'Todos los turnos')] + Turno.choices,
        required=False,
        label='Turno',
        widget=forms.Select(attrs={
            'class': 'form-select'
        })
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Ordenar empleados por nombre completo
        self.fields['empleado'].label_from_instance = lambda obj: obj.perfil.nombre_completo()


class TaskSearchForm(forms.Form):
    """
    Formulario de búsqueda simple
    """
    busqueda = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Buscar por título, empleado...'
        }),
        label=''
    )