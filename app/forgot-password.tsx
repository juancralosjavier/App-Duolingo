import React, { useState } from "react";
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
import { resetUserPassword } from "../services/api";
import { useAppTheme } from "../hooks/useAppTheme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Completa todos los campos.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError("Ingresa un correo válido.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response: { message?: string } = await resetUserPassword(normalizedEmail, newPassword);
      Alert.alert("Contraseña actualizada", response.message || "Ya puedes iniciar sesión con tu nueva contraseña.", [
        {
          text: "Ir al login",
          onPress: () => router.replace("/login"),
        },
      ]);
    } catch (resetError: any) {
      const message = resetError?.message || "No se pudo restablecer la contraseña";
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>Volver</Text>
          </TouchableOpacity>

          <View style={[styles.logoBadge, { backgroundColor: theme.surfaceAccent }]}>
            <Ionicons name="key-outline" size={46} color={theme.text} />
          </View>

          <Text style={[styles.title, { color: theme.primary }]}>Restablecer contraseña</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>
            Ingresa tu correo y define una nueva contraseña para recuperar el acceso.
          </Text>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={theme.secondary} />
            <Text style={[styles.infoText, { color: theme.textSoft }]}>
              En esta versión educativa el restablecimiento se hace directamente por correo. Más adelante podemos agregar recuperación por email con código.
            </Text>
          </View>

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
                placeholder="Nueva contraseña"
                placeholderTextColor={theme.textSoft}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.textSoft} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirmar contraseña"
                placeholderTextColor={theme.textSoft}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Guardar nueva contraseña</Text>
              )}
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
    padding: 24,
  },
  backButton: {
    position: "absolute",
    top: 18,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: "600",
  },
  logoBadge: {
    width: 92,
    height: 92,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 22,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(88,204,2,0.09)",
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
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
    fontSize: 14,
    textAlign: "center",
  },
  button: {
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
});
