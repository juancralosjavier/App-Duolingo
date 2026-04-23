import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getCourseDetail } from "../../services/api";
import LessonPath from "../../components/LessonPath";

interface Course {
  id: number;
  title: string;
  language: string;
  units: Unit[];
}

interface Unit {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  title: string;
  questions: Question[];
}

interface Question {
  id: number;
  text: string;
}

export default function CourseScreen() {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const userId = 1;

  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
    try {
      const data = await getCourseDetail(Number(courseId));
      setCourse(data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!course) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58cc02" />
      </SafeAreaView>
    );
  }

  const totalLessons = course.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const totalQuestions = course.units.reduce(
    (sum, unit) =>
      sum + unit.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.questions.length, 0),
    0
  );

  const lessonUnits = course.units.map((unit, unitIndex) => ({
    id: unit.id,
    title: unit.title,
    lessons: unit.lessons.map((lesson, lessonIndex) => ({
      id: lesson.id,
      title: lesson.title,
      completed: false,
      locked: false,
      isCurrent: unitIndex === 0 && lessonIndex === 0,
    })),
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.courseType}>{course.language}</Text>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.subtitle}>
            Ruta de matemáticas aplicadas al día a día cruceño: compras, horarios,
            distancias, medidas y decisiones rápidas.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{course.units.length}</Text>
              <Text style={styles.statLabel}>Unidades</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalLessons}</Text>
              <Text style={styles.statLabel}>Lecciones</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalQuestions}</Text>
              <Text style={styles.statLabel}>Preguntas</Text>
            </View>
          </View>
        </View>

        <Text style={styles.pathTitle}>Camino de retos</Text>
        <Text style={styles.pathSubtitle}>
          Avanza como en Duolingo Math: nodos cortos, repetición y progreso visible.
        </Text>

        <LessonPath
          units={lessonUnits}
          onLessonPress={(lessonId) => router.push(`/lesson/${lessonId}?userId=${userId}` as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fbfc",
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f7fbfc",
    justifyContent: "center",
    alignItems: "center",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e6eef1",
  },
  courseType: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f7d8",
    color: "#2f7a14",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#173d32",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#61717b",
    lineHeight: 22,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f4f8fa",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#173d32",
  },
  statLabel: {
    color: "#6b7d87",
    marginTop: 4,
    fontSize: 12,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#173d32",
    marginBottom: 4,
  },
  pathSubtitle: {
    color: "#6b7d87",
    marginBottom: 10,
  },
});
