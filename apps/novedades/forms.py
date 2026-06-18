from django import forms

class RechazoForm(forms.Form):
    """Formulario para validar el motivo de rechazo de un permiso o incapacidad."""
    motivo = forms.CharField(
        max_length=500,
        widget=forms.Textarea,
        required=True,
        error_messages={'required': 'El motivo del rechazo es obligatorio.'}
    )

class CertificadoFiltroForm(forms.Form):
    """Formulario para validar los filtros de certificados."""
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