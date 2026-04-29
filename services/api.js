import Constants from "expo-constants";
import { Platform } from "react-native";
import { getAuthToken } from "./sessionStorage";

const PUBLIC_RENDER_API_URL = "https://matecamba-api.onrender.com/api";

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

const configuredApiUrlFromExtra = Constants.expoConfig?.extra?.apiUrl?.trim?.();
const configuredApiUrlFromEnv = process.env.EXPO_PUBLIC_API_URL?.trim?.();
const configuredApiUrl = configuredApiUrlFromEnv || configuredApiUrlFromExtra;
const localApiUrl = `http://${defaultHost}:3000/api`;
const API_URL = configuredApiUrl || PUBLIC_RENDER_API_URL || localApiUrl;
const API_ORIGIN = API_URL.endsWith("/api") ? API_URL.slice(0, -4) : API_URL;
const IS_REMOTE_API = API_URL.startsWith("https://");
const REQUEST_TIMEOUT_MS = IS_REMOTE_API ? 45000 : 10000;
const HEALTH_TIMEOUT_MS = IS_REMOTE_API ? 35000 : 8000;
const WARMUP_COOLDOWN_MS = 4 * 60 * 1000;

let lastWarmupAt = 0;
let warmupPromise = null;

if (__DEV__) {
  console.log(`[MateCamba API] ${API_URL}`);
}

export function getApiUrl() {
  return API_URL;
}

function buildTimeoutMessage() {
  return IS_REMOTE_API
    ? "La solicitud tardó demasiado. Render puede tardar en despertar en el plan gratis. Espera unos segundos y toca Reintentar."
    : "La solicitud tardó demasiado. Revisa que el backend esté corriendo y que el celular esté en la misma red.";
}

function isRetryableNetworkError(error) {
  if (!error) {
    return false;
  }

  if (error?.name === "AbortError") {
    return true;
  }

  const message = `${error?.message || error}`.toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch") ||
    message.includes("timed out") ||
    message.includes("timeout")
  );
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function warmUpApi(force = false) {
  if (!IS_REMOTE_API) {
    return;
  }

  const now = Date.now();
  if (!force && now - lastWarmupAt < WARMUP_COOLDOWN_MS) {
    return;
  }

  if (warmupPromise) {
    return warmupPromise;
  }

  warmupPromise = (async () => {
    try {
      const response = await fetchWithTimeout(`${API_ORIGIN}/health`, {}, HEALTH_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error("No se pudo despertar la API pública.");
      }
      lastWarmupAt = Date.now();
    } finally {
      warmupPromise = null;
    }
  })();

  return warmupPromise;
}

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

  if (IS_REMOTE_API) {
    try {
      await warmUpApi();
    } catch (_warmupError) {
      // Si Render sigue despertando, dejamos que la solicitud real haga el intento y active el retry.
    }
  }

  const executeRequest = async () => {
    const response = await fetchWithTimeout(`${API_URL}${path}`, {
      ...options,
      headers,
    }, REQUEST_TIMEOUT_MS);

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
  };

  try {
    return await executeRequest();
  } catch (error) {
    if (IS_REMOTE_API && isRetryableNetworkError(error)) {
      await warmUpApi(true);
      try {
        return await executeRequest();
      } catch (retryError) {
        if (retryError?.name === "AbortError") {
          throw new Error(buildTimeoutMessage());
        }
        if (isRetryableNetworkError(retryError)) {
          throw new Error(
            "No se pudo conectar con la API pública. Revisa tu conexión a internet y vuelve a intentar en unos segundos."
          );
        }
        throw retryError;
      }
    }

    if (error?.name === "AbortError") {
      throw new Error(buildTimeoutMessage());
    }

    if (IS_REMOTE_API && isRetryableNetworkError(error)) {
      throw new Error(
        "No se pudo conectar con la API pública. Revisa tu conexión a internet y vuelve a intentar en unos segundos."
      );
    }

    throw error;
  }
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

export async function resetUserPassword(email, newPassword) {
  return await apiRequest("/users/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, newPassword }),
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
