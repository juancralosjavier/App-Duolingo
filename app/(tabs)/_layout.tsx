import React from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { getLevelFromXp, getPhaseLabel } from "../../constants/learning";
import { HapticTab } from "../../components/haptic-tab";
import { useAppTheme } from "../../hooks/useAppTheme";

function TabIcon({
  icon,
  label,
  focused,
  activeColor,
  inactiveColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <View style={styles.tabItem}>
      <Ionicons name={icon} size={22} color={focused ? activeColor : inactiveColor} />
      <Text style={[styles.label, { color: focused ? activeColor : inactiveColor }, focused && styles.labelFocused]}>
        {label}
      </Text>
    </View>
  );
}

function MateHeader() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const activeUser = user || {
    xp: 245,
    hearts: 5,
    streak: 3,
    dailyGoal: 3,
  };
  const level = getLevelFromXp(activeUser.xp);
  const phase = getPhaseLabel(level);

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={styles.brandBlock}>
        <Text style={[styles.brandTitle, { color: theme.primary }]}>MateCamba</Text>
        <Text style={[styles.brandSubtitle, { color: theme.textSoft }]}>{phase}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={styles.levelText}>Lv {level}</Text>
        </View>
        <View style={[styles.headerPill, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="flame" size={14} color="#ff9600" />
          <Text style={[styles.headerPillText, { color: theme.text }]}>{activeUser.streak}</Text>
        </View>
        <View style={[styles.headerPill, { backgroundColor: theme.surfaceMuted }]}>
          <Ionicons name="heart" size={14} color="#ef4f7f" />
          <Text style={[styles.headerPillText, { color: theme.text }]}>{activeUser.hearts}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MateHeader />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
          ],
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon="home-outline"
                label="Inicio"
                focused={focused}
                activeColor={theme.primary}
                inactiveColor={theme.textSoft}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon="game-controller-outline"
                label="Juegos"
                focused={focused}
                activeColor={theme.primary}
                inactiveColor={theme.textSoft}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="vocab"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon="trophy-outline"
                label="Retos"
                focused={focused}
                activeColor={theme.primary}
                inactiveColor={theme.textSoft}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon="person-outline"
                label="Perfil"
                focused={focused}
                activeColor={theme.primary}
                inactiveColor={theme.textSoft}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  brandBlock: {
    flex: 1,
    paddingRight: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  levelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerPillText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  tabBar: {
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
  },
  labelFocused: {
    fontWeight: "bold",
  },
});
