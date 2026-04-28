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
              },
              select: {
                id: true,
                title: true,
                order: true,
                difficulty: true,
                challengeType: true,
                requiredStars: true,
                icon: true,
                summary: true,
              },
            }
          }
        }
      }
    });

    res.json(courses);
  } catch (_error) {
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
                    order: "asc"
                  },
                  include: {
                    options: {
                      orderBy: {
                        sortOrder: "asc"
                      }
                    }
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
  } catch (_error) {
    res.status(500).json({ error: "Error al obtener detalle del curso" });
  }
};

const getLessonDetail = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            course: true
          }
        },
        questions: {
          orderBy: {
            order: "asc"
          },
          include: {
            options: {
              orderBy: {
                sortOrder: "asc"
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lección no encontrada" });
    }

    res.json(lesson);
  } catch (_error) {
    res.status(500).json({ error: "Error al obtener lección" });
  }
};

module.exports = {
  getCourses,
  getCourseDetail,
  getLessonDetail
};
