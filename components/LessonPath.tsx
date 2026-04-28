import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDifficultyLabel, getChallengeTypeLabel } from "../constants/learning";
import { useAppTheme } from "../hooks/useAppTheme";

interface LessonNode {
  id: number;
  title: string;
  summary: string;
  completed: boolean;
  locked: boolean;
  isCurrent: boolean;
  stars: number;
  requiredStars: number;
  difficulty: number;
  icon: string;
  challengeType: string;
}

interface LessonPathProps {
  units: {
    id: number;
    title: string;
    summary: string;
    requiredXp: number;
    lessons: LessonNode[];
  }[];
  onLessonPress: (lessonId: number) => void;
}

function renderStars(stars: number) {
  return Array.from({ length: 3 }).map((_, index) => (
    <Ionicons
      key={`star-${index}`}
      name={index < stars ? "star" : "star-outline"}
      size={12}
      color={index < stars ? "#ffb100" : "#ced8dc"}
    />
  ));
}

export default function LessonPath({ units, onLessonPress }: LessonPathProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {units.map((unit) => (
        <View key={unit.id} style={styles.unitContainer}>
          <View style={styles.unitHeader}>
            <Text style={[styles.unitTitle, { color: theme.text }]}>{unit.title}</Text>
            <Text style={[styles.unitSummary, { color: theme.textSoft }]}>{unit.summary}</Text>
            <Text style={[styles.unitRequirement, { color: theme.secondary }]}>
              Desbloqueo sugerido: {unit.requiredXp} XP
            </Text>
          </View>

          <View style={styles.pathContainer}>
            {unit.lessons.map((lesson, lessonIndex) => (
              <View key={lesson.id} style={styles.lessonRow}>
                <TouchableOpacity
                  style={[
                    styles.node,
                    lesson.completed && styles.completedNode,
                    lesson.isCurrent && styles.currentNode,
                    lesson.locked && styles.lockedNode,
                  ]}
                  onPress={() => !lesson.locked && onLessonPress(lesson.id)}
                  disabled={lesson.locked}
                >
                  <Ionicons
                    name={
                      lesson.locked
                        ? "lock-closed"
                        : lesson.completed
                        ? "checkmark"
                        : lesson.isCurrent
                        ? "play"
                        : (lesson.icon as keyof typeof Ionicons.glyphMap)
                    }
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                    lesson.locked && styles.cardLocked,
                    lesson.isCurrent && [styles.cardCurrent, { borderColor: theme.secondary, backgroundColor: theme.backgroundAlt }],
                  ]}
                  onPress={() => !lesson.locked && onLessonPress(lesson.id)}
                  disabled={lesson.locked}
                >
                  <View style={styles.cardTop}>
                    <Text style={[styles.lessonTitle, { color: theme.text }]}>{lesson.title}</Text>
                    <View style={styles.starsRow}>{renderStars(lesson.stars)}</View>
                  </View>

                  <Text style={[styles.lessonSummary, { color: theme.textSoft }]}>{lesson.summary}</Text>

                  <View style={styles.metaRow}>
                    <Text style={[styles.metaPill, { backgroundColor: theme.surfaceMuted, color: theme.textSoft }]}>
                      {getDifficultyLabel(lesson.difficulty)}
                    </Text>
                    <Text style={[styles.metaPill, { backgroundColor: theme.surfaceMuted, color: theme.textSoft }]}>
                      {getChallengeTypeLabel(lesson.challengeType)}
                    </Text>
                    <Text style={[styles.metaPill, { backgroundColor: theme.surfaceMuted, color: theme.textSoft }]}>
                      Meta {lesson.requiredStars}★
                    </Text>
                  </View>
                </TouchableOpacity>

                {lessonIndex < unit.lessons.length - 1 ? (
                  <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  unitContainer: {
    marginBottom: 30,
  },
  unitHeader: {
    marginBottom: 14,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173d32",
  },
  unitSummary: {
    color: "#687a83",
    marginTop: 4,
  },
  unitRequirement: {
    color: "#2493ee",
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },
  pathContainer: {
    gap: 12,
  },
  lessonRow: {
    position: "relative",
    paddingLeft: 36,
  },
  node: {
    position: "absolute",
    left: 0,
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d0d8dd",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  completedNode: {
    backgroundColor: "#58cc02",
  },
  currentNode: {
    backgroundColor: "#2493ee",
  },
  lockedNode: {
    backgroundColor: "#c7d0d5",
  },
  connectorLine: {
    position: "absolute",
    left: 13,
    top: 42,
    width: 3,
    height: 56,
    backgroundColor: "#dfe7ea",
    borderRadius: 99,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6eef1",
  },
  cardLocked: {
    opacity: 0.65,
  },
  cardCurrent: {
    borderColor: "#2493ee",
    backgroundColor: "#f5fbff",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#173d32",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  lessonSummary: {
    color: "#61717b",
    marginTop: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    backgroundColor: "#f1f6f8",
    color: "#50636d",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
});
