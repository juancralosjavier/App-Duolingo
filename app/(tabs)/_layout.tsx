import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../hooks/useAuth";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

function MateHeader() {
  const { user } = useAuth();
  const activeUser = user || { xp: 245, hearts: 5, streak: 3 };
  const level = Math.floor(activeUser.xp / 100) + 1;

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brandTitle}>MateCamba</Text>
        <Text style={styles.brandSubtitle}>Santa Cruz en modo reto</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv {level}</Text>
        </View>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>🔥 {activeUser.streak}</Text>
        </View>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>❤️ {activeUser.hearts}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <MateHeader />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Inicio" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="⚡" label="Practica" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="vocab"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🧩" label="Retos" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Perfil" focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#58cc02",
  },
  brandSubtitle: {
    color: "#7d8b92",
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelBadge: {
    backgroundColor: "#58cc02",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  headerPill: {
    backgroundColor: "#f4f7f8",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerPillText: {
    color: "#425466",
    fontWeight: "bold",
    fontSize: 14,
  },
  tabBar: {
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 10,
    color: "#777",
  },
  labelFocused: {
    color: "#58cc02",
    fontWeight: "bold",
  },
});
