import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Easing, ScrollView } from "react-native";
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

type ConfettiParticle = {
  left: `${number}%`;
  x: number;
  y: number;
  color: string;
  rotate: string;
};

const CONFETTI_PARTICLES: ConfettiParticle[] = [
  { left: "12%", x: -24, y: -72, color: "#58cc02", rotate: "55deg" },
  { left: "20%", x: 34, y: -92, color: "#1cb0f6", rotate: "-40deg" },
  { left: "31%", x: -46, y: -56, color: "#ffcf33", rotate: "80deg" },
  { left: "43%", x: 28, y: -82, color: "#ff6b6b", rotate: "-70deg" },
  { left: "55%", x: -18, y: -106, color: "#a560f0", rotate: "120deg" },
  { left: "67%", x: 44, y: -72, color: "#58cc02", rotate: "-30deg" },
  { left: "78%", x: -30, y: -88, color: "#1cb0f6", rotate: "65deg" },
  { left: "88%", x: 24, y: -58, color: "#ffcf33", rotate: "-90deg" },
];

function ConfettiBurst({ active, progress }: { active: boolean; progress: Animated.Value }) {
  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {CONFETTI_PARTICLES.map((particle, index) => (
        <Animated.View
          key={`confetti-${index}`}
          style={[
            styles.confettiParticle,
            {
              left: particle.left,
              backgroundColor: particle.color,
              opacity: progress.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 1, 0.2] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.x] }) },
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.y] }) },
                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", particle.rotate] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.5, 1.1, 0.9] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function ResultScreen() {
  const { lessonId, courseId, correct, total, difficulty, heartsRemaining, title, mistakes, reviewed, combo, returnTo, playMode } =
    useLocalSearchParams();
  const router = useRouter();
  const { updateUser } = useAuth();
  const { theme } = useAppTheme();
  const { playCorrect, playWrong } = useLessonFeedback();
  const [saving, setSaving] = React.useState(false);
  const [displayXp, setDisplayXp] = React.useState(0);
  const celebration = React.useRef(new Animated.Value(0)).current;

  const correctNum = Number(correct);
  const totalNum = Number(total);
  const difficultyNum = Number(difficulty || 1);
  const heartsNum = Number(heartsRemaining || 0);
  const accuracy = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0;
  const stars = getStarsFromAccuracy(accuracy);
  const normalizedPlayMode = playMode === "speed" || playMode === "boss" ? playMode : "classic";
  const isSpeedMode = normalizedPlayMode === "speed";
  const isBossMode = normalizedPlayMode === "boss";
  const passThreshold = isBossMode ? 80 : 70;
  const passed = accuracy >= passThreshold && heartsNum > 0;
  const modeBonus = passed ? (isBossMode ? 40 : isSpeedMode ? 15 : 0) : 0;
  const xpGained = passed ? correctNum * (8 + difficultyNum * 4) + modeBonus : Math.max(0, correctNum * 2);
  const mistakeCount = Number(mistakes || 0);
  const reviewedCount = Number(reviewed || 0);
  const bestCombo = Number(combo || 0);
  const challengePoints = passed ? stars + (accuracy >= 80 ? 1 : 0) + (isBossMode ? 2 : isSpeedMode ? 1 : 0) : 0;
  const chestLabel = isBossMode ? "Cofre jefe abierto" : isSpeedMode ? "Cofre rápido" : "Cofre de práctica";

  React.useEffect(() => {
    if (passed) {
      void playCorrect();
    } else {
      void playWrong();
    }
  }, [passed, playCorrect, playWrong]);

  React.useEffect(() => {
    celebration.setValue(0);
    setDisplayXp(0);

    if (passed) {
      Animated.timing(celebration, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    const target = xpGained;
    const steps = Math.max(1, Math.min(20, Math.ceil(target / 8)));
    const timer = setInterval(() => {
      setDisplayXp((current) => {
        if (current >= target) {
          clearInterval(timer);
          return target;
        }

        return Math.min(target, current + Math.ceil(target / steps));
      });
    }, 28);

    return () => clearInterval(timer);
  }, [celebration, passed, xpGained]);

  const closeToOrigin = React.useCallback(() => {
    const destination = typeof returnTo === "string" && returnTo.length > 0 ? returnTo : courseId ? `/course/${courseId}` : "/(tabs)";
    const dismissTo = (router as any).dismissTo;
    const navigate = (router as any).navigate;

    if (typeof dismissTo === "function") {
      dismissTo(destination);
      return;
    }

    if (typeof navigate === "function") {
      navigate(destination);
      return;
    }

    router.replace(destination as any);
  }, [courseId, returnTo, router]);

  const handleContinue = async () => {
    setSaving(true);

    try {
      const response = await saveProgress({
        lessonId: Number(lessonId),
        completed: passed,
        score: xpGained,
        accuracy,
        stars,
        heartsRemaining: heartsNum,
      });

      if (response?.user) {
        await updateUser(response.user);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
      if (passed) {
        closeToOrigin();
      } else {
        router.replace({
          pathname: lessonId ? (`/lesson/${lessonId}` as any) : "/(tabs)",
          params: {
            ...(typeof returnTo === "string" && returnTo.length > 0 ? { returnTo } : {}),
            playMode: normalizedPlayMode,
          },
        });
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ConfettiBurst active={passed} progress={celebration} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            : `Necesitas ${passThreshold}% y al menos un corazón para aprobar este reto.`}
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
            <Text style={[styles.statValue, styles.xpValue, { color: theme.secondary }]}>+{displayXp}</Text>
            <Text style={[styles.statLabel, { color: theme.textSoft }]}>XP</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumen del reto</Text>
          <View style={styles.summaryRow}>
            <Ionicons name={isBossMode ? "flame-outline" : isSpeedMode ? "timer-outline" : "game-controller-outline"} size={16} color={theme.primary} />
            <Text style={[styles.summaryText, { color: theme.textSoft }]}>
              Modo: {isBossMode ? "batalla jefe" : isSpeedMode ? "rápido con temporizador" : "clásico"}
            </Text>
          </View>
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

        {passed ? (
          <View style={[styles.chestCard, { backgroundColor: theme.mode === "dark" ? "#21311d" : "#f1ffd9", borderColor: theme.primary }]}>
            <View style={[styles.chestIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="gift-outline" size={24} color="#fff" />
            </View>
            <View style={styles.chestCopy}>
              <Text style={[styles.chestTitle, { color: theme.text }]}>{chestLabel}</Text>
              <Text style={[styles.chestText, { color: theme.textSoft }]}>
                +{modeBonus || 8} XP de bonificación y +{challengePoints} punto{challengePoints === 1 ? "" : "s"} de desafío.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.rewardGrid}>
          <View style={[styles.rewardCard, { borderColor: "#ffcf33", backgroundColor: theme.surface }]}>
            <Text style={[styles.rewardLabel, { color: "#cc9a00" }]}>EXP TOTALES</Text>
            <View style={styles.rewardValueRow}>
              <Ionicons name="flash" size={22} color="#ffcf33" />
              <Text style={[styles.rewardValue, { color: theme.text }]}>+{displayXp}</Text>
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
      </ScrollView>

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
  confettiLayer: {
    position: "absolute",
    top: 140,
    left: 0,
    right: 0,
    height: 160,
    zIndex: 2,
  },
  confettiParticle: {
    position: "absolute",
    top: 90,
    width: 10,
    height: 18,
    borderRadius: 5,
  },
  content: {
    flexGrow: 1,
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
  chestCard: {
    width: "100%",
    borderWidth: 2,
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  chestIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chestCopy: {
    flex: 1,
  },
  chestTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  chestText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
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
