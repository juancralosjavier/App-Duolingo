import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface DuolingoHeaderProps {
  level?: number;
  xp?: number;
  hearts?: number;
}

export default function DuolingoHeader({ level = 1, xp = 0, hearts = 5 }: DuolingoHeaderProps) {
  const xpToNextLevel = level * 100;
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel * 100;

  return (
    <View style={styles.container}>
      {/* Nivel */}
      <View style={styles.levelContainer}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
          </View>
        </View>
      </View>

      {/* Hearts */}
      <View style={styles.heartsContainer}>
        <Text style={styles.heart}>❤️</Text>
        <Text style={styles.heartCount}>{hearts}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  levelContainer: {
    flex: 1,
    marginRight: 20,
  },
  levelBadge: {
    backgroundColor: "#58cc02",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  levelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  xpBarContainer: {
    width: "100%",
  },
  xpBar: {
    height: 12,
    backgroundColor: "#e5e5e5",
    borderRadius: 6,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: "#58cc02",
    borderRadius: 6,
  },
  heartsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffdfe0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heart: {
    fontSize: 16,
    marginRight: 4,
  },
  heartCount: {
    color: "#ff4b4b",
    fontWeight: "bold",
    fontSize: 16,
  },
});