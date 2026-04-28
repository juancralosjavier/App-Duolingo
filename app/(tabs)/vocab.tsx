import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../hooks/useAppTheme";

const challengeData = [
  {
    category: "Mercado y cambio",
    icon: "cart-outline",
    items: [
      { label: "Cambio exacto", detail: "Calcula vueltas y descuentos rápidos sin calculadora." },
      { label: "Costo por kilos", detail: "Multiplica precios por cantidad con precisión." },
      { label: "Secuencia de compra", detail: "Ordena pasos para resolver compras compuestas." },
    ],
  },
  {
    category: "Micros y horarios",
    icon: "bus-outline",
    items: [
      { label: "Tiempo transcurrido", detail: "Resta y suma minutos para llegar a tiempo." },
      { label: "Llegada estimada", detail: "Predice horarios según duración del trayecto." },
      { label: "Frecuencia", detail: "Calcula cuántas veces pasa una ruta en un periodo." },
    ],
  },
  {
    category: "Cancha, patio y medidas",
    icon: "shapes-outline",
    items: [
      { label: "Perímetro", detail: "Bordes, cercos y recorridos." },
      { label: "Área", detail: "Cobertura de piso, cancha o terreno." },
      { label: "Conversión", detail: "Pasa de cm a m sin perder contexto." },
    ],
  },
  {
    category: "Fracciones y porciones",
    icon: "pie-chart-outline",
    items: [
      { label: "Mitad y cuarto", detail: "Porciones exactas para cocina o reparto." },
      { label: "Duplicar receta", detail: "Aumenta ingredientes con lógica." },
      { label: "Reparto justo", detail: "Divide cantidades entre grupos." },
    ],
  },
];

const phases = [
  { title: "Fase 1 · Semillero", detail: "Introduce cálculo mental, cambio y totales básicos." },
  { title: "Fase 2 · Mercado", detail: "Activa compras, tiempo y lectura de datos simples." },
  { title: "Fase 3 · Ruta", detail: "Mezcla geometría, fracciones y lógica encadenada." },
  { title: "Fase 4 · Maestría", detail: "Exige secuencias, precisión y mejor control de error." },
];

export default function ChallengeScreen() {
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState<string | null>(challengeData[0].category);

  const toggleCategory = (category: string) => {
    setExpanded(expanded === category ? null : category);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Retos y fases</Text>
        <Text style={[styles.subtitle, { color: theme.textSoft }]}>
          Así se organiza la dificultad para que el progreso se sienta justo y creciente.
        </Text>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surfaceAccent }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>4</Text>
            <Text style={[styles.statLabel, { color: theme.primary }]}>modos de juego</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surfaceAccent }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>4</Text>
            <Text style={[styles.statLabel, { color: theme.primary }]}>fases base</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surfaceAccent }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>3★</Text>
            <Text style={[styles.statLabel, { color: theme.primary }]}>máximo por reto</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Fases de avance</Text>
          {phases.map((phase) => (
            <View key={phase.title} style={[styles.phaseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="layers-outline" size={20} color={theme.secondary} />
              <View style={styles.phaseContent}>
                <Text style={[styles.phaseTitle, { color: theme.text }]}>{phase.title}</Text>
                <Text style={[styles.phaseText, { color: theme.textSoft }]}>{phase.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Biblioteca de desafíos</Text>
          {challengeData.map((category) => (
            <View key={category.category} style={[styles.categoryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.category)}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={theme.text}
                />
                <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.category}</Text>
                <Text style={[styles.categoryCount, { color: theme.textSoft }]}>{category.items.length} retos</Text>
                <Ionicons
                  name={expanded === category.category ? "chevron-down" : "chevron-forward"}
                  size={18}
                  color={theme.textSoft}
                />
              </TouchableOpacity>

              {expanded === category.category && (
                <View style={[styles.itemsList, { backgroundColor: theme.surfaceMuted }]}>
                  {category.items.map((item) => (
                    <View key={item.label} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.itemLabel, { color: theme.text }]}>{item.label}</Text>
                      <Text style={[styles.itemDetail, { color: theme.textSoft }]}>{item.detail}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#dff7c8",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#58cc02",
  },
  statLabel: {
    fontSize: 11,
    color: "#4f8a1f",
    textAlign: "center",
    marginTop: 4,
  },
  phaseCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#173d32",
  },
  phaseText: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  categoryCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryCount: {
    fontSize: 12,
  },
  itemsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
  },
});
