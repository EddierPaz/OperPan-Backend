# Django Starter

Plantilla base para proyectos Django.

## Clonar repositorio

```bash
    git clone https://github.com/EddierPaz/OperPan-Backend.git
```

## Crear entorno virtual

```bash
    python -m venv env
```

en mac:

```bash
    python3 -m venv env
```



## Activar entorno virtual

```bash
    env\Scripts\activate
```

en mac:

```bash
    source env/bin/activate
```



## Instalar dependencias

```bash
    pip install -r requirements.txt
```

Instalar dependencia para certificados de novedades

---

Solo en el caso, pues los requerimientos ya estan actualizados y este comando no es necesario.

```bash
    pip install reportlab
```

## Instalar pymysql

```bash
    pip install pymysql
```

---

Dependiendo de si se trabaje en Mac o no.

Si se esta trabajando en Mac por temas de Credenciales de Administrador en estos  dispositivos por lo que hay que modificar config/settings.py

Pues si es Mac es mejor trabajar con dbsqlite3 y por ende:

```python
    # ── Base de datos ─────────────────────────────
    # -- Modificacion para MAC (problema de credenciales de administrador para nosotros como aprendices)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
```

El archivo db.sqlite3 serà subido, en tal caso de requerir pasar a windows solo hacer el cambio de configuracion y dejar el archivo.

En donde para Windows y nuestra conexion con la BD el codigo es:

```python
    # ── Base de datos ─────────────────────────────
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'operpan',
            'USER': 'operpan_user',
            'PASSWORD': 'Operpan123',
            'HOST': 'localhost',
            'PORT': '3306',
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            },
        }
    }
```

Por temas de usuarios en nuestro xampp:

```sql
    CREATE USER 'operpan_user'@'localhost'
    IDENTIFIED BY 'Operpan123';

    GRANT ALL PRIVILEGES
    ON operpan.*
    TO 'operpan_user'@'localhost';
```





## Ejecutar migraciones

> Crear base de datos Operpan

```bash
    python manage.py makemigrations
    python manage.py migrate
```

## Ejecutar servidor

```bash
    python manage.py runserver
```

> El siguente paso será crear un superuser y crear los usuarios para simular el admin y el empleado.