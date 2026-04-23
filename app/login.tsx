import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { loginUser } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
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
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);
      await signIn(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
      Alert.alert("Error", err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoBadge}>
            <Text style={styles.logo}>➗</Text>
          </View>
          <Text style={styles.title}>MateCamba</Text>
          <Text style={styles.subtitle}>
            Matemáticas diarias con retos pensados para Santa Cruz
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#afafaf"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#afafaf"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continuar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push("/register" as any)}>
              <Text style={styles.link}>Crear cuenta</Text>
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
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoBadge: {
    width: 112,
    height: 112,
    borderRadius: 32,
    backgroundColor: "#e8f7d8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logo: {
    fontSize: 54,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#58cc02",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 40,
    textAlign: "center",
    maxWidth: 320,
  },
  form: {
    width: "100%",
    maxWidth: 320,
  },
  input: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  error: {
    color: "#ff4b4b",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#58cc02",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#58cc02",
    shadowOpacity: 0.2,
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
    marginTop: 40,
  },
  footerText: {
    color: "#777",
    fontSize: 14,
  },
  link: {
    color: "#58cc02",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
