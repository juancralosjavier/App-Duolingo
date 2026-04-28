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
import { register } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useAppTheme } from "../hooks/useAppTheme";

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const { theme } = useAppTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)");
    }
  }, [authLoading, router, user]);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Completa todos los campos.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        acceptedTerms,
      });
      await signIn(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      const message = err.message || "No se pudo crear la cuenta";
      Alert.alert("Error", message);
      setError(message);
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
          <View style={[styles.logoBadge, { backgroundColor: theme.mode === "dark" ? "#173447" : "#eef7ff" }]}>
            <Ionicons name="school-outline" size={50} color={theme.text} />
          </View>
          <Text style={[styles.title, { color: theme.primary }]}>Crear cuenta</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>
            Abre tu ruta, guarda progreso real y desbloquea niveles por fases.
          </Text>

          <View style={styles.form}>
            <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={18} color={theme.textSoft} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Nombre"
                placeholderTextColor={theme.textSoft}
                value={name}
                onChangeText={setName}
              />
            </View>

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

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptedTerms((value) => !value)}
            >
              <View style={[styles.checkbox, { borderColor: theme.border }, acceptedTerms && [styles.checkboxActive, { backgroundColor: theme.primary, borderColor: theme.primary }]]}>
                {acceptedTerms ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : null}
              </View>
              <Text style={[styles.termsText, { color: theme.textSoft }]}>
                Acepto los{" "}
                <Text style={[styles.termsLink, { color: theme.secondary }]} onPress={() => router.push("/terms" as any)}>
                  términos y condiciones
                </Text>
                .
              </Text>
            </TouchableOpacity>

            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crear mi cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSoft }]}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push("/login" as any)}>
              <Text style={[styles.link, { color: theme.primary }]}>Iniciar sesión</Text>
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
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: "#eef7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#58cc02",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: "700",
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
    marginTop: 4,
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
    marginTop: 28,
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
