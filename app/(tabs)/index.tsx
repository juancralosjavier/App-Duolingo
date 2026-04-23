import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { getCourses } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface Course {
  id: number;
  title: string;
  language: string;
  units: { id: number; title: string; lessons?: { id: number; title: string }[] }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCourses();
      const filtered = data.filter((c: Course) => c.units && c.units.length > 0);
      setCourses(filtered);
    } catch (err: any) {
      setError("No se pudo conectar al servidor");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const getCourseColor = (index: number) => {
    const colors = ["#e8f7d8", "#fff1c9", "#dff3ff", "#ffe0d5", "#ece8ff"];
    return colors[index % colors.length];
  };

  const getCourseEmoji = (index: number) => {
    const emojis = ["🧮", "📐", "🚌", "🛒", "📊"];
    return emojis[index % emojis.length];
  };

  const firstName = user?.name?.split(" ")[0] || "estudiante";
  const featuredCourse = courses[0];
  const totalLessons = courses.reduce(
    (sum, course) =>
      sum + course.units.reduce((unitSum, unit) => unitSum + (unit.lessons?.length || 0), 0),
    0
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58cc02" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCourses}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Hola, {firstName}</Text>
      <Text style={styles.subtitle}>
        Hoy practicamos mates con situaciones del día a día en Santa Cruz.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>Meta del día</Text>
          <Text style={styles.heroTitle}>Resuelve 3 retos y mantén tu racha</Text>
          <Text style={styles.heroText}>
            Mercado, micros, medidas y cálculo mental con enfoque local.
          </Text>
        </View>
        <View style={styles.heroStats}>
          <Text style={styles.heroStatValue}>{courses.length}</Text>
          <Text style={styles.heroStatLabel}>rutas</Text>
          <Text style={styles.heroStatDivider}>•</Text>
          <Text style={styles.heroStatValue}>{totalLessons}</Text>
          <Text style={styles.heroStatLabel}>retos</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Rutas de aprendizaje</Text>
        <Text style={styles.sectionHelper}>Tipo Duolingo Math, pero con identidad camba</Text>
      </View>

      <View style={styles.coursesGrid}>
        {courses.map((course, index) => (
          <TouchableOpacity
            key={course.id}
            style={[styles.courseCircle, { backgroundColor: getCourseColor(index) }]}
            onPress={() => router.push(`/course/${course.id}` as any)}
          >
            <Text style={styles.courseEmoji}>{getCourseEmoji(index)}</Text>
            <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
            <Text style={styles.courseUnits}>
              {course.language} • {course.units.length} unidades
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Siguiente foco</Text>
        <TouchableOpacity
          style={styles.continueCard}
          onPress={() =>
            featuredCourse
              ? router.push(`/course/${featuredCourse.id}` as any)
              : undefined
          }
          disabled={!featuredCourse}
        >
          <View style={styles.continueIcon}>
            <Text>🎯</Text>
          </View>
          <View style={styles.continueContent}>
            <Text style={styles.continueTitle}>
              {featuredCourse?.title || "Sin curso disponible"}
            </Text>
            <Text style={styles.continueProgress}>
              {featuredCourse
                ? `${featuredCourse.units.length} unidades listas para practicar`
                : "Carga el backend para ver el contenido"}
            </Text>
          </View>
          <Text style={styles.continueArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entrenas hoy</Text>
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>📍</Text>
          <View style={styles.streakContent}>
            <Text style={styles.streakDays}>Mercado, tiempo y medidas</Text>
            <Text style={styles.streakText}>
              Retos pensados para compras, transporte y espacios del barrio.
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
    backgroundColor: "#fff",
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
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
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
    color: "#777",
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: "#103d2f",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
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
    alignItems: "baseline",
  },
  heroStatValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#cce1d8",
    marginLeft: 6,
    marginRight: 14,
    fontSize: 14,
  },
  heroStatDivider: {
    color: "#9ddf6f",
    marginRight: 14,
    fontSize: 22,
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
    marginBottom: 30,
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
  courseEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  courseUnits: {
    fontSize: 12,
    color: "#666",
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
    color: "#666",
  },
  continueArrow: {
    fontSize: 24,
    color: "#58cc02",
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff1c9",
    padding: 20,
    borderRadius: 16,
  },
  streakEmoji: {
    fontSize: 34,
    marginRight: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakDays: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9c6400",
  },
  streakText: {
    fontSize: 14,
    color: "#666",
  },
});
