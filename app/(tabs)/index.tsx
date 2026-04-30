import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getCourses, getUserProgress } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { getLevelFromXp, getPhaseLabel } from "../../constants/learning";
import { useAppTheme } from "../../hooks/useAppTheme";

interface LessonLite {
  id: number;
}

interface UnitLite {
  id: number;
  title: string;
  lessons?: LessonLite[];
}

interface Course {
  id: number;
  title: string;
  language: string;
  summary: string;
  icon: string;
  themeColor: string;
  units: UnitLite[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressSummary, setProgressSummary] = useState({
    completedLessons: 0,
    totalStars: 0,
    totalAttempts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const progressBar = useRef(new Animated.Value(0)).current;

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesData, progressData] = await Promise.all([getCourses(), getUserProgress()]);
      const filtered = coursesData.filter((course: Course) => course.units && course.units.length > 0);
      setCourses(filtered);
      setProgressSummary(
        progressData.summary || {
          completedLessons: 0,
          totalStars: 0,
          totalAttempts: 0,
        }
      );
    } catch (err: any) {
      setError(err.message || "No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (loading) {
      return;
    }

    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [entrance, loading, pulse]);

  const firstName = user?.name?.split(" ")[0] || "estudiante";
  const level = getLevelFromXp(user?.xp || 0);
  const phase = getPhaseLabel(level);
  const featuredCourse = courses[0];
  const dailyGoal = user?.dailyGoal || 3;
  const dailyProgressValue = Math.max(0, Math.min(1, progressSummary.completedLessons / dailyGoal));
  const totalLessons = useMemo(
    () =>
      courses.reduce(
        (sum, course) =>
          sum + course.units.reduce((unitSum, unit) => unitSum + (unit.lessons?.length || 0), 0),
        0
      ),
    [courses]
  );
  const animatedGoalWidth = progressBar.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  useEffect(() => {
    Animated.timing(progressBar, {
      toValue: dailyProgressValue,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [dailyProgressValue, progressBar]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="warning-outline" size={48} color={theme.warning} />
        <Text style={[styles.errorText, { color: theme.textSoft }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadCourses}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <Animated.Text
        style={[
          styles.title,
          {
            color: theme.text,
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        Hola, {firstName}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          {
            color: theme.textSoft,
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
          },
        ]}
      >
        Estás en {phase}. Hoy toca resolver mates con ritmo, precisión y contexto local.
      </Animated.Text>

      <Animated.View
        style={{
          opacity: entrance,
          transform: [
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
            { scale: pulse },
          ],
        }}
      >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => (featuredCourse ? router.push(`/course/${featuredCourse.id}` as any) : router.push("/(tabs)/practice"))}
        style={[styles.heroCard, { backgroundColor: theme.mode === "dark" ? "#11232c" : "#103d2f" }]}
      >
        <View style={styles.heroGlowLeft} />
        <View style={styles.heroGlowRight} />
        <View style={styles.heroContent}>
          <View style={styles.heroChipRow}>
            <View style={styles.heroChip}>
              <Ionicons name="flame-outline" size={14} color="#9ddf6f" />
              <Text style={styles.heroChipText}>Racha x{user?.streak || 0}</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="sparkles-outline" size={14} color="#9ddf6f" />
              <Text style={styles.heroChipText}>XP {user?.xp || 0}</Text>
            </View>
          </View>
          <Text style={styles.heroEyebrow}>Meta del día</Text>
          <Text style={styles.heroTitle}>Supera 3 retos y gana estrellas</Text>
          <Text style={styles.heroText}>
            Mientras más estrellas consigas, más rápido desbloqueas las fases avanzadas.
          </Text>
          <View style={[styles.goalTrack, { backgroundColor: "rgba(255,255,255,0.14)" }]}>
            <Animated.View style={[styles.goalFill, { width: animatedGoalWidth }]} />
            <Text style={styles.goalText}>
              {Math.min(progressSummary.completedLessons, dailyGoal)}/{dailyGoal} retos del día
            </Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{courses.length}</Text>
            <Text style={styles.heroStatLabel}>rutas</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{totalLessons}</Text>
            <Text style={styles.heroStatLabel}>retos</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{progressSummary.totalStars}</Text>
            <Text style={styles.heroStatLabel}>estrellas</Text>
          </View>
        </View>
      </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.summaryRow,
          {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.summaryCard, { backgroundColor: theme.surfaceMuted }]}
          onPress={() => router.push("/(tabs)/vocab")}
          activeOpacity={0.88}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.summaryValue, { color: theme.text }]}>{progressSummary.completedLessons}</Text>
          <Text style={[styles.summaryLabel, { color: theme.textSoft }]}>lecciones superadas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryCard, { backgroundColor: theme.surfaceMuted }]}
          onPress={() => router.push("/(tabs)/practice")}
          activeOpacity={0.88}
        >
          <Ionicons name="bar-chart-outline" size={20} color={theme.secondary} />
          <Text style={[styles.summaryValue, { color: theme.text }]}>{progressSummary.totalAttempts}</Text>
          <Text style={[styles.summaryLabel, { color: theme.textSoft }]}>intentos totales</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rutas de aprendizaje</Text>
        <Text style={[styles.sectionHelper, { color: theme.textSoft }]}>
          Cada ruta tiene fases, dificultad y juegos distintos.
        </Text>
      </View>

