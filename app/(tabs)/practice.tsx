import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getCourses, getUserProgress } from "../../services/api";
import { getChallengeTypeLabel, getDifficultyLabel } from "../../constants/learning";
import { useAppTheme } from "../../hooks/useAppTheme";

interface Lesson {
  id: number;
  title: string;
  summary: string;
  difficulty: number;
  challengeType: string;
  icon: string;
}

interface Unit {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  units: Unit[];
}

interface ProgressRecord {
  lessonId: number;
  completed: boolean;
}

export default function PracticeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [coursesData, progressData] = await Promise.all([getCourses(), getUserProgress()]);
      const filtered = coursesData.filter((course: Course) => course.units && course.units.length > 0);
      setCourses(filtered);
      setProgressRecords(progressData.records || []);
    } catch (loadError: any) {
      setError(loadError.message || "No se pudo cargar la práctica");
    } finally {
      setLoading(false);
    }
  };

  const progressMap = useMemo(
    () => new Map(progressRecords.map((record) => [record.lessonId, record])),
    [progressRecords]
  );

  const lessonPool = useMemo(
    () =>
      courses.flatMap((course) =>
        course.units.flatMap((unit) =>
          unit.lessons.map((lesson) => ({
            ...lesson,
            courseTitle: course.title,
            unitTitle: unit.title,
            completed: !!progressMap.get(lesson.id)?.completed,
          }))
        )
      ),
    [courses, progressMap]
  );

  const gameModes = [
    {
      key: "multiple_choice",
      icon: "apps-outline" as const,
      title: "Selección rápida",
      desc: "Varias opciones, una respuesta correcta.",
    },
    {
      key: "numeric_input",
      icon: "keypad-outline" as const,
      title: "Respuesta numérica",
      desc: "Escribe el resultado sin ayuda.",
    },
    {
      key: "true_false",
      icon: "help-circle-outline" as const,
      title: "Verdadero o falso",
      desc: "Decide si la afirmación está bien resuelta.",
    },
    {
      key: "sequence_choice",
      icon: "git-compare-outline" as const,
      title: "Secuencia lógica",
      desc: "Ordena pasos para llegar al resultado.",
    },
    {
      key: "pattern_grid_choice",
      icon: "grid-outline" as const,
      title: "Patrones visuales",
      desc: "Completa tablas y detecta relaciones multiplicativas.",
    },
    {
      key: "missing_factor_choice",
      icon: "remove-outline" as const,
      title: "Factor faltante",
      desc: "Encuentra el número escondido dentro de la ecuación.",
    },
    {
      key: "numeric_keypad",
      icon: "keypad-outline" as const,
      title: "Teclado mental",
      desc: "Resuelve rápido escribiendo tu respuesta con teclado propio.",
    },
    {
      key: "equation_builder",
      icon: "construct-outline" as const,
      title: "Constructor algebraico",
      desc: "Arma ecuaciones con fichas y completa igualdades.",
    },
    {
      key: "logic",
      icon: "bulb-outline" as const,
      title: "Lógica universitaria",
      desc: "Resuelve pasos de funciones, tasas y despejes iniciales.",
    },
    {
      key: "mixed",
      icon: "shuffle-outline" as const,
      title: "Reto mixto",
      desc: "Combina cálculo, selección, secuencias y lectura de datos.",
    },
    {
      key: "speed",
      icon: "timer-outline" as const,
      title: "Ritmo rápido",
      desc: "Entrena cálculos cortos bajo presión mental.",
    },
  ];

  const launchMode = (type: string) => {
    const lesson =
      lessonPool.find((item) => item.challengeType === type && !item.completed) ||
      lessonPool.find((item) => item.challengeType === type) ||
      lessonPool.find((item) => !item.completed) ||
      lessonPool[0];
    if (lesson) {
      router.push({
        pathname: `/lesson/${lesson.id}` as any,
        params: {
          returnTo: "/(tabs)/practice",
        },
      });
    }
  };

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
        <Ionicons name="warning-outline" size={42} color={theme.warning} />
        <Text style={[styles.errorText, { color: theme.textSoft }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadData}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: theme.text }]}>Juegos de práctica</Text>
      <Text style={[styles.subtitle, { color: theme.textSoft }]}>
        Cambia de modo según la habilidad que quieras fortalecer.
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Modos de juego</Text>
        {gameModes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[styles.quickCard, { backgroundColor: theme.surfaceAccent, borderColor: theme.border }]}
            onPress={() => launchMode(mode.key)}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name={mode.icon} size={24} color={theme.text} />
            </View>
            <View style={styles.quickContent}>
              <Text style={[styles.quickTitle, { color: theme.text }]}>{mode.title}</Text>
              <Text style={[styles.quickDesc, { color: theme.textSoft }]}>{mode.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSoft} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Lecciones activas</Text>
        {lessonPool.length > 0 ? (
          lessonPool.slice(0, 6).map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={[styles.lessonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: `/lesson/${lesson.id}` as any,
                  params: {
                    returnTo: "/(tabs)/practice",
                  },
                })
              }
            >
              <View style={[styles.lessonIcon, { backgroundColor: theme.surfaceAccent }]}>
                <Ionicons
                  name={lesson.icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={theme.text}
                />
              </View>
              <View style={styles.lessonContent}>
                <Text style={[styles.lessonTitle, { color: theme.text }]}>{lesson.title}</Text>
                <Text style={[styles.lessonCourse, { color: theme.textSoft }]}>{lesson.courseTitle}</Text>
                <Text style={[styles.lessonMeta, { color: theme.secondary }]}>
                  {getChallengeTypeLabel(lesson.challengeType)} · {getDifficultyLabel(lesson.difficulty)}
                </Text>
              </View>
              {lesson.completed ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
              ) : (
                <Ionicons name="play-circle-outline" size={22} color={theme.secondary} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.noLessons, { color: theme.textSoft }]}>No hay lecciones disponibles</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Consejo táctico</Text>
        <View style={[styles.tipCard, { backgroundColor: theme.mode === "dark" ? "#172a36" : "#e7f3ff" }]}>
          <Ionicons name="bulb-outline" size={22} color={theme.secondary} />
          <Text style={[styles.tipText, { color: theme.secondary }]}>
            Si fallas en una fase avanzada, vuelve a una lección básica del mismo tema y mejora tu precisión
            antes de seguir subiendo.
          </Text>
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
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginVertical: 12,
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
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickContent: {
    flex: 1,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  quickDesc: {
    fontSize: 14,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  lessonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dff7c8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  lessonCourse: {
    fontSize: 12,
    marginTop: 2,
  },
  lessonMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  noLessons: {
    fontSize: 14,
    fontStyle: "italic",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
