from django import forms
from .models import Memorando
from apps.usuarios.models import PerfilEmpleado


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