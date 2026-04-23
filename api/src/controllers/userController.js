const prisma = require("../lib/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "matecamba-secret-key";

const buildToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d"
  });

const toUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  xp: user.xp,
  hearts: user.hearts,
  streak: user.streak
});

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        hearts: true,
        streak: true,
        createdAt: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    const token = buildToken(user);
    res.status(201).json({ user: toUserPayload(user), token });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
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
    res.json({ user: toUserPayload(user), token });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          where: { completed: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      xp: user.xp,
      hearts: user.hearts,
      streak: user.streak,
      progress: user.progress
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

module.exports = {
  getUsers,
  register,
  login,
  getProfile
};
