import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getLessonDetail } from "../../services/api";
import { getChallengeTypeLabel, getDifficultyLabel } from "../../constants/learning";
import { useAppTheme } from "../../hooks/useAppTheme";
import { useLessonFeedback } from "../../hooks/useLessonFeedback";
import { useAuth } from "../../hooks/useAuth";

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

interface PromptData {
  rows?: string[][];
  missingRow?: number;
  missingCol?: number;
  equationTokens?: string[];
  placeholder?: string;
  target?: string;
  tokens?: string[];
  solution?: string[];
}

interface Question {
  id: number;
  text: string;
  type: string;
  explanation?: string;
  promptData?: PromptData | null;
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

type LessonPhase = "main" | "review_intro" | "review";

const SUCCESS_TITLES = ["¡Así se hace!", "¡Buen trabajo!", "¡Muy bien!"];
const ERROR_TITLES = ["Eso estuvo difícil", "Vamos otra vez", "Casi lo logras"];
const KEYPAD_VALUES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

function normalizeInput(value: string) {
  return value.trim().toLowerCase().replace(",", ".").replace(/\s+/g, "");
}

function buildCorrectAnswerText(
  question: Question,
  promptData: PromptData,
  orderedSequence: Option[],
  builderSolution: string[]
) {
  switch (question.type) {
    case "numeric_input":
    case "numeric_keypad":
      return question.options.find((item) => item.isCorrect)?.text || "";
    case "sequence_choice":
      return orderedSequence.map((item) => item.text).join(" → ");
    case "equation_builder":
      return builderSolution.join(" ");
    default:
      return question.options.find((item) => item.isCorrect)?.text || "";
  }
}

function pickFeedbackTitle(correct: boolean, phase: LessonPhase, seed: number) {
  if (correct) {
    if (phase === "review") return "¡Recuperado!";
    return SUCCESS_TITLES[seed % SUCCESS_TITLES.length];
  }

  if (phase === "review") return "Todavía estaba pendiente";
  return ERROR_TITLES[seed % ERROR_TITLES.length];
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user } = useAuth();
  const { playCorrect, playWrong } = useLessonFeedback();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<LessonPhase>("main");
  const [reviewQueue, setReviewQueue] = useState<Question[]>([]);
  const [mistakeIds, setMistakeIds] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [sequenceSelection, setSequenceSelection] = useState<Option[]>([]);
  const [builderSelection, setBuilderSelection] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [heartsRemaining, setHeartsRemaining] = useState(user?.hearts ?? 5);
  const [validationMessage, setValidationMessage] = useState("");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackAction, setFeedbackAction] = useState("Continuar");
  const [feedbackCorrectAnswer, setFeedbackCorrectAnswer] = useState("");
  const [comboCount, setComboCount] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getLessonDetail(Number(lessonId));
      setLesson(data);
      setHeartsRemaining(user?.hearts ?? 5);
      setPhase("main");
      setCurrentQuestionIndex(0);
      setMistakeIds([]);
      setReviewQueue([]);
      setCorrectCount(0);
      setComboCount(0);
      setBestCombo(0);
      setSelectedOption(null);
      setAnswerInput("");
      setSequenceSelection([]);
      setBuilderSelection([]);
      setSubmitted(false);
      setIsCorrect(null);
      setValidationMessage("");
      setFeedbackTitle("");
      setFeedbackCorrectAnswer("");
    } catch (loadError: any) {
      setError(loadError.message || "No se pudo cargar la lección");
    } finally {
      setLoading(false);
    }
  }, [lessonId, user?.hearts]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const activeQuestions = useMemo(() => {
    if (!lesson) return [];
    return phase === "review" ? reviewQueue : lesson.questions;
  }, [lesson, phase, reviewQueue]);

  const question = activeQuestions[currentQuestionIndex];
  const promptData = question?.promptData || {};
  const isReviewQuestion = phase === "review";

  const orderedSequence = useMemo(
    () =>
      question?.options
        .filter((item) => item.isCorrect)
        .sort((left, right) => left.sortOrder - right.sortOrder) || [],
    [question]
  );

  const builderTokens = useMemo(
    () => promptData.tokens || question?.options.map((item) => item.text) || [],
    [promptData.tokens, question]
  );

  const builderSolution = useMemo(
    () =>
      promptData.solution ||
      question?.options
        .filter((item) => item.isCorrect)
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((item) => item.text) ||
      [],
    [promptData.solution, question]
  );

  const builderSelectedTokens = builderSelection.map((index) => builderTokens[index]).filter(Boolean);
  const lessonQuestionCount = lesson?.questions.length || 0;
  const reviewCountForProgress = reviewQueue.length || mistakeIds.length;
  const totalSteps = lessonQuestionCount + reviewCountForProgress;
  const answeredSteps =
    phase === "review"
      ? lessonQuestionCount + currentQuestionIndex
      : phase === "review_intro"
      ? lessonQuestionCount
      : currentQuestionIndex;
  const progress = totalSteps > 0 ? Math.max(8, ((answeredSteps + 1) / totalSteps) * 100) : 0;
  const phaseProgressColor = phase === "review" || phase === "review_intro" ? theme.warning : theme.primary;

  const resetAnswerState = useCallback(() => {
    setSelectedOption(null);
    setAnswerInput("");
    setSequenceSelection([]);
    setBuilderSelection([]);
    setSubmitted(false);
    setIsCorrect(null);
    setValidationMessage("");
    setFeedbackTitle("");
    setFeedbackCorrectAnswer("");
    setFeedbackAction("Continuar");
  }, []);

  const finishLesson = useCallback(
    (finalCorrect: number, finalHearts: number) => {
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
          mistakes: String(mistakeIds.length),
          reviewed: String(reviewQueue.length),
          combo: String(bestCombo),
        },
      });
    },
    [bestCombo, lesson, mistakeIds.length, reviewQueue.length, router]
  );

  const startReviewPhase = useCallback(() => {
    if (!lesson) return;

    const nextReviewQueue = lesson.questions.filter((item) => mistakeIds.includes(item.id));

    if (!nextReviewQueue.length) {
      finishLesson(correctCount, heartsRemaining);
      return;
    }

    setReviewQueue(nextReviewQueue);
    setPhase("review");
    setCurrentQuestionIndex(0);
    resetAnswerState();
  }, [correctCount, finishLesson, heartsRemaining, lesson, mistakeIds, resetAnswerState]);

  const moveForward = useCallback(() => {
    if (!lesson || !question) return;

    if (heartsRemaining <= 0) {
      finishLesson(correctCount, heartsRemaining);
      return;
    }

    if (phase === "main") {
      const isLastMainQuestion = currentQuestionIndex >= lessonQuestionCount - 1;

      if (isLastMainQuestion) {
        if (mistakeIds.length > 0) {
          setReviewQueue(lesson.questions.filter((item) => mistakeIds.includes(item.id)));
          setPhase("review_intro");
          resetAnswerState();
          return;
        }

        finishLesson(correctCount, heartsRemaining);
        return;
      }

      setCurrentQuestionIndex((previous) => previous + 1);
      resetAnswerState();
      return;
    }

    if (phase === "review") {
      const isLastReviewQuestion = currentQuestionIndex >= reviewQueue.length - 1;

      if (isLastReviewQuestion) {
        finishLesson(correctCount, heartsRemaining);
        return;
      }

      setCurrentQuestionIndex((previous) => previous + 1);
      resetAnswerState();
    }
  }, [
    correctCount,
    currentQuestionIndex,
    finishLesson,
    heartsRemaining,
    lesson,
    lessonQuestionCount,
    mistakeIds,
    phase,
    question,
    resetAnswerState,
    reviewQueue.length,
  ]);

  const submitAnswer = async () => {
    if (!question || submitted) return;

    let correct = false;

    if (question.type === "numeric_input" || question.type === "numeric_keypad") {
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
    } else if (question.type === "equation_builder") {
      if (builderSelectedTokens.length !== builderSolution.length) {
        setValidationMessage("Completa todos los espacios de la ecuación.");
        return;
      }
      correct = builderSelectedTokens.every((token, index) => token === builderSolution[index]);
    } else {
      if (selectedOption === null) {
        setValidationMessage("Selecciona una opción antes de continuar.");
        return;
      }
      correct = question.options.find((item) => item.id === selectedOption)?.isCorrect || false;
    }

    const nextHearts = correct
      ? heartsRemaining
      : phase === "review"
      ? heartsRemaining
      : Math.max(0, heartsRemaining - 1);
    const nextCorrectCount = correctCount + (correct ? 1 : 0);

    if (correct) {
      const nextCombo = comboCount + 1;
      setCorrectCount(nextCorrectCount);
      setComboCount(nextCombo);
      setBestCombo((previous) => Math.max(previous, nextCombo));
      await playCorrect();
    } else {
      setComboCount(0);
      if (phase === "main" && !mistakeIds.includes(question.id)) {
        setMistakeIds((current) => [...current, question.id]);
      }
      await playWrong();
    }

    setSubmitted(true);
    setIsCorrect(correct);
    setHeartsRemaining(nextHearts);
    setValidationMessage("");
    setFeedbackTitle(pickFeedbackTitle(correct, phase, currentQuestionIndex + correctCount));
    setFeedbackCorrectAnswer(correct ? "" : buildCorrectAnswerText(question, promptData, orderedSequence, builderSolution));

    const isLastVisibleQuestion =
      phase === "main"
        ? currentQuestionIndex >= lessonQuestionCount - 1
        : currentQuestionIndex >= reviewQueue.length - 1;

    if (phase === "review" && isLastVisibleQuestion) {
      setFeedbackAction("Cerrar repaso");
    } else if (phase === "main" && isLastVisibleQuestion && !correct) {
      setFeedbackAction("Ir al repaso");
    } else {
      setFeedbackAction("Continuar");
    }
  };

  const handleClose = () => {
    if (!lesson) return;
    router.replace(`/course/${lesson.unit.course.id}` as any);
  };

  const handleBuilderTokenPress = (index: number) => {
    if (submitted || builderSelection.includes(index) || builderSelectedTokens.length >= builderSolution.length) {
      return;
    }

    setBuilderSelection((current) => [...current, index]);
  };

  const handleBuilderBackspace = () => {
    if (submitted) return;
    setBuilderSelection((current) => current.slice(0, -1));
  };

  const handleKeypadPress = (value: string) => {
    if (submitted) return;
    setAnswerInput((current) => `${current}${value}`);
  };

  const handleKeypadDelete = () => {
    if (submitted) return;
    setAnswerInput((current) => current.slice(0, -1));
  };

  const handleSequenceToggle = (option: Option) => {
    if (submitted) return;

    const alreadySelected = sequenceSelection.some((item) => item.id === option.id);

    if (alreadySelected) {
      setSequenceSelection((current) => current.filter((item) => item.id !== option.id));
      return;
    }

    setSequenceSelection((current) => [...current, option]);
  };

  const canSubmit = useMemo(() => {
    if (!question || submitted) return false;

    switch (question.type) {
      case "numeric_input":
      case "numeric_keypad":
        return answerInput.trim().length > 0;
      case "sequence_choice":
        return sequenceSelection.length === orderedSequence.length;
      case "equation_builder":
        return builderSelectedTokens.length === builderSolution.length;
      default:
        return selectedOption !== null;
    }
  }, [
    answerInput,
    builderSelectedTokens.length,
    builderSolution.length,
    orderedSequence.length,
    question,
    selectedOption,
    sequenceSelection.length,
    submitted,
  ]);

  const renderChoiceOptions = (accentColor: string) => (
    <View style={styles.optionsContainer}>
      {question?.options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.optionButton,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
            selectedOption === option.id && [
              styles.optionSelected,
              {
                borderColor: accentColor,
                backgroundColor: theme.mode === "dark" ? "#20303a" : "#eef7ff",
              },
            ],
            submitted &&
              option.isCorrect && [
                styles.optionCorrect,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.mode === "dark" ? "#183222" : "#e9f9dc",
                },
              ],
            submitted &&
              selectedOption === option.id &&
              !option.isCorrect && [
                styles.optionWrong,
                {
                  borderColor: theme.danger,
                  backgroundColor: theme.mode === "dark" ? "#341e23" : "#fff0f1",
                },
              ],
          ]}
          onPress={() => setSelectedOption(option.id)}
          disabled={submitted}
        >
          <Text
            style={[
              styles.optionText,
              { color: theme.text },
              selectedOption === option.id && { color: accentColor },
              submitted && option.isCorrect && { color: theme.primary },
              submitted && selectedOption === option.id && !option.isCorrect && { color: theme.danger },
            ]}
          >
            {option.text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPatternGrid = () => (
    <View style={styles.promptSection}>
      <View style={[styles.patternGrid, { borderColor: theme.border }]}>
        {(promptData.rows || []).map((row, rowIndex) => (
          <View key={`pattern-row-${rowIndex}`} style={[styles.patternRow, { borderBottomColor: theme.border }]}>
            {row.map((cell, columnIndex) => {
              const isMissing = rowIndex === promptData.missingRow && columnIndex === promptData.missingCol;
              return (
                <View
                  key={`pattern-cell-${rowIndex}-${columnIndex}`}
                  style={[
                    styles.patternCell,
                    {
                      borderRightColor: theme.border,
                      backgroundColor: isMissing
                        ? theme.mode === "dark"
                          ? "#243642"
                          : "#e7f4ff"
                        : theme.surfaceMuted,
                    },
                    columnIndex === row.length - 1 && styles.patternCellLast,
                  ]}
                >
                  <Text style={[styles.patternCellText, { color: isMissing ? theme.secondary : theme.text }]}>
                    {cell}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      {renderChoiceOptions(theme.primary)}
    </View>
  );

  const renderEquationPrompt = () => (
    <View style={styles.promptSection}>
      <View style={styles.equationLine}>
        {(promptData.equationTokens || []).map((token, index) => (
          <React.Fragment key={`equation-token-${index}`}>
            {token === "?" ? (
              <View style={[styles.blankToken, { borderColor: theme.secondary, backgroundColor: theme.surfaceMuted }]} />
            ) : (
              <Text style={[styles.equationTokenText, { color: token === "×" || token === "=" ? theme.secondary : theme.text }]}>
                {token}
              </Text>
            )}
          </React.Fragment>
        ))}
      </View>
      {renderChoiceOptions(theme.secondary)}
    </View>
  );

  const renderNumericPrompt = (showKeypad: boolean) => (
    <View style={styles.promptSection}>
      {promptData.equationTokens?.length ? (
        <View style={styles.equationLine}>
          {promptData.equationTokens.map((token, index) => (
            <React.Fragment key={`numeric-token-${index}`}>
              {token === "?" ? (
                <View
                  style={[
                    styles.answerDisplayBox,
                    {
                      borderColor: theme.secondary,
                      backgroundColor: theme.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={[styles.answerDisplayText, { color: theme.text }]}>
                    {answerInput || ""}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.equationTokenText, { color: token === "×" || token === "=" || token === "+" || token === "-" ? theme.secondary : theme.text }]}>
                  {token}
                </Text>
              )}
            </React.Fragment>
          ))}
        </View>
      ) : null}

      {showKeypad ? (
        <View style={styles.keypadSection}>
          {!promptData.equationTokens?.length ? (
            <View
              style={[
                styles.keypadInputBox,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.keypadInputValue, { color: theme.text }]}>
                {answerInput || promptData.placeholder || "0"}
              </Text>
            </View>
          ) : null}

          <View style={styles.keypadGrid}>
            {KEYPAD_VALUES.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.keypadButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                onPress={() => handleKeypadPress(value)}
              >
                <Text style={[styles.keypadButtonText, { color: theme.text }]}>{value}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.keypadSpacer} />
            <TouchableOpacity
              style={[styles.keypadButton, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
              onPress={handleKeypadDelete}
            >
              <Ionicons name="backspace-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TextInput
          style={[
            styles.answerInput,
            {
              backgroundColor: theme.surfaceMuted,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder={promptData.placeholder || "Escribe tu resultado"}
          placeholderTextColor={theme.textSoft}
          value={answerInput}
          onChangeText={setAnswerInput}
          keyboardType="numeric"
          editable={!submitted}
        />
      )}
    </View>
  );

  const renderSequencePrompt = () => (
    <View style={styles.promptSection}>
      <View style={[styles.sequencePreview, { backgroundColor: theme.surfaceMuted }]}>
        <Text style={[styles.sequenceLabel, { color: theme.textSoft }]}>Tu orden</Text>
        <Text style={[styles.sequenceValue, { color: theme.text }]}>
          {sequenceSelection.length
            ? sequenceSelection.map((item) => item.text).join(" → ")
            : "Toca las tarjetas en el orden correcto"}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {question?.options.map((option) => {
          const selectedIndex = sequenceSelection.findIndex((item) => item.id === option.id);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
                selectedIndex >= 0 && [
                  styles.optionSelected,
                  {
                    borderColor: theme.secondary,
                    backgroundColor: theme.mode === "dark" ? "#20303a" : "#eef7ff",
                  },
                ],
              ]}
              onPress={() => handleSequenceToggle(option)}
              disabled={submitted}
            >
              <View style={styles.sequenceRow}>
                <View style={[styles.sequenceNumber, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.sequenceNumberText, { color: theme.text }]}>
                    {selectedIndex >= 0 ? selectedIndex + 1 : "+"}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: theme.text }]}>{option.text}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEquationBuilderPrompt = () => (
    <View style={styles.promptSection}>
      <View style={styles.equationBuilderLine}>
        <Text style={[styles.equationTargetText, { color: theme.text }]}>{promptData.target}</Text>
        <Text style={[styles.equationTargetText, { color: theme.secondary }]}>=</Text>
        <View style={styles.builderSlotsRow}>
          {builderSolution.map((_, slotIndex) => (
            <View
              key={`builder-slot-${slotIndex}`}
              style={[
                styles.builderSlot,
                {
                  borderColor: theme.secondary,
                  backgroundColor: theme.surfaceMuted,
                },
              ]}
            >
              <Text style={[styles.builderSlotText, { color: theme.text }]}>
                {builderSelectedTokens[slotIndex] || ""}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.builderBank}>
        {builderTokens.map((token, index) => {
          const isUsed = builderSelection.includes(index);

          return (
            <TouchableOpacity
              key={`builder-token-${index}-${token}`}
              style={[
                styles.builderToken,
                {
                  borderColor: isUsed ? theme.border : theme.primary,
                  backgroundColor: isUsed ? theme.border : theme.surface,
                },
              ]}
              onPress={() => handleBuilderTokenPress(index)}
              disabled={isUsed || submitted}
            >
              <Text style={[styles.builderTokenText, { color: isUsed ? theme.textSoft : theme.primary }]}>{token}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.builderBackspace, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
          onPress={handleBuilderBackspace}
          disabled={submitted || builderSelection.length === 0}
        >
          <Ionicons name="backspace-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuestionContent = () => {
    if (!question) return null;

    switch (question.type) {
      case "pattern_grid_choice":
        return renderPatternGrid();
      case "missing_factor_choice":
        return renderEquationPrompt();
      case "numeric_keypad":
        return renderNumericPrompt(true);
      case "numeric_input":
        return renderNumericPrompt(false);
      case "sequence_choice":
        return renderSequencePrompt();
      case "equation_builder":
        return renderEquationBuilderPrompt();
      default:
        return renderChoiceOptions(theme.primary);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <Ionicons name="warning-outline" size={44} color={theme.warning} />
        <Text style={[styles.errorTitle, { color: theme.text }]}>No se pudo abrir la lección</Text>
        <Text style={[styles.errorText, { color: theme.textSoft }]}>{error || "Faltan datos para mostrar este reto."}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={loadLesson}>
          <Text style={styles.primaryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (phase === "review_intro") {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]} onPress={handleClose}>
            <Ionicons name="close" size={22} color={theme.textSoft} />
          </TouchableOpacity>
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: theme.warning }]} />
          </View>
          <View style={[styles.heartsPill, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="heart" size={14} color={theme.danger} />
            <Text style={[styles.heartsText, { color: theme.text }]}>{heartsRemaining}</Text>
          </View>
        </View>

        <View style={styles.reviewIntroContent}>
          <View style={[styles.reviewIntroBadge, { backgroundColor: theme.mode === "dark" ? "#1e2d34" : "#eaf6ff" }]}>
            <Ionicons name="refresh-circle-outline" size={58} color={theme.warning} />
          </View>
          <Text style={[styles.reviewIntroTitle, { color: theme.text }]}>Vamos a corregir algunos errores.</Text>
          <Text style={[styles.reviewIntroText, { color: theme.textSoft }]}>
            Repetiremos {mistakeIds.length} reto{mistakeIds.length === 1 ? "" : "s"} en los que fallaste.
            No necesitarás energía en esta parte.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.footerButton, { backgroundColor: theme.primary }]}
          onPress={startReviewPhase}
        >
          <Text style={styles.footerButtonText}>Continuar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]} onPress={handleClose}>
          <Ionicons name="close" size={22} color={theme.textSoft} />
        </TouchableOpacity>

        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: phaseProgressColor }]} />
        </View>

        <View style={[styles.heartsPill, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="heart" size={14} color={theme.danger} />
          <Text style={[styles.heartsText, { color: theme.text }]}>{heartsRemaining}</Text>
        </View>
      </View>

      <View style={styles.headerMeta}>
        {comboCount >= 2 ? (
          <Text style={[styles.comboText, { color: theme.warning }]}>COMBO x{comboCount}</Text>
        ) : (
          <Text style={[styles.comboText, { color: theme.textSoft }]}>
            {getDifficultyLabel(question.difficulty)} · {getChallengeTypeLabel(question.type)}
          </Text>
        )}

        {isReviewQuestion ? (
          <View style={[styles.reviewTag, { backgroundColor: theme.mode === "dark" ? "#3c2b17" : "#fff4d9" }]}>
            <Ionicons name="repeat" size={14} color={theme.warning} />
            <Text style={[styles.reviewTagText, { color: theme.warning }]}>ERROR ANTERIOR</Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.promptTitle, { color: theme.text }]}>{question.text}</Text>
        {renderQuestionContent()}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        {validationMessage ? (
          <Text style={[styles.validationText, { color: theme.danger }]}>{validationMessage}</Text>
        ) : null}

        {submitted ? (
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: isCorrect
                  ? theme.mode === "dark"
                    ? "#193222"
                    : "#ecfae2"
                  : theme.mode === "dark"
                  ? "#351d22"
                  : "#fff0f1",
                borderColor: isCorrect ? theme.primary : theme.danger,
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={26}
                color={isCorrect ? theme.primary : theme.danger}
              />
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: isCorrect ? theme.primary : theme.danger },
                ]}
              >
                {feedbackTitle}
              </Text>
            </View>
            <Text style={[styles.feedbackBody, { color: theme.textSoft }]}>
              {question.explanation || "Sigue así: cada reto te empuja un poco más."}
            </Text>
            {!isCorrect && feedbackCorrectAnswer ? (
              <Text style={[styles.correctAnswerText, { color: theme.text }]}>
                Respuesta correcta: {feedbackCorrectAnswer}
              </Text>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.footerButton,
            {
              backgroundColor: submitted ? (isCorrect ? theme.primary : theme.danger) : theme.primary,
            },
            !submitted && !canSubmit && { backgroundColor: theme.border },
          ]}
          onPress={submitted ? moveForward : submitAnswer}
          disabled={!submitted && !canSubmit}
        >
          <Text style={styles.footerButtonText}>
            {submitted ? feedbackAction : "Comprobar"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
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
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  errorText: {
    textAlign: "center",
    lineHeight: 22,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    flex: 1,
    height: 14,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  heartsPill: {
    minWidth: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  heartsText: {
    fontWeight: "800",
  },
  headerMeta: {
    marginTop: 14,
    marginBottom: 4,
    minHeight: 24,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  comboText: {
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  reviewTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reviewTagText: {
    fontSize: 12,
    fontWeight: "800",
  },
  content: {
    paddingTop: 10,
    paddingBottom: 16,
    flexGrow: 1,
  },
  promptTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginBottom: 24,
  },
  promptSection: {
    gap: 22,
  },
  patternGrid: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
  },
  patternRow: {
    flexDirection: "row",
    minHeight: 120,
    borderBottomWidth: 1,
  },
  patternCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    paddingHorizontal: 12,
  },
  patternCellLast: {
    borderRightWidth: 0,
  },
  patternCellText: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  equationLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 6,
  },
  equationTokenText: {
    fontSize: 46,
    fontWeight: "800",
  },
  blankToken: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 3,
  },
  optionsContainer: {
    gap: 14,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  optionSelected: {
    transform: [{ scale: 1.01 }],
  },
  optionCorrect: {},
  optionWrong: {},
  optionText: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  answerInput: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  answerDisplayBox: {
    minWidth: 92,
    height: 72,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  answerDisplayText: {
    fontSize: 26,
    fontWeight: "800",
  },
  keypadSection: {
    gap: 18,
  },
  keypadInputBox: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
  },
  keypadInputValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  keypadButton: {
    width: "30.5%",
    aspectRatio: 1.55,
    borderWidth: 2,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: "800",
  },
  keypadSpacer: {
    width: "30.5%",
  },
  sequencePreview: {
    borderRadius: 18,
    padding: 16,
  },
  sequenceLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 6,
  },
  sequenceValue: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  sequenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sequenceNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceNumberText: {
    fontWeight: "800",
  },
  equationBuilderLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  equationTargetText: {
    fontSize: 54,
    fontWeight: "800",
  },
  builderSlotsRow: {
    flexDirection: "row",
    gap: 10,
  },
  builderSlot: {
    minWidth: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  builderSlotText: {
    fontSize: 24,
    fontWeight: "800",
  },
  builderBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
  },
  builderToken: {
    minWidth: 72,
    height: 72,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  builderTokenText: {
    fontSize: 24,
    fontWeight: "800",
  },
  builderBackspace: {
    minWidth: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 18,
    gap: 12,
    borderTopWidth: 1,
  },
  validationText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  feedbackCard: {
    borderWidth: 2,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  feedbackBody: {
    lineHeight: 22,
  },
  correctAnswerText: {
    fontWeight: "700",
    marginTop: 2,
  },
  footerButton: {
    paddingVertical: 18,
    borderRadius: 20,
  },
  footerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  primaryButton: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 18,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  reviewIntroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  reviewIntroBadge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  reviewIntroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  reviewIntroText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
