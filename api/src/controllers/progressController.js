const prisma = require("../lib/prisma");

const clampStars = (accuracy) => {
  if (accuracy >= 90) return 3;
  if (accuracy >= 75) return 2;
  if (accuracy >= 60) return 1;
  return 0;
};

const saveProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, completed, score, accuracy, stars } = req.body;

    if (!lessonId || typeof score !== "number" || typeof accuracy !== "number") {
      return res.status(400).json({ error: "Faltan datos de progreso válidos" });
    }

    const normalizedStars = Math.max(0, Math.min(3, stars ?? clampStars(accuracy)));

    const existing = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    let progress;
    const bestScore = Math.max(existing?.bestScore ?? 0, score);
    const gainedXp = Math.max(0, score - (existing?.bestScore ?? 0));

    if (existing) {
      progress = await prisma.userProgress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        data: {
          completed: existing.completed || completed,
          score,
          bestScore,
          stars: Math.max(existing.stars, normalizedStars),
          attempts: existing.attempts + 1,
          accuracy,
          completedAt: completed ? existing.completedAt || new Date() : existing.completedAt,
          lastPlayed: new Date()
        }
      });
    } else {
      progress = await prisma.userProgress.create({
        data: {
          userId,
          lessonId,
          completed,
          score,
          bestScore: score,
          stars: normalizedStars,
          attempts: 1,
          accuracy,
          completedAt: completed ? new Date() : null
        }
      });
    }

    let updatedUser = null;

    if (gainedXp > 0 || (completed && !existing?.completed)) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: gainedXp },
          streak: completed && !existing?.completed ? { increment: 1 } : undefined
        }
      });
    } else {
      updatedUser = await prisma.user.findUnique({
        where: { id: userId }
      });
    }

    res.json({
      progress,
      user: updatedUser
        ? {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            xp: updatedUser.xp,
            hearts: updatedUser.hearts,
            streak: updatedUser.streak,
            dailyGoal: updatedUser.dailyGoal,
          }
        : null,
    });
  } catch (_error) {
    res.status(500).json({ error: "Error al guardar progreso" });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const progress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            challengeType: true,
            requiredStars: true,
            unitId: true,
          }
        }
      },
      orderBy: {
        lastPlayed: "desc"
      }
    });

    const summary = progress.reduce(
      (accumulator, record) => {
        accumulator.completedLessons += record.completed ? 1 : 0;
        accumulator.totalStars += record.stars;
        accumulator.totalAttempts += record.attempts;
        return accumulator;
      },
      { completedLessons: 0, totalStars: 0, totalAttempts: 0 }
    );

    res.json({
      records: progress,
      summary,
    });
  } catch (_error) {
    res.status(500).json({ error: "Error al obtener progreso" });
  }
};

module.exports = {
  saveProgress,
  getUserProgress
};
