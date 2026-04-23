import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const NODE_SIZE = 60;
const PATH_WIDTH = 4;

interface LessonNode {
  id: number;
  title: string;
  completed: boolean;
  locked: boolean;
  isCurrent: boolean;
}

interface LessonPathProps {
  units: {
    id: number;
    title: string;
    lessons: LessonNode[];
  }[];
  onLessonPress: (lessonId: number) => void;
}

export default function LessonPath({ units, onLessonPress }: LessonPathProps) {
  const renderConnectionLine = (index: number, isVertical: boolean = true) => {
    return (
      <View
        style={[
          styles.connectionLine,
          isVertical ? styles.verticalLine : styles.horizontalLine,
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {units.map((unit, unitIndex) => (
        <View key={unit.id} style={styles.unitContainer}>
          <Text style={styles.unitTitle}>{unit.title}</Text>
          
          <View style={styles.pathContainer}>
            {unit.lessons.map((lesson, lessonIndex) => (
              <View key={lesson.id}>
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
                  <Text style={styles.nodeIcon}>
                    {lesson.completed ? "✓" : lesson.isCurrent ? "▶" : lesson.locked ? "🔒" : lessonIndex + 1}
                  </Text>
                </TouchableOpacity>
                
                {lessonIndex < unit.lessons.length - 1 && (
                  <View style={styles.nodeConnector}>
                    <View
                      style={[
                        styles.connectorLine,
                        lesson.completed && styles.completedConnector,
                      ]}
                    />
                  </View>
                )}
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
    padding: 16,
  },
  unitContainer: {
    marginBottom: 32,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#58cc02",
    marginBottom: 16,
    textAlign: "center",
  },
  pathContainer: {
    alignItems: "center",
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ccc",
  },
  completedNode: {
    backgroundColor: "#58cc02",
    borderColor: "#46a302",
  },
  currentNode: {
    backgroundColor: "#2493ee",
    borderColor: "#1a7cc7",
  },
  lockedNode: {
    backgroundColor: "#e5e5e5",
    borderColor: "#ccc",
    opacity: 0.6,
  },
  nodeIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  nodeConnector: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  connectorLine: {
    width: PATH_WIDTH,
    height: 20,
    backgroundColor: "#ccc",
  },
  completedConnector: {
    backgroundColor: "#58cc02",
  },
  connectionLine: {
    backgroundColor: "#58cc02",
  },
  verticalLine: {
    width: PATH_WIDTH,
    height: 30,
  },
  horizontalLine: {
    height: PATH_WIDTH,
    width: 30,
  },
});