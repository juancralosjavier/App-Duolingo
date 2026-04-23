import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/useAuth";

export default function App() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[courseId]" />
        <Stack.Screen name="lesson/[lessonId]" />
        <Stack.Screen name="result" />
      </Stack>
    </AuthProvider>
  );
}
