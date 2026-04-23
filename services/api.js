import Constants from "expo-constants";
import { Platform } from "react-native";

const hostUri =
  Constants.expoConfig?.hostUri ||
  Constants.expoGoConfig?.debuggerHost ||
  Constants.manifest2?.extra?.expoClient?.hostUri ||
  "";

const inferredHost =
  typeof hostUri === "string" && hostUri.length > 0 ? hostUri.split(":")[0] : "";

const defaultHost =
  inferredHost ||
  (Platform.OS === "android"
    ? "10.0.2.2"
    : Platform.OS === "web"
    ? "localhost"
    : "localhost");

const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${defaultHost}:3000/api`;

export async function getCourses() {
  const response = await fetch(`${API_URL}/courses`);

  if (!response.ok) {
    throw new Error("No se pudieron obtener los cursos");
  }

  return await response.json();
}

export async function getCourseDetail(id) {
  const response = await fetch(`${API_URL}/courses/${id}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el detalle del curso");
  }

  return await response.json();
}

export async function saveProgress(progress) {
  const response = await fetch(`${API_URL}/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(progress),
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar el progreso");
  }

  return await response.json();
}

export async function getUserProgress(userId) {
  const response = await fetch(`${API_URL}/progress/${userId}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el progreso del usuario");
  }

  return await response.json();
}

export async function getLessonDetail(lessonId) {
  const response = await fetch(`${API_URL}/lessons/${lessonId}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener la lección");
  }

  return await response.json();
}

export async function register(user) {
  const response = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo registrar");
  }

  return await response.json();
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No se pudo iniciar sesión");
  }

  return await response.json();
}

export async function getUserProfile(userId) {
  const response = await fetch(`${API_URL}/users/${userId}`);

  if (!response.ok) {
    throw new Error("No se pudo obtener el perfil");
  }

  return await response.json();
}
