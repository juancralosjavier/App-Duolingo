const PLACEHOLDER_FRAGMENTS = [
  "REEMPLAZA_CON_TU_PASSWORD_REAL",
  "REEMPLAZA_CON_UNA_CLAVE_SEGURA",
  "TU_PASSWORD",
  "[TU-PASSWORD]",
  "[YOUR-PASSWORD]",
  "sb_publishable_",
];

function getEnv(name) {
  // eslint-disable-next-line expo/no-dynamic-env-var
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Falta la variable ${name} en api/.env.`);
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
      "DATABASE_URL sigue usando un valor de ejemplo. En api/.env reemplaza la contraseña por la real de Supabase desde Connect > ORM > Prisma."
    );
  }

  if (hasPlaceholder(jwtSecret)) {
    throw new Error(
      "JWT_SECRET sigue usando un valor de ejemplo. En api/.env define una clave propia para firmar tokens."
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
