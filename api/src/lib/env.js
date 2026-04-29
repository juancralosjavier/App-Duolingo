const PLACEHOLDER_FRAGMENTS = [
  "REEMPLAZA_CON_TU_PASSWORD_REAL",
  "REEMPLAZA_CON_UNA_CLAVE_SEGURA",
  "TU_PASSWORD",
  "TU_PASSWORD_REAL",
  "[TU-PASSWORD]",
  "[YOUR-PASSWORD]",
  "sb_publishable_",
];

function getEnv(name) {
  // eslint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Falta la variable ${name}. Definela en api/.env o en las variables del servicio donde despliegues la API.`
    );
  }

  return value.trim();
}

function hasPlaceholder(value) {
  return PLACEHOLDER_FRAGMENTS.some((fragment) => value.includes(fragment));
}

function validateRuntimeEnv() {
  const databaseUrl = getEnv("DATABASE_URL");
  const jwtSecret = getEnv("JWT_SECRET");

  if (hasPlaceholder(databaseUrl)) {
    throw new Error(
      "DATABASE_URL sigue usando un valor de ejemplo. Reemplaza la contraseña por la real de Supabase desde Connect > ORM > Prisma, ya sea en api/.env o en Render."
    );
  }

  if (hasPlaceholder(jwtSecret)) {
    throw new Error(
      "JWT_SECRET sigue usando un valor de ejemplo. Define una clave propia para firmar tokens en api/.env o en Render."
    );
  }

  return {
    databaseUrl,
    jwtSecret,
  };
}

module.exports = {
  validateRuntimeEnv,
};
