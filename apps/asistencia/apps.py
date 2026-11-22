from django.apps import AppConfig
class AsistenciaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.asistencia'

    def ready(self):
        import apps.asistencia.signals
