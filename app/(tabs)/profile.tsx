import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile, updateUserProfile } from "../../services/api";
import { useAuth, type User } from "../../hooks/useAuth";
import { getLevelFromXp, getLevelProgress, getPhaseLabel, XP_PER_LEVEL } from "../../constants/learning";
import { useAppTheme } from "../../hooks/useAppTheme";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  xp: number;
  hearts: number;
  streak: number;
  dailyGoal: number;
  avatarUrl?: string | null;
  themePreference?: "light" | "dark";
  completedLessons: number;
  totalStars: number;
}

function buildFallbackProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    xp: user.xp,
    hearts: user.hearts,
    streak: user.streak,
    dailyGoal: user.dailyGoal ?? 3,
    avatarUrl: user.avatarUrl ?? null,
    themePreference: user.themePreference ?? "light",
    completedLessons: 0,
    totalStars: 0,
  };
}

function sanitizeAvatarForSession(avatarUrl?: string | null) {
  if (!avatarUrl) {
    return null;
  }

  if (avatarUrl.startsWith("data:") && avatarUrl.length > 4096) {
    return null;
  }

  return avatarUrl;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: sessionUser, loading: authLoading, signOut, updateUser } = useAuth();
  const { theme, themeName, setThemeName } = useAppTheme();
  const sessionUserId = sessionUser?.id ?? null;
  const fetchedProfileUserIdRef = useRef<number | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!sessionUserId) {
      return;
    }

    setRefreshing(true);
    setError("");

    try {
      const data = await getUserProfile();
      setProfile(data);
      setNameDraft(data.name);
      await updateUser({
        name: data.name,
        xp: data.xp,
        hearts: data.hearts,
        streak: data.streak,
        dailyGoal: data.dailyGoal,
        avatarUrl: sanitizeAvatarForSession(data.avatarUrl),
        themePreference: data.themePreference,
      });
    } catch (fetchError: any) {
      const message = fetchError?.message || "No se pudo cargar el perfil.";

      if (message.includes("Sesión inválida") || message.includes("No autorizado")) {
        await signOut();
        router.replace("/login");
        return;
      }

      console.log(fetchError);
      setError(message);
    } finally {
      setRefreshing(false);
    }
  }, [router, sessionUserId, signOut, updateUser]);

  useEffect(() => {
    if (!authLoading && !sessionUserId) {
      router.replace("/login");
    }
  }, [authLoading, router, sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || !sessionUser) {
      fetchedProfileUserIdRef.current = null;
      setProfile(null);
      setNameDraft("");
      return;
    }

    const fallbackProfile = buildFallbackProfile(sessionUser);
    setProfile((current) => current ?? fallbackProfile);
    setNameDraft((current) => current || fallbackProfile.name);

    if (fetchedProfileUserIdRef.current !== sessionUserId) {
      fetchedProfileUserIdRef.current = sessionUserId;
      void fetchProfile();
    }
  }, [fetchProfile, sessionUser, sessionUserId]);

  const activeUser = useMemo(() => {
    if (profile) {
      return profile;
    }

    if (sessionUser) {
      return buildFallbackProfile(sessionUser);
    }

    return {
      id: 0,
      name: "Estudiante MateCamba",
      email: "demo@matecamba.bo",
      xp: 0,
      hearts: 5,
      streak: 0,
      dailyGoal: 3,
      avatarUrl: null,
      themePreference: "light" as const,
      completedLessons: 0,
      totalStars: 0,
    };
  }, [profile, sessionUser]);

  const level = getLevelFromXp(activeUser.xp);
  const xpProgress = getLevelProgress(activeUser.xp);
  const phase = getPhaseLabel(level);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Quieres salir de tu cuenta ahora?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/login");
          } catch (logoutError) {
            console.log(logoutError);
          }
        },
      },
    ]);
  };

  const syncProfileUser = async (
    nextProfileUser: Partial<UserProfile>,
    nextSessionUser?: Partial<UserProfile>
  ) => {
    setProfile((current) => (current ? { ...current, ...nextProfileUser } : current));
    const sessionPayload = nextSessionUser ?? nextProfileUser;
    await updateUser({
      ...sessionPayload,
      avatarUrl: sanitizeAvatarForSession(sessionPayload.avatarUrl),
    });
  };

  const saveName = async () => {
    const trimmedName = nameDraft.trim();

    if (trimmedName.length < 2) {
      Alert.alert("Nombre inválido", "El nombre debe tener al menos 2 caracteres.");
      return;
    }

    setSavingName(true);
    try {
      const response = await updateUserProfile({ name: trimmedName });
      await syncProfileUser(response.profile ?? response.user, response.user);
      setEditingName(false);
    } catch (saveError: any) {
      Alert.alert("No se pudo actualizar", saveError.message || "Error al guardar el nombre.");
    } finally {
      setSavingName(false);
    }
  };

  const pickProfilePhoto = async () => {
    setSavingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Debes permitir acceso a tus fotos para cambiar la imagen de perfil.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const estimatedBase64Length = asset.base64?.length ?? 0;

      if (estimatedBase64Length > 2_500_000) {
        Alert.alert(
          "Foto muy pesada",
          "Elige una imagen más ligera o recórtala mejor antes de subirla."
        );
        return;
      }

      const avatarUrl = asset.base64
        ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
        : asset.uri;

      const response = await updateUserProfile({ avatarUrl });
      await syncProfileUser(response.profile ?? response.user, response.user);
    } catch (photoError: any) {
      Alert.alert("No se pudo cambiar la foto", photoError.message || "Vuelve a intentarlo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const removeProfilePhoto = async () => {
    setSavingPhoto(true);
    try {
      const response = await updateUserProfile({ avatarUrl: null });
      await syncProfileUser(response.profile ?? response.user, response.user);
    } catch (photoError: any) {
      Alert.alert("No se pudo quitar la foto", photoError.message || "Vuelve a intentarlo.");
    } finally {
      setSavingPhoto(false);
    }
  };

  const cycleDailyGoal = async () => {
    const nextGoal = activeUser.dailyGoal === 3 ? 5 : activeUser.dailyGoal === 5 ? 7 : 3;
    setSavingGoal(true);
    try {
      const response = await updateUserProfile({ dailyGoal: nextGoal });
      await syncProfileUser(response.profile ?? response.user, response.user);
    } catch (goalError: any) {
      Alert.alert("No se pudo actualizar la meta", goalError.message || "Vuelve a intentarlo.");
    } finally {
      setSavingGoal(false);
    }
  };

  const switchTheme = async () => {
    const previousTheme = themeName;
    const nextTheme = themeName === "light" ? "dark" : "light";
    setSavingTheme(true);

    try {
      await setThemeName(nextTheme);
      const response = await updateUserProfile({ themePreference: nextTheme });
      await syncProfileUser(response.profile ?? response.user, response.user);
    } catch (themeError: any) {
      await setThemeName(previousTheme);
      Alert.alert("No se pudo cambiar el tema", themeError.message || "Vuelve a intentarlo.");
    } finally {
      setSavingTheme(false);
    }
  };

  const showLoggedOutState = !authLoading && !sessionUserId && !profile;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Perfil</Text>

        {authLoading && !profile ? (
          <View style={styles.refreshRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.refreshText, { color: theme.textSoft }]}>Cargando sesión...</Text>
          </View>
        ) : null}

        {refreshing ? (
          <View style={styles.refreshRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.refreshText, { color: theme.textSoft }]}>Actualizando perfil...</Text>
          </View>
        ) : null}

        {showLoggedOutState ? (
          <View style={[styles.loggedOutCard, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="person-circle-outline" size={42} color={theme.secondary} />
            <Text style={[styles.loggedOutTitle, { color: theme.text }]}>Tu sesión no está activa</Text>
            <Text style={[styles.loggedOutText, { color: theme.textSoft }]}>
              Vuelve a iniciar sesión para ver y editar tu perfil.
            </Text>
            <TouchableOpacity
              style={[styles.retryProfileButton, { backgroundColor: theme.primary }]}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.retryProfileButtonText}>Ir al login</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: theme.mode === "dark" ? "#3a1d22" : "#fff1f2" }]}>
            <Ionicons name="warning-outline" size={18} color={theme.danger} />
            <Text style={[styles.errorCardText, { color: theme.danger }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryProfileButton, { backgroundColor: theme.primary }]}
              onPress={() => void fetchProfile()}
            >
              <Text style={styles.retryProfileButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: theme.secondary }]}
            onPress={pickProfilePhoto}
            disabled={savingPhoto}
          >
            {activeUser.avatarUrl ? (
              <Image source={{ uri: activeUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{activeUser.name.charAt(0).toUpperCase()}</Text>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {editingName ? (
            <View style={styles.editNameWrap}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="Tu nombre"
                placeholderTextColor={theme.textSoft}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.inlineButton, { backgroundColor: theme.secondary }]}
                  onPress={saveName}
                  disabled={savingName}
                >
                  <Text style={styles.inlineButtonText}>{savingName ? "Guardando..." : "Guardar"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inlineButton, { backgroundColor: theme.surfaceMuted }]}
                  onPress={() => {
                    setNameDraft(activeUser.name);
                    setEditingName(false);
                  }}
                >
                  <Text style={[styles.inlineButtonText, { color: theme.text }]}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.userName, { color: theme.text }]}>{activeUser.name}</Text>
              <Text style={[styles.userEmail, { color: theme.textSoft }]}>{activeUser.email}</Text>
            </>
          )}

          <Text
            style={[
              styles.phasePill,
              {
                backgroundColor: theme.mode === "dark" ? "#1d3623" : "#e8f7d8",
                color: theme.primary,
              },
            ]}
          >
            {phase}
          </Text>
        </View>

        <View style={styles.avatarButtonsRow}>
          <TouchableOpacity
            style={[styles.avatarAction, { backgroundColor: theme.surfaceMuted }]}
            onPress={pickProfilePhoto}
            disabled={savingPhoto}
          >
            <Ionicons name="image-outline" size={18} color={theme.secondary} />
            <Text style={[styles.avatarActionText, { color: theme.text }]}>
              {savingPhoto ? "Subiendo..." : "Cambiar foto"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.avatarAction, { backgroundColor: theme.surfaceMuted }]}
            onPress={removeProfilePhoto}
            disabled={savingPhoto || !activeUser.avatarUrl}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.avatarActionText, { color: theme.text }]}>Quitar foto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: theme.surfaceMuted }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.surface }]}>
              <Ionicons name="flash-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.primary }]}>{level}</Text>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>Nivel</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surfaceMuted }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.surface }]}>
              <Ionicons name="trophy-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.primary }]}>{activeUser.xp}</Text>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>XP total</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: theme.surfaceMuted }]}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.surface }]}>
              <Ionicons name="star-outline" size={18} color="#ffb100" />
            </View>
            <View style={styles.heartsRow}>
              <Ionicons name="star" size={16} color="#ffb100" />
              <Text style={[styles.statValue, { color: theme.primary }]}>{activeUser.totalStars}</Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>Estrellas</Text>
          </View>
        </View>

        <View style={styles.xpSection}>
          <Text style={[styles.xpLabel, { color: theme.textSoft }]}>Progreso al siguiente nivel</Text>
          <View style={[styles.xpBarContainer, { backgroundColor: theme.surfaceMuted }]}>
            <View
              style={[
                styles.xpBar,
                {
                  width: `${(xpProgress / XP_PER_LEVEL) * 100}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.xpText, { color: theme.textSoft }]}>
            {xpProgress}/{XP_PER_LEVEL} XP
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Estadísticas</Text>

          <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.statRowLabel, { color: theme.text }]}>🔥 Racha actual</Text>
            <Text style={[styles.statRowValue, { color: theme.primary }]}>{activeUser.streak} días</Text>
          </View>

          <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.statRowLabel, { color: theme.text }]}>✅ Lecciones completadas</Text>
            <Text style={[styles.statRowValue, { color: theme.primary }]}>{activeUser.completedLessons}</Text>
          </View>

          <View style={[styles.statRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.statRowLabel, { color: theme.text }]}>🎯 Meta diaria</Text>
            <Text style={[styles.statRowValue, { color: theme.primary }]}>{activeUser.dailyGoal} retos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cuenta y app</Text>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.surfaceMuted }]}
            onPress={() => setEditingName((current) => !current)}
          >
            <Ionicons name="create-outline" size={20} color={theme.secondary} />
            <Text style={[styles.optionText, { color: theme.text }]}>
              {editingName ? "Cancelar edición de nombre" : "Editar nombre"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.surfaceMuted }]}
            onPress={cycleDailyGoal}
            disabled={savingGoal}
          >
            <Ionicons name="flag-outline" size={20} color={theme.secondary} />
            <Text style={[styles.optionText, { color: theme.text }]}>
              {savingGoal ? "Guardando meta..." : `Meta diaria: ${activeUser.dailyGoal} retos`}
            </Text>
            <Ionicons name="repeat-outline" size={18} color={theme.textSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.surfaceMuted }]}
            onPress={switchTheme}
            disabled={savingTheme}
          >
            <Ionicons
              name={themeName === "light" ? "moon-outline" : "sunny-outline"}
              size={20}
              color={theme.secondary}
            />
            <Text style={[styles.optionText, { color: theme.text }]}>
              {savingTheme
                ? "Cambiando tema..."
                : `Tema actual: ${themeName === "light" ? "claro" : "oscuro"}`}
            </Text>
            <Ionicons name="color-palette-outline" size={18} color={theme.textSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.surfaceMuted }]}
            onPress={() => router.push("/terms" as any)}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.secondary} />
            <Text style={[styles.optionText, { color: theme.text }]}>Términos y condiciones</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSoft} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loggedOutCard: {
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  loggedOutTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
  },
  loggedOutText: {
    textAlign: "center",
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 14,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorCardText: {
    flex: 1,
    fontWeight: "600",
  },
  retryProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryProfileButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cameraBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#173d32",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  phasePill: {
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  editNameWrap: {
    width: "100%",
    gap: 10,
    marginBottom: 8,
  },
  nameInput: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  inlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inlineButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  avatarButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  avatarAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
  },
  avatarActionText: {
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpSection: {
    marginBottom: 24,
  },
  xpLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  xpBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  xpBar: {
    height: "100%",
    borderRadius: 6,
  },
  xpText: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statRowLabel: {
    fontSize: 14,
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#ffdfe0",
    padding: 18,
    borderRadius: 16,
  },
  logoutText: {
    color: "#ff4b4b",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
