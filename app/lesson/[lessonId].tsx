import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getLessonDetail } from "../../services/api";
import { getChallengeTypeLabel, getDifficultyLabel } from "../../constants/learning";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLessonFeedback } from "../../hooks/useLessonFeedback";

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

interface Question {
  id: number;
  text: string;
  type: string;
  explanation?: string;
  difficulty: number;
  options: Option[];
}

interface Lesson {
  id: number;
  title: string;
  summary: string;
  difficulty: number;
  challengeType: string;
  icon: string;
  unit: {
    course: {
      id: number;
      title: string;
    };
  };
  questions: Question[];
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { playCorrect, playWrong } = useLessonFeedback();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [sequenceSelection, setSequenceSelection] = useState<Option[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [heartsRemaining, setHeartsRemaining] = useState(3);
  const [validationMessage, setValidationMessage] = useState("");

  const loadLesson = useCallback(async () => {
    try {
      const data = await getLessonDetail(Number(lessonId));
      setLesson(data);
    } catch (error) {
      console.log(error);
    }
  }, [lessonId]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const question = lesson?.questions[currentQuestion];
  const progress = lesson ? ((currentQuestion + 1) / lesson.questions.length) * 100 : 0;
  const isInputQuestion = question?.type === "numeric_input";
  const isSequenceQuestion = question?.type === "sequence_choice";
  const orderedSequence = useMemo(
    () =>
      question?.options
        .filter((item) => item.isCorrect)
        .sort((left, right) => left.sortOrder - right.sortOrder) || [],
    [question]
  );

  const normalizeInput = (value: string) =>
    value.trim().toLowerCase().replace(",", ".").replace(/\s+/g, "");

  const finishLesson = (finalCorrect: number, finalHearts: number) => {
    if (!lesson) return;

    router.replace({
      pathname: "/result",
      params: {
        lessonId: String(lesson.id),
        courseId: String(lesson.unit.course.id),
        title: lesson.title,
        difficulty: String(lesson.difficulty),
        correct: String(finalCorrect),
        total: String(lesson.questions.length),
        heartsRemaining: String(finalHearts),
      },
    });
  };

  const moveForward = (correct: boolean, nextHearts: number) => {
    const finalCorrect = correctCount + (correct ? 1 : 0);

    setTimeout(() => {
      if (nextHearts <= 0) {
        finishLesson(finalCorrect, nextHearts);
        return;
      }

      if (!lesson) return;

      if (currentQuestion < lesson.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedOption(null);
        setAnswerInput("");
        setSequenceSelection([]);
        setSubmitted(false);
        setIsCorrect(null);
        setValidationMessage("");
      } else {
        finishLesson(finalCorrect, nextHearts);
      }
    }, 1200);
  };

  const submitAnswer = () => {
    if (!question || submitted) return;

    let correct = false;

    if (question.type === "numeric_input") {
      const expected = question.options.find((item) => item.isCorrect)?.text || "";
      if (!answerInput.trim()) {
        setValidationMessage("Escribe una respuesta antes de comprobar.");
        return;
      }
      correct = normalizeInput(answerInput) === normalizeInput(expected);
    } else if (question.type === "sequence_choice") {
      if (sequenceSelection.length !== orderedSequence.length) {
        setValidationMessage("Completa toda la secuencia para verificar.");
        return;
      }
      correct = sequenceSelection.every((item, index) => item.id === orderedSequence[index]?.id);
    } else {
      if (selectedOption === null) {
        setValidationMessage("Selecciona una opción antes de continuar.");
        return;
      }
      correct = question.options.find((item) => item.id === selectedOption)?.isCorrect || false;
    }

    const nextHearts = correct ? heartsRemaining : Math.max(0, heartsRemaining - 1);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
      void playCorrect();
    } else {
      void playWrong();
    }

    setSubmitted(true);
    setIsCorrect(correct);
    setValidationMessage("");
    setHeartsRemaining(nextHearts);
    moveForward(correct, nextHearts);
  };

  const toggleSequenceStep = (option: Option) => {
    if (submitted) return;

    const alreadySelected = sequenceSelection.some((item) => item.id === option.id);
    if (alreadySelected) {
      setSequenceSelection((current) => current.filter((item) => item.id !== option.id));
      return;
    }

    setSequenceSelection((current) => [...current, option]);
  };

  if (!lesson || !question) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.exitButton, { backgroundColor: theme.surfaceMuted }]}
            onPress={() => router.replace(`/course/${lesson.unit.course.id}` as any)}
          >
            <Ionicons name="chevron-back" size={18} color={theme.text} />
            <Text style={[styles.exitButtonText, { color: theme.text }]}>Salir</Text>
          </TouchableOpacity>
          <Text style={[styles.courseCaption, { color: theme.textSoft }]}>{lesson.unit.course.title}</Text>
        </View>

        <View style={styles.topRow}>
          <Text style={[styles.lessonTitle, { color: theme.text }]}>{lesson.title}</Text>
          <View style={[styles.heartsPill, { backgroundColor: theme.mode === "dark" ? "#3b1f2a" : "#fff1f5" }]}>
            <Ionicons name="heart" size={14} color={theme.danger} />
            <Text style={styles.heartsText}>{heartsRemaining}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaPill, { backgroundColor: theme.surfaceMuted, color: theme.textSoft }]}>
            {getDifficultyLabel(lesson.difficulty)}
          </Text>
          <Text style={[styles.metaPill, { backgroundColor: theme.surfaceMuted, color: theme.textSoft }]}>
            {getChallengeTypeLabel(question.type)}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
        </View>
        <Text style={[styles.counter, { color: theme.textSoft }]}>
          {currentQuestion + 1}/{lesson.questions.length}
        </Text>
      </View>

      <View style={[styles.questionContainer, { backgroundColor: theme.surfaceAccent }]}>
        <Text style={[styles.questionText, { color: theme.text }]}>{question.text}</Text>
      </View>

      {isInputQuestion ? (
        <View style={styles.inputSection}>
          <TextInput
            style={[
              styles.answerInput,
              {
                backgroundColor: theme.surfaceMuted,
                color: theme.text,
              },
              submitted &&
                (isCorrect
                  ? [styles.correctInput, { borderColor: theme.primary }]
                  : [styles.incorrectInput, { borderColor: theme.danger }]),
            ]}
            placeholder="Escribe tu resultado"
            placeholderTextColor={theme.textSoft}
            value={answerInput}
            onChangeText={setAnswerInput}
            keyboardType="numeric"
            editable={!submitted}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              (!answerInput.trim() || submitted) && [styles.disabledButton, { backgroundColor: theme.border }],
            ]}
            onPress={submitAnswer}
            disabled={!answerInput.trim() || submitted}
          >
            <Text style={styles.submitText}>Comprobar</Text>
          </TouchableOpacity>
        </View>
      ) : isSequenceQuestion ? (
        <View style={styles.optionsContainer}>
          <View style={styles.sequencePreview}>
            <Text style={[styles.sequenceLabel, { color: theme.textSoft }]}>Tu orden:</Text>
            <Text style={[styles.sequenceValue, { color: theme.text }]}>
              {sequenceSelection.length
                ? sequenceSelection.map((item) => item.text).join(" → ")
                : "Toca las tarjetas en el orden correcto"}
            </Text>
          </View>

          {question.options.map((option) => {
            const selectedIndex = sequenceSelection.findIndex((item) => item.id === option.id);

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.surfaceMuted,
                  },
                  selectedIndex >= 0 && [styles.selectedOption, { borderColor: theme.secondary, backgroundColor: theme.mode === "dark" ? "#173447" : "#eef7ff" }],
                  submitted &&
                    (isCorrect
                      ? [styles.correctOption, { borderColor: theme.primary }]
                      : [styles.incorrectOption, { borderColor: theme.danger }]),
                ]}
                onPress={() => toggleSequenceStep(option)}
                disabled={submitted}
              >
                <View style={styles.sequenceRow}>
                  <View style={[styles.sequenceNumber, { backgroundColor: theme.surface }]}>
                    <Text style={styles.sequenceNumberText}>
                      {selectedIndex >= 0 ? selectedIndex + 1 : "+"}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: theme.text }]}>{option.text}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.surfaceMuted },
              submitted && [styles.disabledButton, { backgroundColor: theme.border }],
            ]}
            onPress={() => setSequenceSelection([])}
            disabled={submitted || sequenceSelection.length === 0}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textSoft }]}>Reiniciar orden</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              (sequenceSelection.length !== orderedSequence.length || submitted) && [
                styles.disabledButton,
                { backgroundColor: theme.border },
              ],
            ]}
            onPress={submitAnswer}
            disabled={sequenceSelection.length !== orderedSequence.length || submitted}
          >
            <Text style={styles.submitText}>Verificar secuencia</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: theme.surfaceMuted,
                },
                selectedOption === option.id && [
                  styles.selectedOption,
                  { borderColor: theme.secondary, backgroundColor: theme.mode === "dark" ? "#173447" : "#eef7ff" },
                ],
                submitted &&
                  (option.isCorrect
                    ? [styles.correctOption, { borderColor: theme.primary }]
                    : selectedOption === option.id
                    ? [styles.incorrectOption, { borderColor: theme.danger }]
                    : styles.disabledOption),
              ]}
              onPress={() => !submitted && setSelectedOption(option.id)}
              disabled={submitted}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.text },
                  selectedOption === option.id && [styles.selectedOptionText, { color: theme.secondary }],
                  submitted &&
                    (option.isCorrect
                      ? [styles.correctOptionText, { color: theme.primary }]
                      : selectedOption === option.id
                      ? [styles.incorrectOptionText, { color: theme.danger }]
                      : [styles.disabledOptionText, { color: theme.textSoft }]),
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              (selectedOption === null || submitted) && [styles.disabledButton, { backgroundColor: theme.border }],
            ]}
            onPress={submitAnswer}
            disabled={selectedOption === null || submitted}
          >
            <Text style={styles.submitText}>Comprobar</Text>
          </TouchableOpacity>
        </View>
      )}

      {validationMessage ? (
        <Text style={[styles.validationText, { color: theme.danger }]}>{validationMessage}</Text>
      ) : null}

      {submitted ? (
        <View
          style={[
            styles.feedbackCard,
            isCorrect
              ? [styles.feedbackCorrect, { backgroundColor: theme.mode === "dark" ? "#173320" : "#effbe6" }]
              : [styles.feedbackWrong, { backgroundColor: theme.mode === "dark" ? "#3a1d22" : "#fff1f2" }],
          ]}
        >
          <Text style={[styles.feedbackTitle, { color: theme.text }]}>
            {isCorrect ? "¡Correcto!" : "Respuesta incorrecta"}
          </Text>
          <Text style={[styles.feedbackText, { color: theme.textSoft }]}>
            {question.explanation || "La explicación de este reto aparecerá aquí."}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  exitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  exitButtonText: {
    fontWeight: "700",
  },
  courseCaption: {
    fontSize: 12,
    fontWeight: "700",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  lessonTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#173d32",
  },
  heartsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff1f5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heartsText: {
    fontWeight: "800",
    color: "#ef4f7f",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
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
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  counter: {
    textAlign: "center",
    marginTop: 8,
    color: "#777",
    fontSize: 14,
  },
  questionContainer: {
    backgroundColor: "#eef8e4",
    padding: 30,
    borderRadius: 20,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#173d32",
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#e5e5e5",
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedOption: {
    borderColor: "#2493ee",
    backgroundColor: "#eef7ff",
  },
  correctOption: {
    backgroundColor: "#d7ffb8",
    borderColor: "#58cc02",
  },
  incorrectOption: {
    backgroundColor: "#ffdfe0",
    borderColor: "#ff4b4b",
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#173d32",
  },
  selectedOptionText: {
    color: "#2493ee",
  },
  correctOptionText: {
    color: "#2d7f12",
  },
  incorrectOptionText: {
    color: "#c63d46",
  },
  disabledOptionText: {
    color: "#777",
  },
  submitButton: {
    backgroundColor: "#58cc02",
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#f1f6f8",
    padding: 16,
    borderRadius: 16,
  },
  secondaryButtonText: {
    color: "#50636d",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#d9e0e3",
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputSection: {
    gap: 16,
  },
  answerInput: {
    padding: 18,
    borderRadius: 16,
    fontSize: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  correctInput: {
    backgroundColor: "#d7ffb8",
    borderColor: "#58cc02",
  },
  incorrectInput: {
    backgroundColor: "#ffdfe0",
    borderColor: "#ff4b4b",
  },
  validationText: {
    color: "#c63d46",
    textAlign: "center",
    marginTop: 12,
    fontWeight: "600",
  },
  feedbackCard: {
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
  },
  feedbackCorrect: {
    backgroundColor: "#effbe6",
  },
  feedbackWrong: {
    backgroundColor: "#fff1f2",
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    color: "#173d32",
  },
  feedbackText: {
    color: "#61717b",
    lineHeight: 20,
  },
  sequencePreview: {
    borderRadius: 16,
    padding: 14,
  },
  sequenceLabel: {
    fontSize: 12,
    color: "#6f7e85",
    marginBottom: 4,
  },
  sequenceValue: {
    color: "#173d32",
    fontWeight: "600",
  },
  sequenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sequenceNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceNumberText: {
    fontWeight: "800",
    color: "#173d32",
  },
});
