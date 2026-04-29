# MateCamba

Aplicacion movil inspirada en Duolingo Math, adaptada a un contexto de Santa Cruz, Bolivia.

El proyecto tiene dos partes:

- `app`: frontend con `Expo + React Native`
- `api`: backend con `Express + Prisma + PostgreSQL (Supabase)`

## Repositorio

Repositorio compartible:

```text
https://github.com/juancralosjavier/App-Duolingo.git
```

Para clonar:

```bash
git clone https://github.com/juancralosjavier/App-Duolingo.git
cd App-Duolingo
```

## Requisitos

- Node.js instalado
- Git instalado
- Expo Go en celular o Android Studio para emulador

## Instalacion

### 1. Instalar frontend

En la raiz del proyecto:

```bash
npm install
```

### 2. Instalar backend

Entrar a la carpeta `api`:

```bash
cd api
npm install
```

### 3. Crear archivo `.env`

En la carpeta `api`, crear un archivo llamado `.env` con este contenido:

```env
DATABASE_URL="postgresql://postgres.tlikumeruokrxccqeacj:[TU-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="cambia-esta-clave-por-una-segura"
```

Tambien puedes usar como referencia el archivo `api/.env.supabase.example`.

### 4. Configurar la URL del backend para el frontend

En la raiz del proyecto puedes crear un archivo `.env` con:

```env
EXPO_PUBLIC_API_URL="https://matecamba-api.onrender.com/api"
```

Si trabajas solo en local, puedes omitirlo y la app intentara usar la API local.

### 5. Generar Prisma y cargar datos

Dentro de `api`:

```bash
./node_modules/.bin/prisma generate
node prisma/seed.js
```

En Windows PowerShell tambien puedes usar:

```powershell
.\node_modules\.bin\prisma generate
node prisma\seed.js
```

### 6. Levantar backend

Dentro de `api`:

```bash
node server.js
```

Debe aparecer algo como:

```text
Servidor corriendo en http://localhost:3000
```

### 7. Levantar frontend

Abrir otra terminal en la raiz del proyecto:

```bash
./node_modules/.bin/expo start -c
```

En Windows PowerShell:

```powershell
.\node_modules\.bin\expo start -c
```

## Como ejecutar

Cuando Expo inicie:

- presiona `a` para abrir Android Emulator
- presiona `w` para abrir en navegador
- o escanea el QR con `Expo Go`

## Usuario demo

Para ingresar:

- Email: `demo@matecamba.bo`
- Password: `mate1234`

## Nota importante para celular fisico

Si usan `Expo Go` en celular:

- la PC y el celular deben estar en la misma red Wi-Fi
- el backend debe seguir corriendo en la PC, o el frontend debe apuntar al backend publico en Render

## Estructura principal

```text
myapp_lingoapp-main/
├── app/
├── api/
├── assets/
├── components/
├── hooks/
└── services/
```

## Problemas comunes

### 1. Error de AsyncStorage

Ejecutar otra vez:

```bash
npm install
./node_modules/.bin/expo start -c
```

### 2. Error de Prisma

Dentro de `api`:

```bash
./node_modules/.bin/prisma generate
node prisma/seed.js
```

### 3. La app no conecta al backend

Verificar:

- que `node server.js` siga corriendo en `api`
- que el celular y la PC esten en la misma red
- que no haya firewall bloqueando el puerto `3000`
- que `EXPO_PUBLIC_API_URL` apunte a `https://matecamba-api.onrender.com/api` si quieres usar el backend desplegado

## Estado actual

- login funcionando con usuario demo
- rutas matematicas cargadas
- contenido adaptado a Santa Cruz
- frontend y backend separados

## Despliegue en Render

El repo ya incluye `render.yaml` con la configuracion base del backend.

Valores clave para Render:

- `Directorio raiz`: `api`
- `Comando de compilacion`: `npm install`
- `Comando previo al despliegue`: `npm run prisma:push`
- `Comando de inicio`: `npm start`
- `Ruta de salud`: `/health`

Variables necesarias en Render:

- `DATABASE_URL`: cadena completa de PostgreSQL de Supabase
- `JWT_SECRET`: clave privada para firmar tokens
- `NODE_ENV`: `production`

Backend publico actual:

```text
https://matecamba-api.onrender.com
```

Pruebas utiles:

```text
https://matecamba-api.onrender.com/health
https://matecamba-api.onrender.com/api/courses
```
