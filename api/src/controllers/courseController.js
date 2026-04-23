const prisma = require("../lib/prisma");

const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: {
        id: "asc"
      },
      include: {
        units: {
          orderBy: {
            order: "asc"
          },
          include: {
            lessons: {
              orderBy: {
                order: "asc"
              }
            }
          }
        }
      }
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cursos" });
  }
};

const getCourseDetail = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: {
            order: "asc"
          },
          include: {
            lessons: {
              orderBy: {
                order: "asc"
              },
              include: {
                questions: {
                  orderBy: {
                    id: "asc"
                  },
                  include: {
                    options: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener detalle del curso" });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, language } = req.body;

    const course = await prisma.course.create({
      data: {
        title,
        language
      }
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: "Error al crear curso" });
  }
};

const getLessonDetail = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        questions: {
          orderBy: {
            id: "asc"
          },
          include: {
            options: true
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lección no encontrada" });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener lección" });
  }
};

module.exports = {
  getCourses,
  createCourse,
  getCourseDetail,
  getLessonDetail
};
