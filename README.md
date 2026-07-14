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

## Activar entorno virtual

```bash
    env\Scripts\activate
```

## Instalar dependencias

```bash
    pip install -r requirements.txt
```

Instalar dependencia para certificados de novedades

Solo en el caso, pues los requerimientos ya estan actualizados y este comando no es necesario.

```bash
    pip install reportlab
```

## Instalar pymysql

```bash
    pip install pymysql
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