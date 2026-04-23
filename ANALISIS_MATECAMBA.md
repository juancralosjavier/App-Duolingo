# Analisis de la base y rumbo de MateCamba

## Lo que trae la base original

- Frontend en `Expo + React Native + expo-router`.
- Backend en `Express + Prisma + SQLite`.
- Flujo visual inspirado en Duolingo.
- Estructura reutilizable de `Course -> Unit -> Lesson -> Question -> Option`.

## Problemas detectados en la base original

- El contenido estaba centrado en idiomas, no en matematicas.
- La app dependia de una IP fija en `services/api.js`.
- Login y registro usaban datos globales en memoria.
- Las contraseñas se guardaban en texto plano.
- Varias pantallas seguian siendo prototipo: nombres, textos y categorias del clon original.

## Cambios aplicados en esta iteracion

- Rebranding a `MateCamba`.
- Home, tabs, login, registro, perfil, practica, curso, reto y resultado adaptados a matematicas.
- Redireccion inicial por sesion con `AuthProvider`.
- Persistencia de sesion con `AsyncStorage`.
- API configurable sin depender de una IP fija.
- Password hashing con `bcryptjs` y migracion suave para usuarios antiguos.
- Nuevos cursos semilla con contexto de Santa Cruz:
  - mercado y cambio
  - micros y horarios
  - distancias del barrio
  - canchas y patios
  - fracciones utiles

## Diferenciador local propuesto

La app no debe ser solo "Duolingo Math en español". Debe entrenar matematicas utiles para:

- compras en mercado y feria
- cambio y descuentos
- tiempos de micro y trufi
- medidas de patio, cancha, lote o taller
- porciones, fracciones y estimacion

## Siguiente backlog recomendado

1. Crear sistema real de progreso por leccion y desbloqueo de nodos.
2. Añadir generador dinamico de retos para que no sean siempre las mismas preguntas.
3. Incorporar niveles por edad o contexto:
   - primaria
   - secundaria
   - vida diaria
   - refuerzo preuniversitario
4. Reemplazar los iconos genericos por arte propio de la marca.
5. Agregar metas diarias, ranking y recompensas.
6. Separar mejor el modelo de dominio:
   - `language` deberia pasar a `track`, `topic` o `category`

## Comandos utiles

- Frontend: `npm install` y luego `npx expo start`
- Backend: `cd api`, `npm install`, `npm run seed`, `npm run dev`

## Usuario demo

- Email: `demo@matecamba.bo`
- Password: `mate1234`
