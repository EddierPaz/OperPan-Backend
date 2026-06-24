from django import forms
from .models import Horario, Asistencia


class HorarioForm(forms.ModelForm):

    class Meta:
        model = Horario
        fields = [
            'empleado',
            'turno',
            'hora_entrada',
            'hora_salida',
            'estado'
        ]

        widgets = {
            'hora_entrada': forms.TimeInput(attrs={'type': 'time'}),
            'hora_salida': forms.TimeInput(attrs={'type': 'time'}),
        }

class AsistenciaForm(forms.ModelForm):

    class Meta:
        model = Asistencia
        fields = [
            'empleado',
            'horario',
            'fecha',
            'hora_entrada',
            'hora_salida',
            'estado',
            'observaciones'
        ]

        widgets = {
            'fecha': forms.DateInput(attrs={'type': 'date'}),
            'hora_entrada': forms.TimeInput(attrs={'type': 'time'}),
            'hora_salida': forms.TimeInput(attrs={'type': 'time'}),
        }