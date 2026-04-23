const prisma = require("../lib/prisma");

const saveProgress = async (req, res) => {
  try {
    const { userId, lessonId, completed, score } = req.body;

    const existing = await prisma.userProgress.findFirst({
      where: {
        userId,
        lessonId
      }
    });

    let progress;

    if (existing) {
      progress = await prisma.userProgress.update({
        where: { id: existing.id },
        data: {
          completed,
          score,
          lastPlayed: new Date()
        }
      });
    } else {
      progress = await prisma.userProgress.create({
        data: {
          userId,
          lessonId,
          completed,
          score
        }
      });
    }

    if (completed) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: score }
        }
      });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar progreso" });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const progress = await prisma.userProgress.findMany({
      where: { userId }
    });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener progreso" });
  }
};

module.exports = {
  saveProgress,
  getUserProgress
};