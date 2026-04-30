require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { validateRuntimeEnv } = require("../src/lib/env");
const { courses } = require("./seed");

const prisma = new PrismaClient();

const EXTRA_UNIT_TITLES = new Set(["Funciones y proporciones", "Potencias y raíces"]);
const EXTRA_COURSE_TITLES = new Set(["Mate escolar y retos iniciales"]);

function mapQuestion(question) {
  return {
    text: question.text,
    type: question.type,
    explanation: question.explanation,
    promptData: question.promptData,
    difficulty: question.difficulty,
    order: question.order,
    options: {
      create: question.options,
    },
  };
}

function mapLesson(lesson) {
  return {
    title: lesson.title,
    summary: lesson.summary,
    order: lesson.order,
    difficulty: lesson.difficulty,
    challengeType: lesson.challengeType,
    requiredStars: lesson.requiredStars,
    icon: lesson.icon,
    questions: {
      create: lesson.questions.map(mapQuestion),
    },
  };
}

function mapUnit(unit) {
  return {
    title: unit.title,
    summary: unit.summary,
    order: unit.order,
    requiredXp: unit.requiredXp,
    lessons: {
      create: unit.lessons.map(mapLesson),
    },
  };
}

async function main() {
  validateRuntimeEnv();
  const additions = [];

  const algebraCourse = courses.find((course) => course.title === "Álgebra universitaria inicial");
  if (!algebraCourse) {
    throw new Error("No se encontró el curso de álgebra en seed.js.");
  }

  const extraUnits = algebraCourse.units.filter((unit) => EXTRA_UNIT_TITLES.has(unit.title));
  let course = await prisma.course.findFirst({
    where: { title: algebraCourse.title },
    include: { units: { select: { title: true } } },
  });

  if (!course) {
    await prisma.course.create({
      data: {
        title: algebraCourse.title,
        language: algebraCourse.language,
        summary: algebraCourse.summary,
        icon: algebraCourse.icon,
        themeColor: algebraCourse.themeColor,
        units: {
          create: algebraCourse.units.map(mapUnit),
        },
      },
    });
    additions.push("Álgebra universitaria inicial");
  } else {
    const existingUnitTitles = new Set(course.units.map((unit) => unit.title));
    const missingUnits = extraUnits.filter((unit) => !existingUnitTitles.has(unit.title));

    if (missingUnits.length) {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          units: {
            create: missingUnits.map(mapUnit),
          },
        },
      });

      additions.push(missingUnits.map((unit) => unit.title).join(", "));
    }
  }

  const extraCourses = courses.filter((courseItem) => EXTRA_COURSE_TITLES.has(courseItem.title));
  for (const extraCourse of extraCourses) {
    const existingCourse = await prisma.course.findFirst({
      where: { title: extraCourse.title },
      select: { id: true },
    });

    if (!existingCourse) {
      await prisma.course.create({
        data: {
          title: extraCourse.title,
          language: extraCourse.language,
          summary: extraCourse.summary,
          icon: extraCourse.icon,
          themeColor: extraCourse.themeColor,
          units: {
            create: extraCourse.units.map(mapUnit),
          },
        },
      });

      additions.push(extraCourse.title);
    }
  }

  if (!additions.length) {
    console.log("El contenido extra de matemáticas ya existe. No se modificó el progreso.");
    return;
  }

  console.log(`Contenido extra agregado sin borrar progreso: ${additions.join(" | ")}`);
}

main()
  .catch((error) => {
    console.error("No se pudo cargar el contenido extra.");
    console.error(error.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
