import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0007_passwordresettoken'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='debe_cambiar_password',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='user',
            name='estado_cuenta',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('ACTIVA', 'Activa'),
                    ('SUSPENDIDA', 'Suspendida'),
                    ('INACTIVA', 'Inactiva'),
                ],
                default='PENDIENTE',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='fecha_primer_acceso',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='perfilempleado',
            name='estado',
            field=models.CharField(
                choices=[('activo', 'Activo'), ('retirado', 'Retirado')],
                default='activo',
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name='RegistroAuditoriaCuenta',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username_afectado', models.CharField(max_length=150)),
                ('username_ejecutor', models.CharField(blank=True, max_length=150)),
                ('accion', models.CharField(
                    choices=[
                        ('CREACION', 'Creación de cuenta'),
                        ('PRIMER_ACCESO', 'Primer acceso completado'),
                        ('SUSPENSION', 'Suspensión'),
                        ('REACTIVACION', 'Reactivación'),
                        ('RETIRO', 'Retiro'),
                        ('REACTIVACION_RETIRO', 'Reactivación por reingreso'),
                        ('CAMBIO_ROL', 'Cambio de rol'),
                        ('RESET_PASSWORD', 'Restablecimiento de contraseña'),
                    ],
                    max_length=30,
                )),
                ('estado_anterior', models.CharField(blank=True, max_length=30)),
                ('estado_nuevo', models.CharField(blank=True, max_length=30)),
                ('motivo', models.TextField(blank=True)),
                ('memorando_consecutivo', models.CharField(blank=True, max_length=20)),
                ('fecha_hora', models.DateTimeField(auto_now_add=True)),
                ('ejecutado_por', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='eventos_ejecutados',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('usuario_afectado', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='eventos_como_afectado',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-fecha_hora'],
            },
        ),
    ]