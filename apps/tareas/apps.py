from django.apps import AppConfig

class TareasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tareas'  # ✅ Debe ser 'apps.tareas', no 'tareas'
    verbose_name = 'Tareas'