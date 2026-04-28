import React from "react";
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../hooks/useAppTheme";

const sections = [
  {
    title: "1. Uso educativo",
    body:
      "MateCamba es una app de práctica matemática. Los resultados, consejos y niveles apoyan el aprendizaje, pero no reemplazan orientación académica profesional ni evaluación formal.",
  },
  {
    title: "2. Cuenta y datos",
    body:
      "Para guardar progreso, la app almacena nombre, correo, avance, puntajes y métricas de práctica. El usuario es responsable de mantener segura su contraseña.",
  },
  {
    title: "3. Progreso y recompensas",
    body:
      "Los niveles, estrellas, XP y fases son indicadores internos del sistema de aprendizaje. Pueden ajustarse cuando el contenido o las reglas pedagógicas se actualicen.",
  },
  {
    title: "4. Conducta y uso adecuado",
    body:
      "No está permitido manipular respuestas, falsificar sesiones ni intentar afectar el progreso de otros usuarios. La app puede restringir cuentas que abusen del sistema.",
  },
  {
    title: "5. Contenido local",
    body:
      "Los retos están inspirados en contextos cotidianos de Santa Cruz de la Sierra. Se busca cercanía educativa, no representar datos oficiales de comercios, rutas o instituciones.",
  },
  {
    title: "6. Cambios y disponibilidad",
    body:
      "La aplicación puede actualizarse, cambiar reglas de niveles o pausar servicios para mantenimiento. Se hará el esfuerzo razonable para mantener continuidad del aprendizaje.",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundAlt }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={18} color={theme.text} />
          <Text style={[styles.backButtonText, { color: theme.text }]}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: theme.surfaceAccent }]}>
            <Ionicons name="document-text-outline" size={34} color={theme.text} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Términos y condiciones</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>
            Reglas básicas de uso, privacidad operativa y alcance educativo de MateCamba.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{section.title}</Text>
            <Text style={[styles.cardBody, { color: theme.textSoft }]}>{section.body}</Text>
          </View>
        ))}

        <View style={[styles.footerCard, { backgroundColor: theme.mode === "dark" ? "#172a36" : "#eaf4ff" }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.secondary} />
          <Text style={[styles.footerText, { color: theme.secondary }]}>
            Al crear cuenta aceptas estas condiciones y autorizas el almacenamiento del progreso
            necesario para el funcionamiento normal de la app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
  },
  backButtonText: {
    fontWeight: "700",
  },
  hero: {
    marginBottom: 20,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#e8f7d8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#173d32",
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardBody: {
    lineHeight: 22,
  },
  footerCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
  },
  footerText: {
    flex: 1,
    lineHeight: 21,
  },
});
