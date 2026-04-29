const express = require("express");
const cors = require("cors");
require("dotenv").config();
const prisma = require("./src/lib/prisma");

const app = express();
const JSON_BODY_LIMIT = "8mb";

app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_BODY_LIMIT }));

const userRoutes = require("./src/routes/userRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const progressRoutes = require("./src/routes/progressRoutes");
const lessonRoutes = require("./src/routes/lessonRoutes");

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/lessons", lessonRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.json({ message: "API de MateCamba funcionando" });
});

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "La foto es demasiado pesada. Elige una imagen más ligera."
    });
  }

  if (err) {
    console.error(err);
    return res.status(500).json({
      error: "Ocurrió un error inesperado en la API."
    });
  }

  next();
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    app.listen(PORT, () => {
      //console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la API porque fallo la conexion a la base de datos.");
    console.error(error.message || error);
    process.exit(1);
  }
}

startServer();
