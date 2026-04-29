import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
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

  const firstName = user?.name?.split(" ")[0] || "estudiante";
  const level = getLevelFromXp(user?.xp || 0);
  const phase = getPhaseLabel(level);
  const featuredCourse = courses[0];
  const totalLessons = useMemo(
    () =>
      courses.reduce(
        (sum, course) =>
          sum + course.units.reduce((unitSum, unit) => unitSum + (unit.lessons?.length || 0), 0),
        0
      ),
    [courses]
  );

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
      <Text style={[styles.title, { color: theme.text }]}>Hola, {firstName}</Text>
      <Text style={[styles.subtitle, { color: theme.textSoft }]}>
        Estás en {phase}. Hoy toca resolver mates con ritmo, precisión y contexto local.
      </Text>

      <View style={[styles.heroCard, { backgroundColor: theme.mode === "dark" ? "#11232c" : "#103d2f" }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Meta del día</Text>
          <Text style={styles.heroTitle}>Supera 3 retos y gana estrellas</Text>
          <Text style={styles.heroText}>
            Mientras más estrellas consigas, más rápido desbloqueas las fases avanzadas.
          </Text>
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
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.summaryValue, { color: theme.text }]}>{progressSummary.completedLessons}</Text>
          <Text style={[styles.summaryLabel, { color: theme.textSoft }]}>lecciones superadas</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="bar-chart-outline" size={20} color={theme.secondary} />
          <Text style={[styles.summaryValue, { color: theme.text }]}>{progressSummary.totalAttempts}</Text>
          <Text style={[styles.summaryLabel, { color: theme.textSoft }]}>intentos totales</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Rutas de aprendizaje</Text>
        <Text style={[styles.sectionHelper, { color: theme.textSoft }]}>
          Cada ruta tiene fases, dificultad y juegos distintos.
        </Text>
      </View>

      <View style={styles.coursesGrid}>
        {courses.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={[styles.courseCircle, { backgroundColor: `${course.themeColor}18` }]}
            onPress={() => router.push(`/course/${course.id}` as any)}
          >
            <Ionicons
              name={course.icon as keyof typeof Ionicons.glyphMap}
              size={36}
              color={course.themeColor}
            />
            <Text style={styles.courseTitle} numberOfLines={2}>
              {course.title}
            </Text>
            <Text style={[styles.courseUnits, { color: theme.textSoft }]}>
              {course.language} • {course.units.length} unidades
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Siguiente foco</Text>
        <TouchableOpacity
          style={[styles.continueCard, { backgroundColor: theme.surfaceAccent }]}
          onPress={() => (featuredCourse ? router.push(`/course/${featuredCourse.id}` as any) : undefined)}
          disabled={!featuredCourse}
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
        <View style={[styles.streakCard, { backgroundColor: theme.mode === "dark" ? "#332913" : "#fff1c9" }]}>
          <Ionicons name="sparkles-outline" size={28} color={theme.warning} />
          <View style={styles.streakContent}>
            <Text style={[styles.streakDays, { color: theme.warning }]}>Mercado, tiempo, medidas y lógica</Text>
            <Text style={[styles.streakText, { color: theme.textSoft }]}>
              Ahora también sumamos patrones, factor faltante, teclado mental y construcción de ecuaciones.
            </Text>
          </View>
        </View>
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
  },
  heroContent: {
    marginBottom: 18,
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  courseCircle: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    padding: 18,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  courseUnits: {
    fontSize: 12,
    textAlign: "center",
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
