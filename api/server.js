const express = require("express");
const cors = require("cors");
require("dotenv").config();
const prisma = require("./src/lib/prisma");

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la API porque fallo la conexion a la base de datos.");
    console.error(error.message || error);
    process.exit(1);
  }
}

startServer();
