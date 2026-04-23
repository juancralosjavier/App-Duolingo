import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getLessonDetail } from "../../services/api";

interface Option {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  text: string;
  type: string;
  options: Option[];
}

interface Lesson {
  id: number;
  title: string;
  questions: Question[];
}

export default function LessonScreen() {
  const { lessonId, userId } = useLocalSearchParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    try {
      const data = await getLessonDetail(Number(lessonId));
      setLesson(data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#58cc02" />
      </SafeAreaView>
    );
  }

  const question = lesson.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / lesson.questions.length) * 100;
  const isInputQuestion = question.type === "numeric_input";

  const goToNextQuestion = (correct: boolean) => {
    if (correct) {
      setCorrectCount((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < lesson.questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedOption(null);
        setSubmitted(false);
        setIsCorrect(null);
        setAnswerInput("");
      } else {
        const finalScore = correctCount + (correct ? 1 : 0);
        router.replace({
          pathname: "/result",
          params: {
            lessonId: String(lessonId),
            userId: String(userId),
            correct: String(finalScore),
            total: String(lesson.questions.length),
          },
        });
      }
    }, 1300);
  };

  const handleSelect = (optionId: number) => {
    if (submitted) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const option = question.options.find((item) => item.id === selectedOption);
    const correct = option?.isCorrect || false;

    setIsCorrect(correct);
    setSubmitted(true);
    goToNextQuestion(correct);
  };

  const handleInputSubmit = () => {
    const correctOption = question.options.find((item) => item.isCorrect);
    const correct =
      answerInput.trim().toLowerCase().replace(",", ".") ===
      correctOption?.text.toLowerCase().replace(",", ".");

    setIsCorrect(correct);
    setSubmitted(true);
    goToNextQuestion(correct);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.counter}>
          {currentQuestion + 1}/{lesson.questions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question.text}</Text>
      </View>

      {isInputQuestion ? (
        <View style={styles.inputSection}>
          <TextInput
            style={[
              styles.answerInput,
              submitted && (isCorrect ? styles.correctInput : styles.incorrectInput),
            ]}
            placeholder="Escribe tu resultado"
            placeholderTextColor="#afafaf"
            value={answerInput}
            onChangeText={setAnswerInput}
            keyboardType="numeric"
            editable={!submitted}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!answerInput || submitted) && styles.disabledButton,
            ]}
            onPress={handleInputSubmit}
            disabled={!answerInput || submitted}
          >
            <Text style={styles.submitText}>Comprobar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selectedOption === option.id && styles.selectedOption,
                submitted &&
                  (option.isCorrect
                    ? styles.correctOption
                    : selectedOption === option.id
                    ? styles.incorrectOption
                    : styles.disabledOption),
              ]}
              onPress={() => handleSelect(option.id)}
              disabled={submitted}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption === option.id && styles.selectedOptionText,
                  submitted &&
                    (option.isCorrect
                      ? styles.correctOptionText
                      : selectedOption === option.id
                      ? styles.incorrectOptionText
                      : styles.disabledOptionText),
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (selectedOption === null || submitted) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={selectedOption === null || submitted}
          >
            <Text style={styles.submitText}>Comprobar</Text>
          </TouchableOpacity>
        </View>
      )}
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
  lessonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#173d32",
    marginBottom: 14,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#e5e5e5",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#58cc02",
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
    marginBottom: 30,
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
  },
  selectedOptionText: {
    color: "#2493ee",
  },
  correctOptionText: {
    color: "#58cc02",
  },
  incorrectOptionText: {
    color: "#ff4b4b",
  },
  disabledOptionText: {
    color: "#777",
  },
  submitButton: {
    backgroundColor: "#58cc02",
    padding: 18,
    borderRadius: 16,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: "#e5e5e5",
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
    backgroundColor: "#e5e5e5",
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
});
