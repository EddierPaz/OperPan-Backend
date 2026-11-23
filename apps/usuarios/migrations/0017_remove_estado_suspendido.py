from django.db import migrations, models


def convertir_suspendidas_a_inactivas(apps, schema_editor):
    User = apps.get_model('usuarios', 'User')
    User.objects.filter(estado_cuenta='SUSPENDIDA').update(
        estado_cuenta='INACTIVA',
        is_active=False,
    )


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0016_merge_20261122_2346'),
    ]

    operations = [
        migrations.RunPython(
            convertir_suspendidas_a_inactivas,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='user',
            name='estado_cuenta',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('ACTIVA', 'Activa'),
                    ('INACTIVA', 'Inactiva'),
                ],
                default='PENDIENTE',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='registroauditoriacuenta',
            name='accion',
            field=models.CharField(
                choices=[
                    ('CREACION', 'Creación de cuenta'),
                    ('PRIMER_ACCESO', 'Primer acceso completado'),
                    ('REACTIVACION', 'Reactivación'),
                    ('RETIRO', 'Retiro'),
                    ('REACTIVACION_RETIRO', 'Reactivación por reingreso'),
                    ('CAMBIO_ROL', 'Cambio de rol'),
                    ('RESET_PASSWORD', 'Restablecimiento de contraseña'),
                ],
                max_length=30,
            ),
        ),
    ]
