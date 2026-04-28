import Constants from "expo-constants";
import { Platform } from "react-native";
import { getAuthToken } from "./sessionStorage";

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
const REQUEST_TIMEOUT_MS = 10000;

async function apiRequest(path, options = {}, requireAuth = false) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error?.name === "AbortError") {
      throw new Error(
        "La solicitud tardó demasiado. Revisa que el backend esté corriendo y que el celular esté en la misma red."
      );
    }

    throw error;
  }

  clearTimeout(timeoutId);

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      data = { error: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || "No se pudo completar la solicitud");
  }

  return data;
}

export async function getCourses() {
  return await apiRequest("/courses");
}

export async function getCourseDetail(id) {
  return await apiRequest(`/courses/${id}`);
}

export async function saveProgress(progress) {
  return await apiRequest("/progress", {
    method: "POST",
    body: JSON.stringify(progress),
  }, true);
}

export async function getUserProgress() {
  return await apiRequest("/progress/me", {}, true);
}

export async function getLessonDetail(lessonId) {
  return await apiRequest(`/lessons/${lessonId}`);
}

export async function register(user) {
  return await apiRequest("/users/register", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export async function loginUser(email, password) {
  return await apiRequest("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getUserProfile() {
  return await apiRequest("/users/me", {}, true);
}

export async function updateUserProfile(payload) {
  return await apiRequest(
    "/users/me",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    true
  );
}
