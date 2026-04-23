# MateCamba

Aplicacion movil inspirada en Duolingo Math, adaptada a un contexto de Santa Cruz, Bolivia.

El proyecto tiene dos partes:

- `app`: frontend con `Expo + React Native`
- `api`: backend con `Express + Prisma + SQLite`

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
DATABASE_URL="file:./dev.db"
```

Tambien puedes usar como referencia el archivo `api/.env.example`.

### 4. Generar Prisma y cargar datos

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

### 5. Levantar backend

Dentro de `api`:

```bash
node server.js
```

Debe aparecer algo como:

```text
Servidor corriendo en http://localhost:3000
```

### 6. Levantar frontend

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
- el backend debe seguir corriendo en la PC

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

## Estado actual

- login funcionando con usuario demo
- rutas matematicas cargadas
- contenido adaptado a Santa Cruz
- frontend y backend separados
