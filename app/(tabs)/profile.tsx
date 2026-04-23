import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getUserProfile } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

interface User {
  id: number;
  name: string;
  email: string;
  xp: number;
  hearts: number;
  streak: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user: sessionUser, signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadProfile();
  }, [sessionUser]);

  const loadProfile = async () => {
    try {
      if (sessionUser?.id) {
        const data = await getUserProfile(sessionUser.id);
        setUser(data);
      } else {
        setUser({ id: 0, name: "Estudiante MateCamba", email: "demo@matecamba.bo", xp: 245, hearts: 5, streak: 3 });
      }
    } catch (error) {
      console.log(error);
      setUser({ id: 0, name: "Estudiante MateCamba", email: "demo@matecamba.bo", xp: 245, hearts: 5, streak: 3 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Cerrar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await signOut();
              router.replace("/login");
            } catch (error) {
              console.log(error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58cc02" />
      </View>
    );
  }

  const level = user ? Math.floor(user.xp / 100) + 1 : 1;
  const xpProgress = user ? user.xp % 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || "Usuario"}</Text>
        <Text style={styles.userEmail}>{user?.email || "usuario@email.com"}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{level}</Text>
          <Text style={styles.statLabel}>Nivel</Text>
        </View>
        
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user?.xp || 0}</Text>
          <Text style={styles.statLabel}>XP Total</Text>
        </View>
        
        <View style={styles.statBox}>
          <View style={styles.heartsRow}>
            <Text style={styles.heartIcon}>❤️</Text>
            <Text style={styles.statValue}>{user?.hearts || 5}</Text>
          </View>
          <Text style={styles.statLabel}>Corazones</Text>
        </View>
      </View>

      <View style={styles.xpSection}>
        <Text style={styles.xpLabel}>Progreso al siguiente nivel</Text>
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpBar, { width: `${xpProgress}%` }]} />
        </View>
        <Text style={styles.xpText}>{xpProgress}/100 XP</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>🔥 Racha actual</Text>
          <Text style={styles.statRowValue}>{user?.streak || 0} días</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statRowLabel}>📚 Lecciones completadas</Text>
          <Text style={styles.statRowValue}>{Math.floor((user?.xp || 0) / 10)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enfoque personal</Text>
        
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>🔔</Text>
          <Text style={styles.optionText}>Recordatorios de práctica</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>🎯</Text>
          <Text style={styles.optionText}>Meta diaria de retos</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionCard}>
          <Text style={styles.optionIcon}>⚙️</Text>
          <Text style={styles.optionText}>Configuración local</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2493ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#777",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#58cc02",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heartIcon: {
    fontSize: 16,
  },
  xpSection: {
    marginBottom: 24,
  },
  xpLabel: {
    fontSize: 14,
    color: "#777",
    marginBottom: 8,
  },
  xpBarContainer: {
    height: 12,
    backgroundColor: "#e5e5e5",
    borderRadius: 6,
    overflow: "hidden",
  },
  xpBar: {
    height: "100%",
    backgroundColor: "#58cc02",
    borderRadius: 6,
  },
  xpText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statRowLabel: {
    fontSize: 14,
    color: "#333",
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#58cc02",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  arrow: {
    fontSize: 20,
    color: "#ccc",
  },
  logoutButton: {
    backgroundColor: "#ffdfe0",
    padding: 18,
    borderRadius: 16,
    marginBottom: 40,
  },
  logoutText: {
    color: "#ff4b4b",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
