import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";

const challengeData = [
  { category: "Mercado Abasto", icon: "🛒", items: [
    { label: "Cambio exacto", detail: "Si pagas Bs 100 y gastas Bs 67, recibes Bs 33." },
    { label: "Costo por kilos", detail: "2 kg a Bs 9 cada uno cuestan Bs 18." },
    { label: "Descuento simple", detail: "10% de Bs 80 equivale a Bs 8." },
  ]},
  { category: "Micros y trufis", icon: "🚌", items: [
    { label: "Tiempo transcurrido", detail: "De 07:20 a 07:55 pasan 35 minutos." },
    { label: "Llegada estimada", detail: "Si sales 08:10 y viajas 25 min, llegas 08:35." },
    { label: "Frecuencia", detail: "Si el micro pasa cada 12 min, en una hora pasa 5 veces." },
  ]},
  { category: "Cancha y patio", icon: "📐", items: [
    { label: "Perímetro", detail: "Un patio de 8 por 5 m tiene perímetro de 26 m." },
    { label: "Área", detail: "Una cancha de 20 por 10 m cubre 200 m²." },
    { label: "Escala", detail: "Si 1 cm representa 1 m, 6 m se dibujan con 6 cm." },
  ]},
  { category: "Cocina y porciones", icon: "🍲", items: [
    { label: "Medias y cuartos", detail: "La mitad de 12 panes son 6 panes." },
    { label: "Duplicar receta", detail: "Si una receta usa 3 tazas, al duplicar usas 6." },
    { label: "Fracciones útiles", detail: "1/4 de 20 es 5." },
  ]},
  { category: "Clima y datos", icon: "📊", items: [
    { label: "Comparar temperaturas", detail: "32°C es 4 grados más que 28°C." },
    { label: "Promedios simples", detail: "Si tus puntajes son 8, 9 y 7, el promedio es 8." },
    { label: "Lectura rápida", detail: "Si un gráfico sube de 5 a 9, aumentó 4 unidades." },
  ]},
];

export default function ChallengeScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpanded(expanded === category ? null : category);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Desafíos guía</Text>
        <Text style={styles.subtitle}>Ideas base para practicar matemáticas útiles</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>retos{'\n'}modelo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>contextos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>orientado{'\n'}a la vida real</Text>
          </View>
        </View>

        {challengeData.map((category) => (
          <View key={category.category} style={styles.categoryCard}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.category)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              <Text style={styles.categoryCount}>{category.items.length} retos</Text>
              <Text style={styles.arrow}>{expanded === category.category ? "▼" : "›"}</Text>
            </TouchableOpacity>

            {expanded === category.category && (
              <View style={styles.itemsList}>
                {category.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDetail}>{item.detail}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#dff7c8",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#58cc02",
  },
  statLabel: {
    fontSize: 10,
    color: "#58cc02",
    textAlign: "center",
    marginTop: 4,
  },
  categoryCard: {
    backgroundColor: "#f7fafb",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ebf0f2",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryCount: {
    fontSize: 12,
    color: "#777",
    marginRight: 8,
  },
  arrow: {
    fontSize: 18,
    color: "#777",
  },
  itemsList: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 14,
    color: "#777",
  },
});
