# Seed de OperPan

Este comando permite llenar automáticamente la base de datos con información de prueba para facilitar el desarrollo y las demostraciones del proyecto.

## ¿Qué crea?

- 1 usuario administrador.
- 30 empleados.
- Horarios.
- Asistencias.
- Descansos.
- Tareas.
- Permisos.
- Incapacidades.
- Certificados.
- Memorandos.

Toda la información generada es coherente con el contexto de **OperPan**.

## ¿Cómo usarlo?

Después de ejecutar las migraciones:

```bash
python manage.py migrate
```

Ejecuta:

```bash
python manage.py seed
```

Luego inicia el servidor:

```bash
python manage.py runserver
```

## Credenciales

### Administrador

> Se mantienen las credenciales configuradas actualmente en el proyecto.

### Empleados

Todos los empleados creados por el seed tienen la contraseña:

```text
1234
```

## Recomendación

El comando `seed` está pensado para entornos de desarrollo y demostración. Si deseas regenerar toda la información, elimina la base de datos (`db.sqlite3`), ejecuta nuevamente las migraciones y vuelve a correr el comando:

```bash
python manage.py migrate
python manage.py seed
```