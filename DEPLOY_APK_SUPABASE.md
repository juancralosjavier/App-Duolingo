# MateCamba: APK + Supabase

## Que si podemos hacer con Supabase

Si, podemos usar Supabase para el almacenamiento de datos.

En este proyecto, Supabase serviria para:

- base de datos Postgres
- opcion futura para autenticacion
- opcion futura para almacenamiento de archivos con Supabase Storage

## Importante: que NO reemplaza Supabase por si solo

Hoy tu app esta armada asi:

- frontend Expo / React Native
- backend Node / Express
- ORM Prisma

Por eso, si solo cambias la base de datos a Supabase:

- `si` reemplazas SQLite
- `no` reemplazas el backend Node

Conclusion:

- si mantienes Prisma + Express, todavia necesitas hospedar tu API
- Supabase en este caso sera la base de datos, no el servidor principal de la app

## Arquitectura recomendada

### Opcion recomendada para este proyecto

- app movil en Expo / EAS Build
- backend Node en Render, Railway o Fly.io
- base de datos Postgres en Supabase

Esa opcion requiere pocos cambios sobre lo que ya tienes.

### Opcion alternativa

Quitar parte del backend propio y usar Supabase directamente desde la app.

No la recomiendo todavia porque implicaria rehacer login, reglas de acceso y flujo de datos.

## Que necesitas crear en Supabase

### 1. Un proyecto Postgres

En la pantalla que mostraste:

- Nombre del proyecto: `matecamba-db`
- Region: la mas cercana a tus usuarios
- API de datos: puede quedar habilitada

### 2. Un usuario para Prisma

Supabase recomienda crear un usuario dedicado para Prisma y usar su connection string.

SQL sugerido en el editor de Supabase:

```sql
create user "prisma" with password 'TU_PASSWORD_SEGURA' bypassrls createdb;
grant "prisma" to "postgres";
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

## Connection string recomendada

Para este backend Node persistente, usar la connection string del pooler session mode de Supabase, la que termina en puerto `5432`.

Ejemplo:

```env
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PRISMA_PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
```

Referencia local en el repo:

- `api/.env.supabase.example`

## Que cambios tecnicos faltan para usar Supabase de verdad

### Aun pendiente

Tu proyecto todavia usa SQLite en Prisma:

- `api/prisma/schema.prisma`

Antes de usar Supabase en produccion, hay que:

1. cambiar `provider = "sqlite"` por `provider = "postgresql"`
2. apuntar `DATABASE_URL` a Supabase
3. generar y aplicar migraciones nuevas
4. volver a correr el seed si corresponde

## Que necesitas para publicar una APK funcional

### Minimo tecnico

1. `app.json` con `android.package` y `android.versionCode`
2. `eas.json`
3. backend publico con HTTPS
4. base de datos publica y estable
5. variable `EXPO_PUBLIC_API_URL` apuntando a tu backend real

## Que necesitas ademas para Play Store

Si quieres subirla a Google Play mas adelante, ademas necesitas:

- cuenta de Google Play Console
- icono final
- nombre final de app
- capturas de pantalla
- politica de privacidad
- AAB de produccion

## Flujo recomendado

1. Crear proyecto en Supabase
2. Sacar la connection string del pooler `:5432`
3. Migrar Prisma de SQLite a PostgreSQL
4. Hospedar backend Node
5. Configurar `EXPO_PUBLIC_API_URL`
6. Generar APK con EAS

## Variables necesarias

### Frontend

Archivo sugerido:

- `.env`

Contenido:

```env
EXPO_PUBLIC_API_URL="https://tu-backend-publico.example.com/api"
```

### Backend

Archivo sugerido:

- `api/.env`

Contenido para Supabase:

```env
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PRISMA_PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="cambia-esta-clave-por-una-segura"
PORT=3000
```

## Lo que te recomiendo hacer ahora

1. Crear el proyecto `matecamba-db` en Supabase
2. Pasarme la connection string del pooler `:5432` sin la contraseña visible, o solo el formato
3. En el siguiente paso te migro Prisma de SQLite a PostgreSQL sin dejar roto el proyecto