      <View style={styles.coursesGrid}>
        {courses.map((course, index) => (
          <Animated.View
            key={course.id}
            style={{
              width: "100%",
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30 + index * 6, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.courseCard,
                {
                  backgroundColor: `${course.themeColor}${theme.mode === "dark" ? "22" : "14"}`,
                  borderColor: `${course.themeColor}38`,
                },
              ]}
              onPress={() => router.push(`/course/${course.id}` as any)}
              activeOpacity={0.9}
            >
              <View style={[styles.courseIconOrb, { backgroundColor: `${course.themeColor}24` }]}>
                <Ionicons
                  name={course.icon as keyof typeof Ionicons.glyphMap}
                  size={34}
                  color={course.themeColor}
                />
                <View style={[styles.routePill, { backgroundColor: course.themeColor }]}>
                  <Text style={styles.routePillText}>Ruta {index + 1}</Text>
                </View>
              </View>
              <View style={styles.courseCopy}>
                <Text style={[styles.courseTitle, { color: theme.text }]} numberOfLines={2}>
                  {course.title}
                </Text>
                <Text style={[styles.courseUnits, { color: theme.textSoft }]}>
                  {course.language} · {course.units.length} unidades
                </Text>
                <Text style={[styles.courseSummary, { color: theme.textSoft }]} numberOfLines={2}>
                  {course.summary}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={course.themeColor} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Siguiente foco</Text>
        <TouchableOpacity
          style={[styles.continueCard, { backgroundColor: theme.surfaceAccent }]}
          onPress={() => (featuredCourse ? router.push(`/course/${featuredCourse.id}` as any) : undefined)}
          disabled={!featuredCourse}
          activeOpacity={0.92}
        >
          <View style={[styles.continueIcon, { backgroundColor: theme.surface }]}>
            <Ionicons name="flag-outline" size={22} color={theme.text} />
          </View>
          <View style={styles.continueContent}>
            <Text style={[styles.continueTitle, { color: theme.text }]}>
              {featuredCourse?.title || "Sin curso disponible"}
            </Text>
            <Text style={[styles.continueProgress, { color: theme.textSoft }]}>
              {featuredCourse
                ? `${featuredCourse.units.length} unidades listas para practicar`
                : "Carga el backend para ver el contenido"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Entrenas hoy</Text>
        <TouchableOpacity
          style={[styles.streakCard, { backgroundColor: theme.mode === "dark" ? "#332913" : "#fff1c9" }]}
          onPress={() => router.push("/(tabs)/practice")}
          activeOpacity={0.92}
        >
          <Ionicons name="sparkles-outline" size={28} color={theme.warning} />
          <View style={styles.streakContent}>
            <Text style={[styles.streakDays, { color: theme.warning }]}>Mercado, tiempo, medidas y lógica</Text>
            <Text style={[styles.streakText, { color: theme.textSoft }]}>
              Ahora también sumamos patrones, factor faltante, teclado mental y construcción de ecuaciones.
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: "#58cc02",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: "#103d2f",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroGlowLeft: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(88, 204, 2, 0.14)",
    top: -60,
    left: -50,
  },
  heroGlowRight: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(32, 184, 255, 0.12)",
    right: -40,
    bottom: -40,
  },
  heroContent: {
    marginBottom: 18,
  },
  heroChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroChipText: {
    color: "#d6f1c5",
    fontSize: 12,
    fontWeight: "800",
  },
  heroEyebrow: {
    color: "#9ddf6f",
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  heroText: {
    color: "#cce1d8",
    fontSize: 15,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
  },
  goalTrack: {
    marginTop: 16,
    height: 18,
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "center",
  },
  goalFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "#7fe33d",
  },
  goalText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: "#174839",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#b4d2c3",
    fontSize: 12,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f6fafc",
    borderRadius: 18,
    padding: 16,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
  },
  summaryLabel: {
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHelper: {
    color: "#7d8b92",
    marginTop: 4,
  },
  coursesGrid: {
    gap: 14,
    marginBottom: 26,
  },
  courseCard: {
    minHeight: 132,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    overflow: "hidden",
    position: "relative",
  },
  courseIconOrb: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  routePill: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  routePillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  courseCopy: {
    flex: 1,
    minWidth: 0,
  },
  courseTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  courseUnits: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  courseSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f7d8",
    padding: 16,
    borderRadius: 16,
  },
  continueIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  continueContent: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  continueProgress: {
    fontSize: 14,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff1c9",
    padding: 20,
    borderRadius: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakDays: {
    fontSize: 18,
    fontWeight: "bold",
  },
  streakText: {
    fontSize: 14,
    marginTop: 4,
  },
});
