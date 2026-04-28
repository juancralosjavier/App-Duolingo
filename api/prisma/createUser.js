require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { validateRuntimeEnv } = require("../src/lib/env");
const prisma = new PrismaClient();

async function main() {
  validateRuntimeEnv();
  const hashedPassword = await bcrypt.hash("mate1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@matecamba.bo" },
    update: {
      password: hashedPassword,
      acceptedTermsAt: new Date(),
      dailyGoal: 3,
      avatarUrl: null,
      themePreference: "light",
    },
    create: {
      name: "Usuario Demo MateCamba",
      email: "demo@matecamba.bo",
      password: hashedPassword,
      xp: 245,
      hearts: 5,
      streak: 3,
      dailyGoal: 3,
      avatarUrl: null,
      themePreference: "light",
      acceptedTermsAt: new Date(),
    },
  });

  console.log("Usuario creado:", user);
}

main()
  .catch((e) => {
    console.error("No se pudo crear el usuario demo.");
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
