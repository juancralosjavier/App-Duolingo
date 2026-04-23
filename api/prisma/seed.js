require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetCourseData() {
  await prisma.userProgress.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.course.deleteMany();
}

async function seedDemoUser() {
  const password = await bcrypt.hash("mate1234", 10);

  await prisma.user.upsert({
    where: { email: "demo@matecamba.bo" },
    update: {
      name: "Estudiante MateCamba",
      password,
      xp: 120,
      hearts: 5,
      streak: 4,
    },
    create: {
      name: "Estudiante MateCamba",
      email: "demo@matecamba.bo",
      password,
      xp: 120,
      hearts: 5,
      streak: 4,
    },
  });
}

async function main() {
  console.log("Sembrando rutas matematicas para MateCamba...");

  await resetCourseData();
  await seedDemoUser();

  await prisma.course.create({
    data: {
      title: "Calculo diario cruceño",
      language: "Aritmetica",
      units: {
        create: [
          {
            title: "Mercado y cambio",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Compras rapidas",
                  order: 1,
                  questions: {
                    create: [
                      {
                        text: "Compras pan por Bs 12 y jugo por Bs 8. ¿Cuanto pagas en total?",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "18", isCorrect: false },
                            { text: "20", isCorrect: true },
                            { text: "21", isCorrect: false },
                            { text: "22", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Si llevas Bs 50 y gastas Bs 37, escribe el cambio que recibes.",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "13", isCorrect: true }],
                        },
                      },
                      {
                        text: "Un kilo de tomate cuesta Bs 9. ¿Cuanto pagas por 2 kilos?",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "11", isCorrect: false },
                            { text: "18", isCorrect: true },
                            { text: "19", isCorrect: false },
                            { text: "20", isCorrect: false },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  title: "Dobles, mitades y descuentos",
                  order: 2,
                  questions: {
                    create: [
                      {
                        text: "Si una promo te baja Bs 8 de una compra de Bs 60, ¿cuanto terminas pagando?",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "52", isCorrect: true }],
                        },
                      },
                      {
                        text: "La mitad de Bs 40 es:",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "10", isCorrect: false },
                            { text: "20", isCorrect: true },
                            { text: "30", isCorrect: false },
                            { text: "40", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Si duplicas una compra de 7 empanadas, ¿cuantas empanadas llevas?",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "14", isCorrect: true }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "Tiempo y transporte",
            order: 2,
            lessons: {
              create: [
                {
                  title: "Micros y horarios",
                  order: 1,
                  questions: {
                    create: [
                      {
                        text: "Sales a las 07:20 y llegas a las 07:55. ¿Cuantos minutos dura el viaje?",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "35", isCorrect: true }],
                        },
                      },
                      {
                        text: "Si el micro tarda 25 minutos y sales a las 08:10, llegas a las:",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "08:25", isCorrect: false },
                            { text: "08:30", isCorrect: false },
                            { text: "08:35", isCorrect: true },
                            { text: "08:40", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Un micro pasa cada 12 minutos. ¿Cuantas veces pasa en 1 hora?",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "4", isCorrect: false },
                            { text: "5", isCorrect: true },
                            { text: "6", isCorrect: false },
                            { text: "12", isCorrect: false },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  title: "Distancias del barrio",
                  order: 2,
                  questions: {
                    create: [
                      {
                        text: "Si caminas 3 cuadras al norte y 2 al este, avanzaste un total de:",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "4 cuadras", isCorrect: false },
                            { text: "5 cuadras", isCorrect: true },
                            { text: "6 cuadras", isCorrect: false },
                            { text: "1 cuadra", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Recorres 2 km de ida y 2 km de vuelta. ¿Cuantos km haces en total?",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "4", isCorrect: true }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.course.create({
    data: {
      title: "Geometria de barrio",
      language: "Geometria",
      units: {
        create: [
          {
            title: "Canchas y patios",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Perimetro practico",
                  order: 1,
                  questions: {
                    create: [
                      {
                        text: "Un patio mide 8 m de largo y 5 m de ancho. ¿Cual es su perimetro?",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "13 m", isCorrect: false },
                            { text: "26 m", isCorrect: true },
                            { text: "40 m", isCorrect: false },
                            { text: "80 m", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Una cancha mide 20 m por 10 m. Escribe su area en m2.",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "200", isCorrect: true }],
                        },
                      },
                    ],
                  },
                },
                {
                  title: "Medidas para construir",
                  order: 2,
                  questions: {
                    create: [
                      {
                        text: "Si una mesa mide 120 cm, eso equivale a:",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "1.2 m", isCorrect: true },
                            { text: "12 m", isCorrect: false },
                            { text: "0.12 m", isCorrect: false },
                            { text: "1200 m", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Necesitas 4 tablas de 2 m cada una. ¿Cuantos metros compras en total?",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "8", isCorrect: true }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: "Fracciones utiles",
            order: 2,
            lessons: {
              create: [
                {
                  title: "Cocina y porciones",
                  order: 1,
                  questions: {
                    create: [
                      {
                        text: "La mitad de 12 panes es:",
                        type: "multiple_choice",
                        options: {
                          create: [
                            { text: "4", isCorrect: false },
                            { text: "6", isCorrect: true },
                            { text: "8", isCorrect: false },
                            { text: "12", isCorrect: false },
                          ],
                        },
                      },
                      {
                        text: "Si 1/4 de una receta es 5, escribe el total de la receta completa.",
                        type: "numeric_input",
                        options: {
                          create: [{ text: "20", isCorrect: true }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Semilla lista. Usuario demo: demo@matecamba.bo / mate1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
