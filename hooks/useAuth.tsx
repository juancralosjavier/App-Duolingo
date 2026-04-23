import React, { useState, useEffect, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface User {
  id: number;
  name: string;
  email: string;
  xp: number;
  hearts: number;
  streak: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userData: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "@matecamba_user";
const TOKEN_STORAGE_KEY = "@matecamba_token";
const memoryStorage = new Map<string, string>();

async function getStoredItem(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.log("AsyncStorage unavailable, using memory fallback:", error);
    return memoryStorage.get(key) ?? null;
  }
}

async function setStoredItem(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.log("AsyncStorage unavailable, saving in memory:", error);
    memoryStorage.set(key, value);
  }
}

async function removeStoredItem(key: string) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log("AsyncStorage unavailable, clearing memory fallback:", error);
    memoryStorage.delete(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await getStoredItem(USER_STORAGE_KEY);
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.log("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (userData: User, token: string) => {
    try {
      await setStoredItem(USER_STORAGE_KEY, JSON.stringify(userData));
      await setStoredItem(TOKEN_STORAGE_KEY, token);
      setUser(userData);
    } catch (error) {
      console.log("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await removeStoredItem(USER_STORAGE_KEY);
      await removeStoredItem(TOKEN_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.log("Error signing out:", error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = { ...user, ...userData };
      await setStoredItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.log("Error updating user:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    updateUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
