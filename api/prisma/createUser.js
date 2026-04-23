const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@duolingo.com" },
    update: {},
    create: {
      name: "Usuario Demo",
      email: "demo@duolingo.com",
      password: hashedPassword,
      xp: 245,
      hearts: 5,
      streak: 3,
    },
  });

  console.log("Usuario creado:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });