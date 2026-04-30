import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
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
type PlayMode = "classic" | "speed" | "boss";

const SUCCESS_TITLES = ["¡Así se hace!", "¡Buen trabajo!", "¡Muy bien!"];
const ERROR_TITLES = ["Eso estuvo difícil", "Vamos otra vez", "Casi lo logras"];
const KEYPAD_VALUES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
const HEART_SLOTS = 5;
const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  classic: "Modo clásico",
  speed: "Modo rápido",
  boss: "Batalla jefe",
};

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
  const { lessonId, returnTo, playMode } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { user, updateUser } = useAuth();
  const { playCorrect, playWrong } = useLessonFeedback();
  const { width, height } = useWindowDimensions();
  const normalizedPlayMode: PlayMode =
    playMode === "speed" || playMode === "boss" || playMode === "classic" ? playMode : "classic";
  const isSpeedMode = normalizedPlayMode === "speed";
  const isBossMode = normalizedPlayMode === "boss";

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
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [adaptiveLevel, setAdaptiveLevel] = useState(0);
  const [adaptiveMessage, setAdaptiveMessage] = useState("");
  const progressAnimation = React.useRef(new Animated.Value(0)).current;
  const feedbackAnimation = React.useRef(new Animated.Value(0)).current;
  const heartsScale = React.useRef(new Animated.Value(1)).current;
  const heartsShake = React.useRef(new Animated.Value(0)).current;
  const questionAnimation = React.useRef(new Animated.Value(1)).current;
  const answerShake = React.useRef(new Animated.Value(0)).current;
  const successScale = React.useRef(new Animated.Value(1)).current;
  const previousHeartsRef = React.useRef(user?.hearts ?? 5);
  const veryCompactLayout = width < 390 || height < 760;
  const compactLayout = width < 430 || height < 860;

  const metrics = useMemo(
    () => ({
      promptTitleSize: veryCompactLayout ? 20 : compactLayout ? 22 : 28,
      optionTextSize: veryCompactLayout ? 16 : compactLayout ? 17 : 21,
      optionPaddingVertical: veryCompactLayout ? 12 : compactLayout ? 15 : 19,
      equationTextSize: veryCompactLayout ? 28 : compactLayout ? 32 : 42,
      targetTextSize: veryCompactLayout ? 32 : compactLayout ? 38 : 50,
      patternRowHeight: veryCompactLayout ? 70 : compactLayout ? 84 : 108,
      patternCellTextSize: veryCompactLayout ? 15 : compactLayout ? 17 : 21,
      blankSize: veryCompactLayout ? 48 : compactLayout ? 54 : 64,
      answerBoxHeight: veryCompactLayout ? 52 : compactLayout ? 58 : 68,
      answerBoxMinWidth: veryCompactLayout ? 62 : compactLayout ? 72 : 88,
      answerTextSize: veryCompactLayout ? 18 : compactLayout ? 20 : 24,
      builderTileSize: veryCompactLayout ? 48 : compactLayout ? 54 : 68,
      horizontalPadding: veryCompactLayout ? 10 : compactLayout ? 12 : 18,
      keypadAspectRatio: veryCompactLayout ? 2.35 : compactLayout ? 2.05 : 1.55,
      keypadGap: veryCompactLayout ? 8 : 12,
    }),
    [compactLayout, veryCompactLayout]
  );

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getLessonDetail(Number(lessonId));
      const userHearts = user?.hearts ?? 5;
      const startingHearts =
        normalizedPlayMode === "boss" ? Math.max(1, Math.min(userHearts, 3)) : Math.max(userHearts, 3);
      setLesson(data);
      setHeartsRemaining(startingHearts);
      previousHeartsRef.current = startingHearts;
      setPhase("main");
      setCurrentQuestionIndex(0);
      setMistakeIds([]);
      setReviewQueue([]);
      setCorrectCount(0);
      setComboCount(0);
      setBestCombo(0);
      setAdaptiveLevel(0);
      setAdaptiveMessage("");
      setSecondsLeft(0);
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
  }, [lessonId, normalizedPlayMode, user?.hearts]);

  useEffect(() => {
    void loadLesson();
  }, [loadLesson]);

  const activeQuestions = useMemo(() => {
    if (!lesson) return [];
    return phase === "review" ? reviewQueue : lesson.questions;
  }, [lesson, phase, reviewQueue]);

  const question = activeQuestions[currentQuestionIndex];
  const promptData = useMemo(() => question?.promptData || {}, [question?.promptData]);
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
  const getQuestionTime = useCallback(() => {
    if (phase !== "main") return 0;
    const adaptiveCut = Math.max(0, adaptiveLevel);

    if (isSpeedMode) return Math.max(7, 10 - adaptiveCut);
    if (isBossMode) return Math.max(12, 15 - adaptiveCut);
    return 0;
  }, [adaptiveLevel, isBossMode, isSpeedMode, phase]);
  const questionTimeLimit = getQuestionTime();
  const showTimer = questionTimeLimit > 0 && !isReviewQuestion;
  const timerProgress = questionTimeLimit > 0 ? Math.max(0, Math.min(100, (secondsLeft / questionTimeLimit) * 100)) : 0;
  const progressWidth = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  const answerShakeTranslate = answerShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });
  const feedbackTranslateY = feedbackAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const feedbackOpacity = feedbackAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: Math.max(0, Math.min(1, progress / 100)),
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnimation]);

  useEffect(() => {
    Animated.timing(feedbackAnimation, {
      toValue: submitted ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [feedbackAnimation, submitted]);

  useEffect(() => {
    questionAnimation.setValue(0);
    Animated.timing(questionAnimation, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex, phase, questionAnimation]);

  useEffect(() => {
    setSecondsLeft(getQuestionTime());
  }, [currentQuestionIndex, getQuestionTime, phase, question?.id]);

  useEffect(() => {
    const previousHearts = previousHeartsRef.current;

    if (heartsRemaining < previousHearts) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(heartsScale, { toValue: 1.14, duration: 120, useNativeDriver: true }),
          Animated.timing(heartsScale, { toValue: 1, duration: 170, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(heartsShake, { toValue: -6, duration: 45, useNativeDriver: true }),
          Animated.timing(heartsShake, { toValue: 6, duration: 70, useNativeDriver: true }),
          Animated.timing(heartsShake, { toValue: -4, duration: 55, useNativeDriver: true }),
          Animated.timing(heartsShake, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]),
      ]).start();
    } else if (heartsRemaining > previousHearts) {
      Animated.sequence([
        Animated.timing(heartsScale, { toValue: 1.12, duration: 130, useNativeDriver: true }),
        Animated.timing(heartsScale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }

    previousHeartsRef.current = heartsRemaining;
  }, [heartsRemaining, heartsScale, heartsShake]);

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
    setAdaptiveMessage("");
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
          playMode: normalizedPlayMode,
          returnTo: typeof returnTo === "string" ? returnTo : `/course/${lesson.unit.course.id}`,
        },
      });
    },
    [bestCombo, lesson, mistakeIds.length, normalizedPlayMode, returnTo, reviewQueue.length, router]
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
      if (phase === "main" && mistakeIds.length > 0) {
        setReviewQueue(lesson.questions.filter((item) => mistakeIds.includes(item.id)));
        setPhase("review_intro");
        resetAnswerState();
        return;
      }

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

  const submitAnswer = useCallback(async (timedOut = false) => {
    if (!question || submitted) return;

    let correct = false;

    if (timedOut) {
      correct = false;
    } else if (question.type === "numeric_input" || question.type === "numeric_keypad") {
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
    const addsMistake = !correct && phase === "main" && !mistakeIds.includes(question.id);
    const queuedMistakeCount = mistakeIds.length + (addsMistake ? 1 : 0);

    if (correct) {
      const nextCombo = comboCount + 1;
      const nextAdaptiveLevel = nextCombo >= 3 ? Math.min(2, adaptiveLevel + 1) : adaptiveLevel;

      setCorrectCount(nextCorrectCount);
      setComboCount(nextCombo);
      setBestCombo((previous) => Math.max(previous, nextCombo));
      setAdaptiveLevel(nextAdaptiveLevel);
      setAdaptiveMessage(
        nextCombo >= 3
          ? "Subimos un punto la dificultad: menos tiempo y más foco."
          : "Suma XP, mantén el combo y desbloquea cofres."
      );
      Animated.sequence([
        Animated.timing(successScale, { toValue: 1.035, duration: 120, useNativeDriver: true }),
        Animated.timing(successScale, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      await playCorrect();
    } else {
      const nextAdaptiveLevel = phase === "main" ? Math.max(-1, adaptiveLevel - 1) : adaptiveLevel;

      setComboCount(0);
      setAdaptiveLevel(nextAdaptiveLevel);
      setAdaptiveMessage(
        timedOut
          ? "Se acabó el tiempo. Repetiremos esta pregunta al final sin gastar energía."
          : phase === "main"
          ? "Bajamos un poco el ritmo y repasamos este error al final."
          : "Mira la explicación y vuelve a intentarlo con calma."
      );
      if (addsMistake) {
        setMistakeIds((current) => [...current, question.id]);
      }
      if (nextHearts !== heartsRemaining) {
        void updateUser({ hearts: nextHearts });
      }
      Animated.sequence([
        Animated.timing(answerShake, { toValue: -1, duration: 45, useNativeDriver: true }),
        Animated.timing(answerShake, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(answerShake, { toValue: -0.6, duration: 55, useNativeDriver: true }),
        Animated.timing(answerShake, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
      await playWrong();
    }

    setSubmitted(true);
    setIsCorrect(correct);
    setHeartsRemaining(nextHearts);
    setValidationMessage("");
    setFeedbackTitle(timedOut ? "Se acabó el tiempo" : pickFeedbackTitle(correct, phase, currentQuestionIndex + correctCount));
    setFeedbackCorrectAnswer(correct ? "" : buildCorrectAnswerText(question, promptData, orderedSequence, builderSolution));

    const isLastVisibleQuestion =
      phase === "main"
        ? currentQuestionIndex >= lessonQuestionCount - 1
        : currentQuestionIndex >= reviewQueue.length - 1;

    if (!correct && nextHearts <= 0 && phase === "main" && queuedMistakeCount > 0) {
      setFeedbackAction("Repasar error");
    } else if (!correct && nextHearts <= 0) {
      setFeedbackAction("Ver resultado");
    } else if (phase === "review" && isLastVisibleQuestion) {
      setFeedbackAction("Cerrar repaso");
    } else if (phase === "main" && isLastVisibleQuestion && !correct) {
      setFeedbackAction("Ir al repaso");
    } else if (!correct) {
      setFeedbackAction("Entendido");
    } else {
      setFeedbackAction("Continuar");
    }
  }, [
    adaptiveLevel,
    answerInput,
    answerShake,
    builderSelectedTokens,
    builderSolution,
    comboCount,
    correctCount,
    currentQuestionIndex,
    heartsRemaining,
    lessonQuestionCount,
    mistakeIds,
    orderedSequence,
    phase,
    playCorrect,
    playWrong,
    promptData,
    question,
    reviewQueue.length,
    selectedOption,
    sequenceSelection,
    submitted,
    successScale,
    updateUser,
  ]);

  useEffect(() => {
    if (!showTimer || submitted || !question) return;

    if (secondsLeft <= 0) {
      void submitAnswer(true);
      return;
    }

    const tick = setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(tick);
  }, [question, secondsLeft, showTimer, submitted, submitAnswer]);

  const handleClose = () => {
    if (!lesson) return;
    const destination =
      typeof returnTo === "string" && returnTo.length > 0 ? returnTo : `/course/${lesson.unit.course.id}`;
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
            { paddingVertical: metrics.optionPaddingVertical },
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
              { color: theme.text, fontSize: metrics.optionTextSize },
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
          <View
            key={`pattern-row-${rowIndex}`}
            style={[styles.patternRow, { borderBottomColor: theme.border, minHeight: metrics.patternRowHeight }]}
          >
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
                  <Text
                    style={[
                      styles.patternCellText,
                      { color: isMissing ? theme.secondary : theme.text, fontSize: metrics.patternCellTextSize },
                    ]}
                  >
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
              <View
                style={[
                  styles.blankToken,
                  {
                    width: metrics.blankSize,
                    height: metrics.blankSize,
                    borderColor: theme.secondary,
                    backgroundColor: theme.surfaceMuted,
                  },
                ]}
              />
            ) : (
              <Text
                style={[
                  styles.equationTokenText,
                  {
                    color: token === "×" || token === "=" ? theme.secondary : theme.text,
                    fontSize: metrics.equationTextSize,
                  },
                ]}
              >
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
                      minWidth: metrics.answerBoxMinWidth,
                      height: metrics.answerBoxHeight,
                      borderColor: theme.secondary,
                      backgroundColor: theme.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={[styles.answerDisplayText, { color: theme.text, fontSize: metrics.answerTextSize }]}>
                    {answerInput || ""}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.equationTokenText,
                    {
                      color: token === "×" || token === "=" || token === "+" || token === "-" ? theme.secondary : theme.text,
                      fontSize: metrics.equationTextSize,
                    },
                  ]}
                >
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
              <Text style={[styles.keypadInputValue, { color: theme.text, fontSize: metrics.answerTextSize + 2 }]}>
                {answerInput || promptData.placeholder || "0"}
              </Text>
            </View>
          ) : null}

          <View style={[styles.keypadGrid, { gap: metrics.keypadGap }]}>
            {KEYPAD_VALUES.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.keypadButton,
                  {
                    aspectRatio: metrics.keypadAspectRatio,
                    backgroundColor: theme.surfaceMuted,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleKeypadPress(value)}
              >
                <Text
                  style={[
                    styles.keypadButtonText,
                    { color: theme.text, fontSize: veryCompactLayout ? 21 : compactLayout ? 24 : 28 },
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.keypadSpacer} />
            <TouchableOpacity
              style={[
                styles.keypadButton,
                {
                  aspectRatio: metrics.keypadAspectRatio,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
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
              fontSize: metrics.answerTextSize,
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
                <Text style={[styles.optionText, { color: theme.text, fontSize: metrics.optionTextSize }]}>{option.text}</Text>
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
        <Text style={[styles.equationTargetText, { color: theme.text, fontSize: metrics.targetTextSize }]}>{promptData.target}</Text>
        <Text style={[styles.equationTargetText, { color: theme.secondary, fontSize: metrics.targetTextSize }]}>=</Text>
        <View style={styles.builderSlotsRow}>
          {builderSolution.map((_, slotIndex) => (
            <View
              key={`builder-slot-${slotIndex}`}
              style={[
                styles.builderSlot,
                {
                  minWidth: metrics.builderTileSize,
                  height: metrics.builderTileSize,
                  borderColor: theme.secondary,
                  backgroundColor: theme.surfaceMuted,
                },
              ]}
            >
              <Text style={[styles.builderSlotText, { color: theme.text, fontSize: compactLayout ? 20 : 24 }]}>
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
                  minWidth: metrics.builderTileSize,
                  height: metrics.builderTileSize,
                  borderColor: isUsed ? theme.border : theme.primary,
                  backgroundColor: isUsed ? theme.border : theme.surface,
                },
              ]}
              onPress={() => handleBuilderTokenPress(index)}
              disabled={isUsed || submitted}
            >
              <Text
                style={[styles.builderTokenText, { color: isUsed ? theme.textSoft : theme.primary, fontSize: compactLayout ? 20 : 24 }]}
              >
                {token}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[
            styles.builderBackspace,
            {
              minWidth: metrics.builderTileSize,
              height: metrics.builderTileSize,
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
            },
          ]}
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
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background, paddingHorizontal: metrics.horizontalPadding }]}
        edges={["top", "bottom"]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.topBar}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]} onPress={handleClose}>
            <Ionicons name="close" size={22} color={theme.textSoft} />
          </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: theme.warning }]} />
        </View>
          <Animated.View
            style={[
              styles.heartsPill,
              {
                backgroundColor: theme.surfaceMuted,
                transform: [{ translateX: heartsShake }, { scale: heartsScale }],
              },
            ]}
          >
            <Ionicons name="heart" size={14} color={theme.danger} />
            <Text style={[styles.heartsText, { color: theme.text }]}>{heartsRemaining}</Text>
            <View style={styles.heartsMiniRow}>
              {Array.from({ length: HEART_SLOTS }).map((_, index) => {
                const active = index < heartsRemaining;

                return (
                  <Ionicons
                    key={`intro-heart-${index}`}
                    name={active ? "heart" : "heart-outline"}
                    size={11}
                    color={active ? theme.danger : theme.textSoft}
                    style={{ opacity: active ? 1 : 0.45 }}
                  />
                );
              })}
            </View>
          </Animated.View>
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
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background, paddingHorizontal: metrics.horizontalPadding }]}
      edges={["top", "bottom"]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.surfaceMuted }]} onPress={handleClose}>
          <Ionicons name="close" size={22} color={theme.textSoft} />
        </TouchableOpacity>

        <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: phaseProgressColor }]} />
        </View>

        <Animated.View
          style={[
            styles.heartsPill,
            {
              backgroundColor: theme.surfaceMuted,
              transform: [{ translateX: heartsShake }, { scale: heartsScale }],
            },
          ]}
        >
          <Ionicons name="heart" size={14} color={theme.danger} />
          <Text style={[styles.heartsText, { color: theme.text }]}>{heartsRemaining}</Text>
          <View style={styles.heartsMiniRow}>
            {Array.from({ length: HEART_SLOTS }).map((_, index) => {
              const active = index < heartsRemaining;

              return (
                <Ionicons
                  key={`play-heart-${index}`}
                  name={active ? "heart" : "heart-outline"}
                  size={11}
                  color={active ? theme.danger : theme.textSoft}
                  style={{ opacity: active ? 1 : 0.45 }}
                />
              );
            })}
          </View>
        </Animated.View>
      </View>

      <View style={styles.headerMeta}>
        <View style={styles.metaLeft}>
          {comboCount >= 2 ? (
            <Text style={[styles.comboText, { color: theme.warning }]}>COMBO x{comboCount}</Text>
          ) : (
            <Text style={[styles.comboText, { color: theme.textSoft }]}>
              {PLAY_MODE_LABELS[normalizedPlayMode]} · {getDifficultyLabel(question.difficulty)}
            </Text>
          )}
          <Text style={[styles.modeHint, { color: theme.textSoft }]}>
            {getChallengeTypeLabel(question.type)}
            {adaptiveLevel > 0 ? ` · dificultad +${adaptiveLevel}` : adaptiveLevel < 0 ? " · repaso guiado" : ""}
          </Text>
        </View>

        {showTimer ? (
          <View style={[styles.timerPill, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <View style={styles.timerLabelRow}>
              <Ionicons name={isBossMode ? "flame" : "timer-outline"} size={14} color={isBossMode ? theme.warning : theme.secondary} />
              <Text style={[styles.timerText, { color: secondsLeft <= 3 ? theme.danger : theme.text }]}>
                {secondsLeft}s
              </Text>
            </View>
            <View style={[styles.timerTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.timerFill,
                  {
                    width: `${timerProgress}%`,
                    backgroundColor: secondsLeft <= 3 ? theme.danger : isBossMode ? theme.warning : theme.secondary,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        {isReviewQuestion ? (
          <View style={[styles.reviewTag, { backgroundColor: theme.mode === "dark" ? "#3c2b17" : "#fff4d9" }]}>
            <Ionicons name="repeat" size={14} color={theme.warning} />
            <Text style={[styles.reviewTagText, { color: theme.warning }]}>ERROR ANTERIOR</Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: questionAnimation,
            transform: [
              { translateX: answerShakeTranslate },
              {
                translateY: questionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: questionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1],
                }),
              },
              { scale: successScale },
            ],
          }}
        >
          <Text
            style={[
              styles.promptTitle,
              { color: theme.text, fontSize: metrics.promptTitleSize, lineHeight: metrics.promptTitleSize + 6 },
            ]}
          >
            {question.text}
          </Text>
          {renderQuestionContent()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        {validationMessage ? (
          <Text style={[styles.validationText, { color: theme.danger }]}>{validationMessage}</Text>
        ) : null}

        {submitted ? (
          <Animated.View
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
                opacity: feedbackOpacity,
                transform: [{ translateY: feedbackTranslateY }],
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
            {adaptiveMessage ? (
              <View style={[styles.adaptiveNote, { backgroundColor: theme.surface }]}>
                <Ionicons name="analytics-outline" size={15} color={isCorrect ? theme.primary : theme.warning} />
                <Text style={[styles.adaptiveNoteText, { color: theme.textSoft }]}>{adaptiveMessage}</Text>
              </View>
            ) : null}
            {!isCorrect && feedbackCorrectAnswer ? (
              <Text style={[styles.correctAnswerText, { color: theme.text }]}>
                Respuesta correcta: {feedbackCorrectAnswer}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.footerButton,
            {
              backgroundColor: submitted ? (isCorrect ? theme.primary : theme.danger) : theme.primary,
            },
            !submitted && !canSubmit && { backgroundColor: theme.border },
          ]}
          onPress={submitted ? moveForward : () => submitAnswer()}
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
    paddingTop: 12,
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
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  heartsText: {
    fontWeight: "800",
  },
  heartsMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
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
  metaLeft: {
    flex: 1,
    gap: 2,
  },
  comboText: {
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  modeHint: {
    fontSize: 12,
    fontWeight: "700",
  },
  timerPill: {
    minWidth: 82,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 5,
  },
  timerLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "900",
  },
  timerTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    borderRadius: 999,
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
    marginBottom: 18,
  },
  promptSection: {
    gap: 18,
  },
  patternGrid: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
  },
  patternRow: {
    flexDirection: "row",
    minHeight: 108,
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
    fontSize: 21,
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
    fontSize: 42,
    fontWeight: "800",
  },
  blankToken: {
    width: 64,
    height: 64,
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
    paddingVertical: 19,
  },
  optionSelected: {
    transform: [{ scale: 1.01 }],
  },
  optionCorrect: {},
  optionWrong: {},
  optionText: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  answerInput: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  answerDisplayBox: {
    minWidth: 88,
    height: 68,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  answerDisplayText: {
    fontSize: 24,
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
    fontSize: 24,
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
    fontSize: 24,
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
    fontSize: 50,
    fontWeight: "800",
  },
  builderSlotsRow: {
    flexDirection: "row",
    gap: 10,
  },
  builderSlot: {
    minWidth: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  builderSlotText: {
    fontSize: 22,
    fontWeight: "800",
  },
  builderBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
  },
  builderToken: {
    minWidth: 68,
    height: 68,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  builderTokenText: {
    fontSize: 22,
    fontWeight: "800",
  },
  builderBackspace: {
    minWidth: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingTop: 14,
    paddingBottom: 16,
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
  adaptiveNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  adaptiveNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  correctAnswerText: {
    fontWeight: "700",
    marginTop: 2,
  },
  footerButton: {
    paddingVertical: 16,
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
