from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tareas', '0007_task_memorando_generado'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.RenameModel(
                    old_name='Task',
                    new_name='Funcion',
                ),
                migrations.AlterModelTable(
                    name='funcion',
                    table='tareas_task',
                ),
            ],
        ),
    ]
