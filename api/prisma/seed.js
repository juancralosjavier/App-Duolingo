require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { validateRuntimeEnv } = require("../src/lib/env");

const prisma = new PrismaClient();

const option = (text, isCorrect, sortOrder = 0) => ({
  text,
  isCorrect,
  sortOrder,
});

const courses = [
  {
    title: "Calculo diario cruceño",
    language: "Aritmética",
    summary: "Compras, cambio, transporte y decisiones rápidas del día a día en Santa Cruz.",
    icon: "calculator-outline",
    themeColor: "#58CC02",
    units: [
      {
        title: "Mercado y cambio",
        summary: "Suma, resta y cálculo mental en compras reales.",
        order: 1,
        requiredXp: 0,
        lessons: [
          {
            title: "Compras rápidas",
            summary: "Resuelve totales y cambios sin perder ritmo.",
            order: 1,
            difficulty: 1,
            challengeType: "multiple_choice",
            requiredStars: 1,
            icon: "cart-outline",
            questions: [
              {
                order: 1,
                text: "Compras pan por Bs 12 y jugo por Bs 8. ¿Cuánto pagas en total?",
                type: "multiple_choice",
                difficulty: 1,
                explanation: "Primero sumas 12 + 8 para obtener el total.",
                options: [
                  option("18", false, 1),
                  option("20", true, 2),
                  option("21", false, 3),
                  option("22", false, 4),
                ],
              },
              {
                order: 2,
                text: "Si llevas Bs 50 y gastas Bs 37, escribe el cambio que recibes.",
                type: "numeric_input",
                difficulty: 1,
                explanation: "El cambio sale de restar 50 - 37.",
                options: [option("13", true, 1)],
              },
              {
                order: 3,
                text: "En el mercado, dos kilos de tomate a Bs 9 por kilo cuestan Bs 18.",
                type: "true_false",
                difficulty: 1,
                explanation: "Multiplicas 2 por 9, y sí da 18.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
            ],
          },
          {
            title: "Secuencia de cambio",
            summary: "Ordena pasos y detecta descuentos simples.",
            order: 2,
            difficulty: 2,
            challengeType: "sequence_choice",
            requiredStars: 2,
            icon: "swap-horizontal-outline",
            questions: [
              {
                order: 1,
                text: "Ordena los pasos para calcular el cambio de Bs 100 si gastas Bs 68.",
                type: "sequence_choice",
                difficulty: 2,
                explanation: "El orden importa: total disponible, gasto y resultado final.",
                options: [
                  option("Anota Bs 100 como monto inicial", true, 1),
                  option("Resta Bs 68 del monto inicial", true, 2),
                  option("Obtienes Bs 32 de cambio", true, 3),
                ],
              },
              {
                order: 2,
                text: "Si una promoción te rebaja Bs 8 de una compra de Bs 60, ¿cuánto pagas?",
                type: "numeric_input",
                difficulty: 2,
                explanation: "Descuento significa restar el valor rebajado al total.",
                options: [option("52", true, 1)],
              },
              {
                order: 3,
                text: "La mitad de Bs 40 es Bs 20.",
                type: "true_false",
                difficulty: 1,
                explanation: "La mitad es dividir entre 2.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Tiempo y transporte",
        summary: "Minutos, horarios y frecuencias en micros y trufis.",
        order: 2,
        requiredXp: 80,
        lessons: [
          {
            title: "Micros y horarios",
            summary: "Suma y resta minutos para llegar a tiempo.",
            order: 1,
            difficulty: 2,
            challengeType: "speed",
            requiredStars: 1,
            icon: "bus-outline",
            questions: [
              {
                order: 1,
                text: "Sales a las 07:20 y llegas a las 07:55. ¿Cuántos minutos dura el viaje?",
                type: "numeric_input",
                difficulty: 2,
                explanation: "De 07:20 a 07:55 hay 35 minutos.",
                options: [option("35", true, 1)],
              },
              {
                order: 2,
                text: "Si el micro tarda 25 minutos y sales a las 08:10, llegas a las:",
                type: "multiple_choice",
                difficulty: 2,
                explanation: "A las 08:10 le sumas 25 minutos.",
                options: [
                  option("08:25", false, 1),
                  option("08:30", false, 2),
                  option("08:35", true, 3),
                  option("08:40", false, 4),
                ],
              },
              {
                order: 3,
                text: "Un micro pasa cada 12 minutos. En una hora pasa 5 veces.",
                type: "true_false",
                difficulty: 2,
                explanation: "60 dividido entre 12 es 5.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
            ],
          },
          {
            title: "Distancias del barrio",
            summary: "Suma recorridos y compara trayectos.",
            order: 2,
            difficulty: 2,
            challengeType: "mixed",
            requiredStars: 2,
            icon: "walk-outline",
            questions: [
              {
                order: 1,
                text: "Si caminas 3 cuadras al norte y 2 al este, avanzaste un total de:",
                type: "multiple_choice",
                difficulty: 2,
                explanation: "Solo sumas el total recorrido: 3 + 2.",
                options: [
                  option("4 cuadras", false, 1),
                  option("5 cuadras", true, 2),
                  option("6 cuadras", false, 3),
                  option("1 cuadra", false, 4),
                ],
              },
              {
                order: 2,
                text: "Recorres 2 km de ida y 2 km de vuelta. ¿Cuántos km haces en total?",
                type: "numeric_input",
                difficulty: 1,
                explanation: "Ida y vuelta se suman: 2 + 2.",
                options: [option("4", true, 1)],
              },
              {
                order: 3,
                text: "Ordena los pasos para estimar un trayecto de 15 minutos que repites 3 veces.",
                type: "sequence_choice",
                difficulty: 3,
                explanation: "Primero reconoces el tiempo base, luego las repeticiones y al final multiplicas.",
                options: [
                  option("Identifica que un viaje dura 15 minutos", true, 1),
                  option("Cuenta que harás 3 viajes iguales", true, 2),
                  option("Multiplica 15 × 3 para obtener 45 minutos", true, 3),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Geometría de barrio",
    language: "Geometría",
    summary: "Medidas, perímetros, áreas y escalas útiles para patio, cancha y construcción.",
    icon: "shapes-outline",
    themeColor: "#2493EE",
    units: [
      {
        title: "Canchas y patios",
        summary: "Calcula perímetros y áreas en espacios cotidianos.",
        order: 1,
        requiredXp: 120,
        lessons: [
          {
            title: "Perímetro práctico",
            summary: "Mide bordes y contornos sin perder precisión.",
            order: 1,
            difficulty: 2,
            challengeType: "multiple_choice",
            requiredStars: 1,
            icon: "expand-outline",
            questions: [
              {
                order: 1,
                text: "Un patio mide 8 m de largo y 5 m de ancho. ¿Cuál es su perímetro?",
                type: "multiple_choice",
                difficulty: 2,
                explanation: "Perímetro de rectángulo: 2 × (8 + 5).",
                options: [
                  option("13 m", false, 1),
                  option("26 m", true, 2),
                  option("40 m", false, 3),
                  option("80 m", false, 4),
                ],
              },
              {
                order: 2,
                text: "Una cancha de 20 m por 10 m tiene área de 200 m².",
                type: "true_false",
                difficulty: 2,
                explanation: "El área de rectángulo sale de multiplicar largo por ancho.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
              {
                order: 3,
                text: "Escribe el área de una mesa de 4 m por 3 m.",
                type: "numeric_input",
                difficulty: 2,
                explanation: "Área = 4 × 3.",
                options: [option("12", true, 1)],
              },
            ],
          },
          {
            title: "Medidas para construir",
            summary: "Convierte unidades y estima material.",
            order: 2,
            difficulty: 3,
            challengeType: "logic",
            requiredStars: 2,
            icon: "construct-outline",
            questions: [
              {
                order: 1,
                text: "Si una mesa mide 120 cm, eso equivale a:",
                type: "multiple_choice",
                difficulty: 2,
                explanation: "120 cm equivalen a 1.2 metros.",
                options: [
                  option("1.2 m", true, 1),
                  option("12 m", false, 2),
                  option("0.12 m", false, 3),
                  option("1200 m", false, 4),
                ],
              },
              {
                order: 2,
                text: "Necesitas 4 tablas de 2 m cada una. ¿Cuántos metros compras en total?",
                type: "numeric_input",
                difficulty: 1,
                explanation: "Multiplicas 4 por 2.",
                options: [option("8", true, 1)],
              },
              {
                order: 3,
                text: "Ordena los pasos para convertir 250 cm a metros.",
                type: "sequence_choice",
                difficulty: 3,
                explanation: "Primero partes de centímetros, luego recuerdas la equivalencia y finalmente divides.",
                options: [
                  option("Parte de 250 cm", true, 1),
                  option("Recuerda que 100 cm equivalen a 1 m", true, 2),
                  option("Divide 250 entre 100 para obtener 2.5 m", true, 3),
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Fracciones útiles",
        summary: "Porciones, mitades y cuartos aplicados a cocina y reparto.",
        order: 2,
        requiredXp: 180,
        lessons: [
          {
            title: "Cocina y porciones",
            summary: "Mitades, cuartos y recetas duplicadas.",
            order: 1,
            difficulty: 2,
            challengeType: "mixed",
            requiredStars: 1,
            icon: "restaurant-outline",
            questions: [
              {
                order: 1,
                text: "La mitad de 12 panes es:",
                type: "multiple_choice",
                difficulty: 1,
                explanation: "Mitad de 12 es 6.",
                options: [
                  option("4", false, 1),
                  option("6", true, 2),
                  option("8", false, 3),
                  option("12", false, 4),
                ],
              },
              {
                order: 2,
                text: "Si 1/4 de una receta es 5, escribe el total completo.",
                type: "numeric_input",
                difficulty: 2,
                explanation: "Si un cuarto vale 5, cuatro cuartos valen 20.",
                options: [option("20", true, 1)],
              },
              {
                order: 3,
                text: "Duplicar una receta de 3 tazas significa usar 6 tazas.",
                type: "true_false",
                difficulty: 1,
                explanation: "Duplicar es multiplicar por 2.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
            ],
          },
          {
            title: "Reparto con lógica",
            summary: "Aplica fracciones y orden de pasos para repartir correctamente.",
            order: 2,
            difficulty: 3,
            challengeType: "sequence_choice",
            requiredStars: 2,
            icon: "pie-chart-outline",
            questions: [
              {
                order: 1,
                text: "Ordena los pasos para repartir 24 panes entre 4 familias por igual.",
                type: "sequence_choice",
                difficulty: 3,
                explanation: "Detectas el total, el número de grupos y luego divides.",
                options: [
                  option("Tienes 24 panes en total", true, 1),
                  option("Debes repartirlos entre 4 familias", true, 2),
                  option("24 ÷ 4 = 6 panes por familia", true, 3),
                ],
              },
              {
                order: 2,
                text: "Si 3/4 de una torta son 9 porciones, 1/4 son 3 porciones.",
                type: "true_false",
                difficulty: 3,
                explanation: "Si 3/4 son 9, entonces 1/4 es 3.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
              {
                order: 3,
                text: "Escribe cuántas porciones hay en una torta completa si 1/4 equivale a 3.",
                type: "numeric_input",
                difficulty: 3,
                explanation: "Una torta completa tiene 4 cuartos, así que 4 × 3 = 12.",
                options: [option("12", true, 1)],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Datos, ahorro y decisiones",
    language: "Lógica y datos",
    summary: "Promedios, porcentajes y lectura rápida de información útil para decidir mejor.",
    icon: "stats-chart-outline",
    themeColor: "#FF9600",
    units: [
      {
        title: "Porcentajes reales",
        summary: "Descuentos, aumentos y metas de ahorro.",
        order: 1,
        requiredXp: 220,
        lessons: [
          {
            title: "Ahorro en compras",
            summary: "Calcula rebajas y compara opciones.",
            order: 1,
            difficulty: 3,
            challengeType: "multiple_choice",
            requiredStars: 2,
            icon: "cash-outline",
            questions: [
              {
                order: 1,
                text: "Si un producto de Bs 80 tiene 10% de descuento, pagas:",
                type: "multiple_choice",
                difficulty: 3,
                explanation: "10% de 80 es 8, así que pagas 72.",
                options: [
                  option("70", false, 1),
                  option("72", true, 2),
                  option("74", false, 3),
                  option("78", false, 4),
                ],
              },
              {
                order: 2,
                text: "Guardar Bs 15 por 4 semanas suma Bs 60.",
                type: "true_false",
                difficulty: 2,
                explanation: "15 × 4 = 60.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
              {
                order: 3,
                text: "Escribe el 25% de Bs 200.",
                type: "numeric_input",
                difficulty: 3,
                explanation: "25% es un cuarto, y un cuarto de 200 es 50.",
                options: [option("50", true, 1)],
              },
            ],
          },
          {
            title: "Comparar ofertas",
            summary: "Elige mejor según datos y pasos lógicos.",
            order: 2,
            difficulty: 4,
            challengeType: "logic",
            requiredStars: 3,
            icon: "git-compare-outline",
            questions: [
              {
                order: 1,
                text: "Ordena los pasos para decidir si conviene más pagar Bs 45 o comprar 2 por Bs 80.",
                type: "sequence_choice",
                difficulty: 4,
                explanation: "Compara una unidad con el precio por cada unidad en la promo.",
                options: [
                  option("Calcula el precio unitario de la promo 2 por 80", true, 1),
                  option("Obtén Bs 40 por cada producto en la promo", true, 2),
                  option("Compara Bs 40 con Bs 45 y elige la promo", true, 3),
                ],
              },
              {
                order: 2,
                text: "Si una oferta baja de Bs 90 a Bs 72, el descuento fue de Bs 18.",
                type: "true_false",
                difficulty: 3,
                explanation: "90 - 72 = 18.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
              {
                order: 3,
                text: "¿Qué porcentaje aproximado representa una rebaja de Bs 18 sobre Bs 90?",
                type: "multiple_choice",
                difficulty: 4,
                explanation: "18 es la quinta parte de 90; eso es 20%.",
                options: [
                  option("10%", false, 1),
                  option("15%", false, 2),
                  option("20%", true, 3),
                  option("25%", false, 4),
                ],
              },
            ],
          },
        ],
      },
      {
        title: "Lectura de datos",
        summary: "Promedios y comparaciones simples para tomar decisiones.",
        order: 2,
        requiredXp: 280,
        lessons: [
          {
            title: "Promedios útiles",
            summary: "Interpreta resultados y mejora tus decisiones.",
            order: 1,
            difficulty: 3,
            challengeType: "mixed",
            requiredStars: 2,
            icon: "bar-chart-outline",
            questions: [
              {
                order: 1,
                text: "Si tus puntajes son 8, 9 y 7, el promedio es:",
                type: "multiple_choice",
                difficulty: 3,
                explanation: "Suma 8 + 9 + 7 = 24 y divide entre 3.",
                options: [
                  option("7", false, 1),
                  option("8", true, 2),
                  option("8.5", false, 3),
                  option("9", false, 4),
                ],
              },
              {
                order: 2,
                text: "Un gráfico sube de 5 a 9. El aumento fue de 4 unidades.",
                type: "true_false",
                difficulty: 2,
                explanation: "Restas 9 - 5.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
              {
                order: 3,
                text: "Escribe la diferencia entre 32°C y 28°C.",
                type: "numeric_input",
                difficulty: 1,
                explanation: "32 - 28 = 4.",
                options: [option("4", true, 1)],
              },
            ],
          },
          {
            title: "Meta semanal",
            summary: "Cierra la ruta con un reto de combinación y fases.",
            order: 2,
            difficulty: 4,
            challengeType: "sequence_choice",
            requiredStars: 3,
            icon: "rocket-outline",
            questions: [
              {
                order: 1,
                text: "Ordena los pasos para alcanzar una meta de 90 XP si ya tienes 54 XP.",
                type: "sequence_choice",
                difficulty: 4,
                explanation: "Compara la meta, identifica lo actual y calcula lo que falta.",
                options: [
                  option("Define la meta total: 90 XP", true, 1),
                  option("Reconoce que ya tienes 54 XP", true, 2),
                  option("Resta 90 - 54 para saber que faltan 36 XP", true, 3),
                ],
              },
              {
                order: 2,
                text: "Si una lección avanzada da 18 XP, dos lecciones iguales te acercan 36 XP.",
                type: "true_false",
                difficulty: 3,
                explanation: "18 × 2 = 36.",
                options: [
                  option("Verdadero", true, 1),
                  option("Falso", false, 2),
                ],
              },
              {
                order: 3,
                text: "¿Cuántas lecciones de 18 XP necesitas para sumar al menos 36 XP?",
                type: "numeric_input",
                difficulty: 3,
                explanation: "36 dividido entre 18 es 2.",
                options: [option("2", true, 1)],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Álgebra universitaria inicial",
    language: "Álgebra",
    summary: "Patrones, productos, ecuaciones y cálculo mental para dar el salto al nivel universitario.",
    icon: "school-outline",
    themeColor: "#FFD33D",
    units: [
      {
        title: "Patrones y productos",
        summary: "Observa regularidades y completa multiplicaciones con ritmo.",
        order: 1,
        requiredXp: 320,
        lessons: [
          {
            title: "Continúa el patrón",
            summary: "Lee la relación entre columnas y completa el siguiente paso.",
            order: 1,
            difficulty: 2,
            challengeType: "pattern_grid_choice",
            requiredStars: 1,
            icon: "grid-outline",
            questions: [
              {
                order: 1,
                text: "Continúa el patrón",
                type: "pattern_grid_choice",
                difficulty: 2,
                explanation: "Cada fila multiplica 20 por el número de la izquierda. Por eso, 20 × 3 = 60.",
                promptData: {
                  rows: [
                    ["20 × 1", "20"],
                    ["20 × 2", "40"],
                    ["20 × 3", "?"],
                  ],
                  missingRow: 2,
                  missingCol: 1,
                },
                options: [
                  option("60", true, 1),
                  option("421", false, 2),
                  option("23", false, 3),
                ],
              },
              {
                order: 2,
                text: "Selecciona la respuesta",
                type: "missing_factor_choice",
                difficulty: 2,
                explanation: "Para que 20 no cambie, debes multiplicar por 1.",
                promptData: {
                  equationTokens: ["20", "×", "?", "=", "20"],
                },
                options: [
                  option("1", true, 1),
                  option("100", false, 2),
                  option("400", false, 3),
                ],
              },
              {
                order: 3,
                text: "Selecciona la respuesta",
                type: "missing_factor_choice",
                difficulty: 2,
                explanation: "Si ? × 3 = 15, divides 15 entre 3 y obtienes 5.",
                promptData: {
                  equationTokens: ["?", "×", "3", "=", "15"],
                },
                options: [
                  option("5", true, 1),
                  option("9", false, 2),
                  option("50", false, 3),
                ],
              },
            ],
          },
          {
            title: "Cálculo mental exprés",
            summary: "Responde con teclado numérico y mantén el ritmo.",
            order: 2,
            difficulty: 2,
            challengeType: "numeric_keypad",
            requiredStars: 2,
            icon: "keypad-outline",
            questions: [
              {
                order: 1,
                text: "Escribe la respuesta",
                type: "numeric_keypad",
                difficulty: 2,
                explanation: "4 por 3 da 12.",
                promptData: {
                  equationTokens: ["4", "×", "3", "=", "?"],
                  placeholder: "Ejemplo: 12",
                },
                options: [option("12", true, 1)],
              },
              {
                order: 2,
                text: "Escribe la respuesta",
                type: "numeric_keypad",
                difficulty: 2,
                explanation: "Si 7 grupos tienen 8 elementos cada uno, 7 × 8 = 56.",
                promptData: {
                  equationTokens: ["7", "×", "8", "=", "?"],
                  placeholder: "Ejemplo: 56",
                },
                options: [option("56", true, 1)],
              },
              {
                order: 3,
                text: "Escribe la respuesta",
                type: "numeric_keypad",
                difficulty: 3,
                explanation: "9 × 12 = 108. Conviene pensar 9 × 10 + 9 × 2.",
                promptData: {
                  equationTokens: ["9", "×", "12", "=", "?"],
                  placeholder: "Ejemplo: 108",
                },
                options: [option("108", true, 1)],
              },
            ],
          },
        ],
      },
      {
        title: "Despeje y ecuaciones",
        summary: "Completa expresiones y despeja incógnitas básicas.",
        order: 2,
        requiredXp: 420,
        lessons: [
          {
            title: "Completa la ecuación",
            summary: "Arma expresiones con fichas y reconoce equivalencias.",
            order: 1,
            difficulty: 3,
            challengeType: "equation_builder",
            requiredStars: 2,
            icon: "construct-outline",
            questions: [
              {
                order: 1,
                text: "Completa la ecuación",
                type: "equation_builder",
                difficulty: 3,
                explanation: "30 puede escribirse como 6 × 5. Esa combinación llena exactamente la igualdad.",
                promptData: {
                  target: "30",
                  tokens: ["6", "×", "5", "2", "4", "8", "÷"],
                  solution: ["6", "×", "5"],
                },
                options: [
                  option("6", true, 1),
                  option("×", true, 2),
                  option("5", true, 3),
                  option("2", false, 4),
                  option("4", false, 5),
                  option("8", false, 6),
                  option("÷", false, 7),
                ],
              },
              {
                order: 2,
                text: "Completa la ecuación",
                type: "equation_builder",
                difficulty: 3,
                explanation: "La forma más directa de mantener 20 es 20 × 1.",
                promptData: {
                  target: "20",
                  tokens: ["20", "×", "1", "÷", "25", "2", "3"],
                  solution: ["20", "×", "1"],
                },
                options: [
                  option("20", true, 1),
                  option("×", true, 2),
                  option("1", true, 3),
                  option("÷", false, 4),
                  option("25", false, 5),
                  option("2", false, 6),
                  option("3", false, 7),
                ],
              },
            ],
          },
          {
            title: "Despeje básico",
            summary: "Encuentra x usando operaciones directas.",
            order: 2,
            difficulty: 3,
            challengeType: "logic",
            requiredStars: 3,
            icon: "analytics-outline",
            questions: [
              {
                order: 1,
                text: "Escribe la respuesta",
                type: "numeric_keypad",
                difficulty: 3,
                explanation: "Si x + 7 = 19, restas 7 a ambos lados y x vale 12.",
                promptData: {
                  equationTokens: ["x", "+", "7", "=", "19"],
                  placeholder: "Valor de x",
                },
                options: [option("12", true, 1)],
              },
              {
                order: 2,
                text: "Selecciona la respuesta",
                type: "missing_factor_choice",
                difficulty: 3,
                explanation: "3x = 21 implica dividir 21 entre 3. Así obtienes x = 7.",
                promptData: {
                  equationTokens: ["3", "×", "?", "=", "21"],
                },
                options: [
                  option("5", false, 1),
                  option("7", true, 2),
                  option("9", false, 3),
                ],
              },
              {
                order: 3,
                text: "Escribe la respuesta",
                type: "numeric_keypad",
                difficulty: 4,
                explanation: "En 2x - 4 = 10, primero sumas 4 y luego divides entre 2. x = 7.",
                promptData: {
                  equationTokens: ["2x", "-", "4", "=", "10"],
                  placeholder: "Valor de x",
                },
                options: [option("7", true, 1)],
              },
            ],
          },
        ],
      },
    ],
  },
];

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
      dailyGoal: 3,
      avatarUrl: null,
      themePreference: "light",
      acceptedTermsAt: new Date(),
    },
    create: {
      name: "Estudiante MateCamba",
      email: "demo@matecamba.bo",
      password,
      xp: 120,
      hearts: 5,
      streak: 4,
      dailyGoal: 3,
      avatarUrl: null,
      themePreference: "light",
      acceptedTermsAt: new Date(),
    },
  });
}

async function seedCourses() {
  for (const course of courses) {
    await prisma.course.create({
      data: {
        title: course.title,
        language: course.language,
        summary: course.summary,
        icon: course.icon,
        themeColor: course.themeColor,
        units: {
          create: course.units.map((unit) => ({
            title: unit.title,
            summary: unit.summary,
            order: unit.order,
            requiredXp: unit.requiredXp,
            lessons: {
              create: unit.lessons.map((lesson) => ({
                title: lesson.title,
                summary: lesson.summary,
                order: lesson.order,
                difficulty: lesson.difficulty,
                challengeType: lesson.challengeType,
                requiredStars: lesson.requiredStars,
                icon: lesson.icon,
                questions: {
                  create: lesson.questions.map((question) => ({
                    text: question.text,
                    type: question.type,
                    explanation: question.explanation,
                    promptData: question.promptData,
                    difficulty: question.difficulty,
                    order: question.order,
                    options: {
                      create: question.options,
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
    });
  }
}

async function main() {
  validateRuntimeEnv();
  console.log("Sembrando rutas matematicas para MateCamba...");

  await resetCourseData();
  await seedDemoUser();
  await seedCourses();

  console.log("Semilla lista. Usuario demo: demo@matecamba.bo / mate1234");
}

main()
  .catch((error) => {
    console.error("No se pudo sembrar la base de datos.");
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
