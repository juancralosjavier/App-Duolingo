import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { saveProgress } from "../services/api";

export default function ResultScreen() {
  const { lessonId, userId, correct, total } = useLocalSearchParams();
  const router = useRouter();

  const correctNum = Number(correct);
  const totalNum = Number(total);
  const percentage = Math.round((correctNum / totalNum) * 100);
  const xpGained = correctNum * 10;
  const passed = percentage >= 70;

  const handleContinue = async () => {
    try {
      await saveProgress({
        userId: Number(userId),
        lessonId: Number(lessonId),
        completed: passed,
        score: xpGained,
      });
    } catch (error) {
      console.log(error);
    }

    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.resultBadge, passed ? styles.passed : styles.failed]}>
          <Text style={styles.emoji}>{passed ? "🎉" : "💪"}</Text>
        </View>

        <Text style={styles.title}>
          {passed ? "¡Reto completado!" : "¡Vas bien, inténtalo otra vez!"}
        </Text>

        <Text style={styles.subtitle}>
          {passed
            ? "Sumaste XP y seguiste avanzando en tu ruta matemática."
            : "Necesitas 70% para aprobar este reto."}
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{percentage}%</Text>
            <Text style={styles.statLabel}>Precisión</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{correctNum}/{totalNum}</Text>
            <Text style={styles.statLabel}>Aciertos</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.xpValue]}>+{xpGained}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>Continuar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  resultBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  passed: {
    backgroundColor: "#d7ffb8",
  },
  failed: {
    backgroundColor: "#ffdfe0",
  },
  emoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#58cc02",
  },
  xpValue: {
    color: "#2493ee",
  },
  statLabel: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#ddd",
  },
  continueButton: {
    backgroundColor: "#58cc02",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
