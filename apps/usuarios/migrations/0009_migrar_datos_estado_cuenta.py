from django.db import migrations


def migrar_estados(apps, schema_editor):
    """
    Recorre los usuarios YA EXISTENTES (creados antes de este cambio)
    y les asigna el estado_cuenta correcto según su situación actual,
    en vez de dejarlos todos en 'PENDIENTE' por defecto.
    """
    User = apps.get_model('usuarios', 'User')
    PerfilEmpleado = apps.get_model('usuarios', 'PerfilEmpleado')

    retirados_ids = list(
        PerfilEmpleado.objects.filter(estado='retirado').values_list('id', flat=True)
    )
    User.objects.filter(perfil__id__in=retirados_ids).update(
        estado_cuenta='INACTIVA',
        debe_cambiar_password=False,
        is_active=False,
    )

    suspendidos_ids = list(
        PerfilEmpleado.objects.filter(estado='suspendido').values_list('id', flat=True)
    )
    User.objects.filter(perfil__id__in=suspendidos_ids).update(
        estado_cuenta='SUSPENDIDA',
        debe_cambiar_password=False,
        is_active=False,
    )
    PerfilEmpleado.objects.filter(id__in=suspendidos_ids).update(estado='activo')

    ya_procesados_ids = retirados_ids + suspendidos_ids
    User.objects.exclude(perfil__id__in=ya_procesados_ids).update(
        estado_cuenta='ACTIVA',
        debe_cambiar_password=False,
        is_active=True,
    )


def revertir_estados(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0008_user_debe_cambiar_password_user_estado_cuenta_and_more'),
    ]

    operations = [
        migrations.RunPython(migrar_estados, revertir_estados),
    ]