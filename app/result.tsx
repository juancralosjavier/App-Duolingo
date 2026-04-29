import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { saveProgress } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getStarsFromAccuracy } from "../constants/learning";
import { useAppTheme } from "../hooks/useAppTheme";
import { useLessonFeedback } from "../hooks/useLessonFeedback";

function Stars({ count }: { count: number }) {
  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Ionicons
          key={`result-star-${index}`}
          name={index < count ? "star" : "star-outline"}
          size={24}
          color="#ffb100"
        />
      ))}
    </View>
  );
}

export default function ResultScreen() {
  const { lessonId, courseId, correct, total, difficulty, heartsRemaining, title, mistakes, reviewed, combo } =
    useLocalSearchParams();
  const router = useRouter();
  const { updateUser } = useAuth();
  const { theme } = useAppTheme();
  const { playCorrect, playWrong } = useLessonFeedback();
  const [saving, setSaving] = React.useState(false);

  const correctNum = Number(correct);
  const totalNum = Number(total);
  const difficultyNum = Number(difficulty || 1);
  const heartsNum = Number(heartsRemaining || 0);
  const accuracy = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0;
  const stars = getStarsFromAccuracy(accuracy);
  const passed = accuracy >= 70 && heartsNum > 0;
  const xpGained = passed ? correctNum * (8 + difficultyNum * 4) : Math.max(0, correctNum * 2);
  const mistakeCount = Number(mistakes || 0);
  const reviewedCount = Number(reviewed || 0);
  const bestCombo = Number(combo || 0);
  const challengePoints = passed ? stars + (accuracy >= 80 ? 1 : 0) : 0;

  React.useEffect(() => {
    if (passed) {
      void playCorrect();
    } else {
      void playWrong();
    }
  }, [passed, playCorrect, playWrong]);

  const handleContinue = async () => {
    setSaving(true);

    try {
      const response = await saveProgress({
        lessonId: Number(lessonId),
        completed: passed,
        score: xpGained,
        accuracy,
        stars,
      });

      if (response?.user) {
        await updateUser(response.user);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
      if (passed) {
        router.replace(courseId ? (`/course/${courseId}` as any) : "/(tabs)");
      } else {
        router.replace(lessonId ? (`/lesson/${lessonId}` as any) : "/(tabs)");
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <View style={styles.content}>
        <View
          style={[
            styles.resultBadge,
            passed
              ? [styles.passed, { backgroundColor: theme.mode === "dark" ? "#173320" : "#d7ffb8" }]
              : [styles.failed, { backgroundColor: theme.mode === "dark" ? "#3a1d22" : "#ffdfe0" }],
          ]}
        >
          <Ionicons
            name={passed ? "trophy-outline" : "refresh-outline"}
            size={58}
            color={passed ? theme.primary : theme.danger}
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {passed ? "¡Nivel superado!" : "Todavía no subes de fase"}
        </Text>

        <Text style={[styles.subtitle, { color: theme.textSoft }]}>
          {passed
            ? `Terminaste ${title || "la lección"} y desbloqueaste más avance en la ruta.`
            : "Necesitas 70% y al menos un corazón para aprobar este reto."}
        </Text>

        <Stars count={stars} />

        <View style={[styles.statsContainer, { backgroundColor: theme.surfaceMuted }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.surface }]}>
              <Ionicons name="analytics-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.primary }]}>{accuracy}%</Text>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>Precisión</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.surface }]}>
              <Ionicons name="checkmark-done-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {correctNum}/{totalNum}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>Aciertos</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconBadge, { backgroundColor: theme.surface }]}>
              <Ionicons name="flash-outline" size={18} color={theme.secondary} />
            </View>
            <Text style={[styles.statValue, styles.xpValue, { color: theme.secondary }]}>+{xpGained}</Text>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>XP</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumen del reto</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="layers-outline" size={16} color={theme.secondary} />
            <Text style={[styles.summaryText, { color: theme.textSoft }]}>Dificultad: nivel {difficultyNum}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="heart-outline" size={16} color={theme.danger} />
            <Text style={[styles.summaryText, { color: theme.textSoft }]}>Corazones restantes: {heartsNum}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="star-outline" size={16} color="#ffb100" />
            <Text style={[styles.summaryText, { color: theme.textSoft }]}>Estrellas obtenidas: {stars}/3</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="flash-outline" size={16} color={theme.warning} />
            <Text style={[styles.summaryText, { color: theme.textSoft }]}>Combo máximo: x{bestCombo || 1}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="repeat-outline" size={16} color={theme.secondary} />
            <Text style={[styles.summaryText, { color: theme.textSoft }]}>
              Errores revisados al final: {reviewedCount}/{mistakeCount}
            </Text>
          </View>
        </View>

        <View style={styles.rewardGrid}>
          <View style={[styles.rewardCard, { borderColor: "#ffcf33", backgroundColor: theme.surface }]}>
            <Text style={[styles.rewardLabel, { color: "#cc9a00" }]}>EXP TOTALES</Text>
            <View style={styles.rewardValueRow}>
              <Ionicons name="flash" size={22} color="#ffcf33" />
              <Text style={[styles.rewardValue, { color: theme.text }]}>+{xpGained}</Text>
            </View>
          </View>
          <View style={[styles.rewardCard, { borderColor: theme.secondary, backgroundColor: theme.surface }]}>
            <Text style={[styles.rewardLabel, { color: theme.secondary }]}>PUNTOS DE DESAFÍO</Text>
            <View style={styles.rewardValueRow}>
              <Ionicons name="diamond" size={20} color={theme.secondary} />
              <Text style={[styles.rewardValue, { color: theme.text }]}>+{challengePoints}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: passed ? theme.primary : theme.secondary }]}
        onPress={handleContinue}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueText}>{passed ? "Seguir con la ruta" : "Intentarlo de nuevo"}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  xpValue: {
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
  summaryCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
  },
  summaryTitle: {
    fontWeight: "800",
    marginBottom: 10,
  },
  summaryText: {
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  continueButton: {
    backgroundColor: "#58cc02",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  rewardGrid: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  rewardCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 3,
    padding: 16,
  },
  rewardLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
  },
  rewardValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rewardValue: {
    fontSize: 26,
    fontWeight: "800",
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
