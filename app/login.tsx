import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { loginUser } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useAppTheme } from "../hooks/useAppTheme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)");
    }
  }, [authLoading, router, user]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email.trim().toLowerCase(), password);
      await signIn(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      const message = err.message || "No se pudo iniciar sesión";
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={[styles.logoBadge, { backgroundColor: theme.surfaceAccent }]}>
            <Ionicons name="calculator-outline" size={54} color={theme.text} />
          </View>
          <Text style={[styles.title, { color: theme.primary }]}>MateCamba</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>
            Matemáticas útiles, retos cortos y avance por fases al estilo Duolingo.
          </Text>

          <View style={styles.form}>
            <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={18} color={theme.textSoft} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Correo electrónico"
                placeholderTextColor={theme.textSoft}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.textSoft} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Contraseña"
                placeholderTextColor={theme.textSoft}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar a mi ruta</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSoft }]}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text style={[styles.link, { color: theme.primary }]}>Crear cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoBadge: {
    width: 112,
    height: 112,
    borderRadius: 36,
    backgroundColor: "#e8f7d8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#58cc02",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 36,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 22,
  },
  form: {
    width: "100%",
    maxWidth: 340,
    gap: 12,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  error: {
    color: "#ff4b4b",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#58cc02",
    padding: 16,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: "#58cc02",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    marginTop: 34,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
