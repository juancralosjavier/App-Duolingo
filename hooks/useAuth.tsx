import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import {
  clearSession,
  getAuthToken,
  getStoredUser,
  saveSession,
  saveUser,
} from "../services/sessionStorage";

export interface User {
  id: number;
  name: string;
  email: string;
  xp: number;
  hearts: number;
  streak: number;
  dailyGoal?: number;
  avatarUrl?: string | null;
  themePreference?: "light" | "dark";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (userData: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_TIMEOUT_MS = 1500;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const [storedUser, storedToken] = await Promise.race([
        Promise.all([getStoredUser(), getAuthToken()]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth storage timeout")), AUTH_STORAGE_TIMEOUT_MS)
        ),
      ]);

      if (storedUser && storedToken) {
        setUser(storedUser);
      } else {
        if (storedUser || storedToken) {
          await clearSession();
        }
        setUser(null);
      }
    } catch (error) {
      console.log("Error loading user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const signIn = useCallback(async (userData: User, token: string) => {
    try {
      await saveSession(userData, token);
      setUser(userData);
    } catch (error) {
      console.log("Error signing in:", error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await clearSession();
      setUser(null);
    } catch (error) {
      console.log("Error signing out:", error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    let updatedUser: User | null = null;

    try {
      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        const nextUser = { ...currentUser, ...userData };
        const changed = Object.keys(userData).some(
          (key) => currentUser[key as keyof User] !== nextUser[key as keyof User]
        );

        if (!changed) {
          return currentUser;
        }

        updatedUser = nextUser;
        return updatedUser;
      });

      if (updatedUser) {
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.log("Error updating user:", error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      updateUser,
    }),
    [loading, signIn, signOut, updateUser, user]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
