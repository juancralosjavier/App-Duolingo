import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getCourses, getUserProgress } from "../../services/api";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useAuth } from "../../hooks/useAuth";

interface ProgressRecord {
  lessonId: number;
  completed: boolean;
  accuracy: number;
  attempts: number;
  lesson?: {
    id: number;
    title: string;
    challengeType: string;
    difficulty: number;
  };
}

interface ProgressResponse {
  records: ProgressRecord[];
  summary: {
    completedLessons: number;
    totalStars: number;
    totalAttempts: number;
  };
}

interface Course {
  id: number;
  title: string;
  icon: string;
  units: { lessons: { id: number }[] }[];
}

const challengeLibrary = [
  {
    title: "Patrones",
    detail: "Lee tablas, completa secuencias y detecta regularidades rápidas.",
    icon: "grid-outline" as const,
  },
  {
    title: "Cálculo mental",
    detail: "Multiplicaciones, despejes y respuestas con teclado numérico.",
    icon: "flash-outline" as const,
  },
  {
    title: "Constructor",
    detail: "Arma ecuaciones con fichas para reforzar lógica algebraica.",
    icon: "construct-outline" as const,
  },
];

function ProgressTask({
  title,
  progress,
  target,
  icon,
  color,
  theme,
}: {
  title: string;
  progress: number;
  target: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  theme: any;
}) {
  const value = Math.min(progress, target);
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const unlocked = value >= target;

  return (
    <View style={[styles.taskCard, { borderBottomColor: theme.border }]}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, { color: theme.text }]}>{title}</Text>
        <View style={[styles.taskChest, { backgroundColor: unlocked ? `${color}20` : theme.surfaceMuted }]}>
          <Ionicons
            name={unlocked ? "gift" : "lock-closed"}
            size={18}
            color={unlocked ? color : theme.textSoft}
          />
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
        <View style={[styles.trackFill, { width: `${percentage}%`, backgroundColor: color }]} />
        <View style={styles.trackContent}>
          <Ionicons name={icon} size={14} color="#fff" />
          <Text style={styles.trackText}>
            {value}/{target}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ChallengeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [progressResponse, coursesResponse] = await Promise.all([getUserProgress(), getCourses()]);
      setProgressData(progressResponse);
      setCourses(coursesResponse);
    } catch (loadError: any) {
      setError(loadError.message || "No se pudieron cargar los retos");
    } finally {
      setLoading(false);
    }
  };

  const summary = progressData?.summary || {
    completedLessons: 0,
    totalStars: 0,
    totalAttempts: 0,
  };
  const records = progressData?.records || [];

  const monthlyTarget = 15;
  const monthlyProgress = Math.min(monthlyTarget, summary.totalStars + Math.max(0, summary.completedLessons - 1));
  const streakGoal = user?.streak && user.streak > 0 ? 1 : 0;
  const highAccuracyCount = records.filter((record) => record.accuracy >= 80).length;
  const practiceMinutes = Math.min(5, summary.totalAttempts);
  const activeLessons = useMemo(
    () => courses.reduce((sum, course) => sum + course.units.reduce((acc, unit) => acc + unit.lessons.length, 0), 0),
    [courses]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <Ionicons name="warning-outline" size={44} color={theme.warning} />
        <Text style={[styles.errorText, { color: theme.textSoft }]}>{error}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={loadData}>
          <Text style={styles.primaryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: "#10a4f0" }]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Desafío del mes</Text>
            <Text style={styles.heroTimer}>Queda 1 día</Text>
          </View>
          <View style={[styles.heroProgressCard, { backgroundColor: "#102630" }]}>
            <Text style={styles.heroProgressTitle}>Gana 15 puntos de desafío</Text>
            <View style={[styles.track, { backgroundColor: "#314855" }]}>
              <View style={[styles.trackFill, { width: `${(monthlyProgress / monthlyTarget) * 100}%`, backgroundColor: "#3cb8ff" }]} />
              <View style={styles.trackContent}>
                <Ionicons name="diamond-outline" size={14} color="#fff" />
                <Text style={styles.trackText}>
                  {monthlyProgress} / {monthlyTarget}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSoft }]}>Desafío entre amigos</Text>
          <View style={[styles.socialCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.socialText, { color: theme.text }]}>
              ¡Completa una lección y luego abre espacio para competir con tus amigos!
            </Text>
            <TouchableOpacity style={[styles.outlineButton, { borderColor: theme.border }]} onPress={() => router.push("/(tabs)/profile")}>
              <Text style={[styles.outlineButtonText, { color: theme.text }]}>Ir a mi perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionLabel, { color: theme.textSoft }]}>Desafíos del día</Text>
            <View style={styles.timerRow}>
              <Ionicons name="timer-outline" size={15} color={theme.textSoft} />
              <Text style={[styles.timerText, { color: theme.textSoft }]}>8h</Text>
            </View>
          </View>

          <View style={[styles.dailyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <ProgressTask
              title="Empieza una racha"
              progress={streakGoal}
              target={1}
              icon="flame"
              color="#3cb8ff"
              theme={theme}
            />
            <ProgressTask
              title="Obtén un puntaje de 80 % en 2 lecciones"
              progress={highAccuracyCount}
              target={2}
              icon="speedometer"
              color="#4da8ff"
              theme={theme}
            />
            <ProgressTask
              title="Aprende durante 5 minutos"
              progress={practiceMinutes}
              target={5}
              icon="time-outline"
              color="#ffd33d"
              theme={theme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tu tablero de progreso</Text>
          <View style={[styles.dashboardCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.challengePointText, { color: theme.secondary }]}>+{summary.totalStars} puntos de desafío</Text>

            <View style={[styles.progressBadge, { borderColor: theme.secondary }]}>
              <Text style={[styles.progressBadgeText, { color: theme.secondary }]}>
                Rutas activas: {courses.length}
              </Text>
            </View>

            <View style={styles.dashboardGrid}>
              <View style={[styles.dashboardStat, { backgroundColor: theme.surfaceMuted }]}>
                <Text style={[styles.dashboardValue, { color: theme.text }]}>{summary.completedLessons}</Text>
                <Text style={[styles.dashboardLabel, { color: theme.textSoft }]}>Lecciones cerradas</Text>
              </View>
              <View style={[styles.dashboardStat, { backgroundColor: theme.surfaceMuted }]}>
                <Text style={[styles.dashboardValue, { color: theme.text }]}>{activeLessons}</Text>
                <Text style={[styles.dashboardLabel, { color: theme.textSoft }]}>Retos en biblioteca</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Biblioteca interactiva</Text>
          {challengeLibrary.map((item) => (
            <View
              key={item.title}
              style={[styles.libraryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.libraryIcon, { backgroundColor: theme.surfaceMuted }]}>
                <Ionicons name={item.icon} size={22} color={theme.secondary} />
              </View>
              <View style={styles.libraryContent}>
                <Text style={[styles.libraryTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.libraryText, { color: theme.textSoft }]}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorText: {
    textAlign: "center",
  },
  hero: {
    borderRadius: 26,
    padding: 20,
    marginBottom: 24,
  },
  heroContent: {
    marginBottom: 18,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroTimer: {
    color: "#dff3ff",
    fontSize: 15,
    fontWeight: "700",
  },
  heroProgressCard: {
    borderRadius: 22,
    padding: 18,
  },
  heroProgressTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontWeight: "700",
  },
  socialCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  socialText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  outlineButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineButtonText: {
    fontWeight: "800",
  },
  dailyCard: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  taskCard: {
    padding: 18,
    borderBottomWidth: 1,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  taskChest: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "center",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  trackContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  trackText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
  },
  dashboardCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  challengePointText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 14,
  },
  progressBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  progressBadgeText: {
    fontWeight: "700",
  },
  dashboardGrid: {
    flexDirection: "row",
    gap: 12,
  },
  dashboardStat: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
  },
  dashboardValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  dashboardLabel: {
    marginTop: 6,
    lineHeight: 20,
  },
  libraryCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  libraryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  libraryContent: {
    flex: 1,
  },
  libraryTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  libraryText: {
    lineHeight: 22,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
