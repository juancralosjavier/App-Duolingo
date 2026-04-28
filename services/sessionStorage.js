import AsyncStorage from "@react-native-async-storage/async-storage";

export const USER_STORAGE_KEY = "@matecamba_user";
export const TOKEN_STORAGE_KEY = "@matecamba_token";

const memoryStorage = new Map();

export async function getStoredItem(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.log("AsyncStorage unavailable, using memory fallback:", error);
    return memoryStorage.get(key) ?? null;
  }
}

export async function setStoredItem(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log("AsyncStorage unavailable, saving in memory:", error);
    memoryStorage.set(key, value);
  }
}

export async function removeStoredItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("AsyncStorage unavailable, clearing memory fallback:", error);
    memoryStorage.delete(key);
  }
}

export async function getStoredUser() {
  const rawUser = await getStoredItem(USER_STORAGE_KEY);
  return rawUser ? JSON.parse(rawUser) : null;
}

export async function saveUser(user) {
  await setStoredItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export async function getAuthToken() {
  return await getStoredItem(TOKEN_STORAGE_KEY);
}

export async function saveSession(user, token) {
  await saveUser(user);
  await setStoredItem(TOKEN_STORAGE_KEY, token);
}

export async function clearSession() {
  await removeStoredItem(USER_STORAGE_KEY);
  await removeStoredItem(TOKEN_STORAGE_KEY);
}
