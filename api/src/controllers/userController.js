const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_SESSION_AVATAR_LENGTH = 4096;
const MAX_AVATAR_UPLOAD_LENGTH = 2_500_000;

const buildToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d"
  });

const sanitizeAvatarForSession = (avatarUrl) => {
  if (!avatarUrl) {
    return null;
  }

  if (avatarUrl.startsWith("data:") && avatarUrl.length > MAX_SESSION_AVATAR_LENGTH) {
    return null;
  }

  return avatarUrl;
};

const normalizeAvatarUrl = (avatarUrl) => {
  if (avatarUrl === null || avatarUrl === undefined) {
    return null;
  }

  if (typeof avatarUrl !== "string") {
    return avatarUrl;
  }

  const trimmedAvatarUrl = avatarUrl.trim();
  return trimmedAvatarUrl.length > 0 ? trimmedAvatarUrl : null;
};

const toSessionUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  xp: user.xp,
  hearts: user.hearts,
  streak: user.streak,
  dailyGoal: user.dailyGoal,
  avatarUrl: sanitizeAvatarForSession(user.avatarUrl),
  themePreference: user.themePreference,
});

const toProfileUserPayload = (user, extras = {}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  xp: user.xp,
  hearts: user.hearts,
  streak: user.streak,
  dailyGoal: user.dailyGoal,
  avatarUrl: normalizeAvatarUrl(user.avatarUrl),
  themePreference: user.themePreference,
  ...extras,
});

const register = async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      password = "",
      acceptedTerms,
    } = req.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !normalizedEmail || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Ingresa un email válido" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    if (!acceptedTerms) {
      return res.status(400).json({ error: "Debes aceptar los términos y condiciones" });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
        acceptedTermsAt: new Date(),
        themePreference: "light",
      }
    });

    const token = buildToken(user);
    res.status(201).json({ user: toSessionUserPayload(user), token });
  } catch (_error) {
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

const login = async (req, res) => {
  try {
    const { email = "", password = "" } = req.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    let isValidPassword = false;

    if (user.password.startsWith("$2")) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      isValidPassword = user.password === password;

      if (isValidPassword) {
        const migratedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: migratedPassword }
        });
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const token = buildToken(user);
    res.json({ user: toSessionUserPayload(user), token });
  } catch (_error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email = "", newPassword = "" } = req.body ?? {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !newPassword) {
      return res.status(400).json({ error: "Correo y nueva contraseña son obligatorios" });
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return res.status(400).json({ error: "Ingresa un correo válido" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ error: "No existe una cuenta con ese correo" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      }
    });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (_error) {
    res.status(500).json({ error: "No se pudo restablecer la contraseña" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, completedLessons, progressAggregate] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          xp: true,
          hearts: true,
          streak: true,
          dailyGoal: true,
          avatarUrl: true,
          themePreference: true,
          acceptedTermsAt: true,
        }
      }),
      prisma.userProgress.count({
        where: {
          userId,
          completed: true,
        }
      }),
      prisma.userProgress.aggregate({
        where: { userId },
        _sum: {
          stars: true,
        }
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      ...toProfileUserPayload(user, {
        acceptedTermsAt: user.acceptedTermsAt,
        completedLessons,
        totalStars: progressAggregate._sum.stars ?? 0,
      }),
    });
  } catch (_error) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatarUrl, dailyGoal, themePreference } = req.body;
    const data = {};

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
      }
      data.name = trimmedName;
    }

    if (typeof avatarUrl === "string" || avatarUrl === null) {
      const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);

      if (
        normalizedAvatarUrl &&
        normalizedAvatarUrl.startsWith("data:") &&
        normalizedAvatarUrl.length > MAX_AVATAR_UPLOAD_LENGTH
      ) {
        return res.status(413).json({
          error: "La foto es demasiado pesada. Elige una imagen más ligera."
        });
      }

      data.avatarUrl = normalizedAvatarUrl;
    }

    if (typeof dailyGoal === "number") {
      if (![3, 5, 7].includes(dailyGoal)) {
        return res.status(400).json({ error: "La meta diaria debe ser 3, 5 o 7" });
      }
      data.dailyGoal = dailyGoal;
    }

    if (typeof themePreference === "string") {
      if (!["light", "dark"].includes(themePreference)) {
        return res.status(400).json({ error: "El tema debe ser claro u oscuro" });
      }
      data.themePreference = themePreference;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({
      user: toSessionUserPayload(updatedUser),
      profile: toProfileUserPayload(updatedUser),
    });
  } catch (_error) {
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
};

module.exports = {
  register,
  login,
  resetPassword,
  getProfile,
  updateProfile,
};
