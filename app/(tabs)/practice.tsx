import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { getCourses } from "../../services/api";

interface Course {
  id: number;
  title: string;
  units: { id: number; title: string; lessons: { id: number; title: string }[] }[];
}

export default function PracticeScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const userId = 1;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const coursesData = await getCourses();
      const filtered = coursesData.filter((c: Course) => c.units && c.units.length > 0);
      setCourses(filtered);
    } catch (error) {
      console.log(error);
    }
  };

  const handleLessonPress = (lessonId: number) => {
    router.push(`/lesson/${lessonId}?userId=${userId}` as any);
  };

  const lessonPool = courses.flatMap((course) =>
    course.units.flatMap((unit) =>
      unit.lessons.map((lesson) => ({
        ...lesson,
        courseTitle: course.title,
        unitTitle: unit.title,
      }))
    )
  );

  const quickCards = [
    { icon: "🛒", title: "Cambio rápido", desc: "Entrena vueltas y sumas mentales" },
    { icon: "🚌", title: "Tiempo de micro", desc: "Resuelve minutos y horarios" },
    { icon: "📐", title: "Medidas del barrio", desc: "Perímetro, áreas y estimación" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Práctica rápida</Text>
      <Text style={styles.subtitle}>
        Retos cortos para mantener ritmo y cálculo mental.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ejercicios Rápidos</Text>
        {lessonPool.slice(0, 3).map((lesson, index) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.quickCard}
            onPress={() => handleLessonPress(lesson.id)}
          >
            <Text style={styles.quickIcon}>{quickCards[index]?.icon || "🎯"}</Text>
            <View style={styles.quickContent}>
              <Text style={styles.quickTitle}>
                {quickCards[index]?.title || lesson.title}
              </Text>
              <Text style={styles.quickDesc}>
                {quickCards[index]?.desc || lesson.unitTitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lecciones Recientes</Text>
        {lessonPool.length > 0 ? (
          lessonPool.slice(0, 4).map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonCard}
              onPress={() => handleLessonPress(lesson.id)}
            >
              <View style={styles.lessonIcon}>
                <Text style={styles.lessonEmoji}>📝</Text>
              </View>
              <View style={styles.lessonContent}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonCourse}>{lesson.courseTitle}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noLessons}>No hay lecciones disponibles</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estrategia del día</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            Antes de tocar la calculadora, estima el resultado. Esa es la habilidad
            que más sirve en compras, transporte y trabajo diario.
          </Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6fbf2",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dceecb",
  },
  quickIcon: {
    fontSize: 32,
    marginRight: 16,
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
    color: "#777",
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
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
  lessonEmoji: {
    fontSize: 20,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  lessonCourse: {
    fontSize: 12,
    color: "#777",
  },
  arrow: {
    fontSize: 24,
    color: "#ccc",
  },
  noLessons: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e7f3ff",
    padding: 16,
    borderRadius: 16,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#1976d2",
  },
});
