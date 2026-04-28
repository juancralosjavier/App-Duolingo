import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getCourseDetail, getUserProgress } from "../../services/api";
import LessonPath from "../../components/LessonPath";
import { useAuth } from "../../hooks/useAuth";
import { useAppTheme } from "../../hooks/useAppTheme";

interface Question {
  id: number;
}

interface Lesson {
  id: number;
  title: string;
  summary: string;
  difficulty: number;
  challengeType: string;
  requiredStars: number;
  icon: string;
  questions: Question[];
}

interface Unit {
  id: number;
  title: string;
  summary: string;
  requiredXp: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  language: string;
  summary: string;
  icon: string;
  themeColor: string;
  units: Unit[];
}

interface ProgressRecord {
  lessonId: number;
  completed: boolean;
  stars: number;
}

export default function CourseScreen() {
  const { courseId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [course, setCourse] = useState<Course | null>(null);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [courseData, progressData] = await Promise.all([
        getCourseDetail(Number(courseId)),
        getUserProgress(),
      ]);

      setCourse(courseData);
      setProgressRecords(progressData.records || []);
    } catch (loadError: any) {
      setError(loadError.message || "No se pudo cargar el curso");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const progressMap = useMemo(
    () => new Map(progressRecords.map((record) => [record.lessonId, record])),
    [progressRecords]
  );

  const lessonUnits = useMemo(() => {
    if (!course) return [];

    const flattened = course.units.flatMap((unit) =>
      unit.lessons.map((lesson) => ({
        unitId: unit.id,
        requiredXp: unit.requiredXp,
        lesson,
      }))
    );

    const firstIncompleteIndex = flattened.findIndex(
      (entry) => !progressMap.get(entry.lesson.id)?.completed
    );
    const unlockedUntil = firstIncompleteIndex === -1 ? flattened.length - 1 : firstIncompleteIndex;
    const activeXp = user?.xp ?? 0;

    return course.units.map((unit) => ({
      id: unit.id,
      title: unit.title,
      summary: unit.summary,
      requiredXp: unit.requiredXp,
      lessons: unit.lessons.map((lesson) => {
        const record = progressMap.get(lesson.id);
        const indexInCourse = flattened.findIndex((entry) => entry.lesson.id === lesson.id);
        const unitUnlocked = activeXp >= unit.requiredXp;
        const completed = !!record?.completed;
        const locked = !completed && (!unitUnlocked || indexInCourse > unlockedUntil);
        const isCurrent = !completed && !locked && indexInCourse === unlockedUntil;

        return {
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          completed,
          locked,
          isCurrent,
          stars: record?.stars || 0,
          requiredStars: lesson.requiredStars,
          difficulty: lesson.difficulty,
          icon: lesson.icon,
          challengeType: lesson.challengeType,
        };
      }),
    }));
  }, [course, progressMap, user?.xp]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.backgroundAlt }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.backgroundAlt }]} edges={["bottom"]}>
        <Text style={[styles.errorText, { color: theme.textSoft }]}>{error || "No se encontró este curso."}</Text>
      </SafeAreaView>
    );
  }

  const totalLessons = course.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const totalQuestions = course.units.reduce(
    (sum, unit) =>
      sum + unit.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.questions.length, 0),
    0
  );
  const lessonIds = new Set(course.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
  const courseProgress = progressRecords.filter((item) => lessonIds.has(item.lessonId));
  const completedLessons = courseProgress.filter((item) => item.completed).length;
  const totalStars = courseProgress.reduce((sum, item) => sum + item.stars, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundAlt }]} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Volver</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              borderTopColor: course.themeColor,
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={[styles.iconBadge, { backgroundColor: `${course.themeColor}22` }]}>
              <Ionicons
                name={course.icon as keyof typeof Ionicons.glyphMap}
                size={26}
                color={course.themeColor}
              />
            </View>
            <Text
              style={[
                styles.courseType,
                {
                  backgroundColor: theme.mode === "dark" ? "#1d3623" : "#e8f7d8",
                  color: theme.primary,
                },
              ]}
            >
              {course.language}
            </Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{course.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>{course.summary}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{course.units.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSoft }]}>Unidades</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalLessons}</Text>
              <Text style={[styles.statLabel, { color: theme.textSoft }]}>Lecciones</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surfaceMuted }]}>
              <Text style={[styles.statValue, { color: theme.text }]}>{totalQuestions}</Text>
              <Text style={[styles.statLabel, { color: theme.textSoft }]}>Preguntas</Text>
            </View>
          </View>

          <View style={[styles.progressStrip, { backgroundColor: theme.mode === "dark" ? "#11232c" : "#173d32" }]}>
            <Text style={styles.progressText}>Avance: {completedLessons}/{totalLessons} lecciones</Text>
            <Text style={styles.progressText}>Estrellas: {totalStars}</Text>
          </View>
        </View>

        <Text style={[styles.pathTitle, { color: theme.text }]}>Camino de retos</Text>
        <Text style={[styles.pathSubtitle, { color: theme.textSoft }]}>
          Desbloquea nodos, mejora tus estrellas y supera fases con más dificultad.
        </Text>

        <LessonPath
          units={lessonUnits}
          onLessonPress={(lessonId) => router.push(`/lesson/${lessonId}` as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  topBar: {
    marginTop: 18,
    marginBottom: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  backButtonText: {
    fontWeight: "700",
  },
  errorText: {
    textAlign: "center",
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderTopWidth: 5,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  courseType: {
    alignSelf: "flex-start",
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
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
    marginBottom: 14,
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
  progressStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#173d32",
    borderRadius: 16,
    padding: 14,
  },
  progressText: {
    color: "#fff",
    fontWeight: "700",
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
