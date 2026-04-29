import "react-native-gesture-handler";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../hooks/useAuth";
import { ThemeProvider, useAppTheme } from "../hooks/useAppTheme";
import { StatusBar } from "expo-status-bar";
import { warmUpApi } from "../services/api";

function RootNavigator() {
  const { themeName } = useAppTheme();

  useEffect(() => {
    void warmUpApi().catch((error) => {
      console.log("No se pudo precalentar la API:", error?.message || error);
    });
  }, []);

  return (
    <>
      <StatusBar style={themeName === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[courseId]" />
        <Stack.Screen name="lesson/[lessonId]" />
        <Stack.Screen name="result" />
        <Stack.Screen name="terms" />
      </Stack>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
