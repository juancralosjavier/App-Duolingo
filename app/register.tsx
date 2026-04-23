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
import { register } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn, user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/(tabs)");
    }
  }, [authLoading, router, user]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (password.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await register({ name, email, password });
      await signIn(data.user, data.token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo crear la cuenta");
      setError(err.message || "Error al registrar");
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
            <Text style={styles.logo}>🧮</Text>
          </View>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Empieza tu ruta de retos matemáticos con contexto cruceño
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#afafaf"
              value={name}
              onChangeText={setName}
            />

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
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <TouchableOpacity onPress={() => router.push("/login" as any)}>
              <Text style={styles.link}>Iniciar sesión</Text>
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
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "#eef7ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
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
