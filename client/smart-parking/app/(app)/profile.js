import React from "react";
import { Redirect, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import useSession from "../../hooks/useSession";
import { theme } from "../../theme";

const DEBUG_PREFIX = "[ParkX FE][Profile]";

export default function ProfilePage() {
  const router = useRouter();
  const { isReady, isAuthenticated, userId, logout } = useSession();

  const onLogout = async () => {
    console.log(`${DEBUG_PREFIX} onLogout called`, { userId });
    await logout();
    console.log(`${DEBUG_PREFIX} logout success, redirecting to login`);
    router.replace("/login");
  };

  if (!isReady) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <View style={[theme.screen, styles.container]}>
      <View style={[theme.heroCard, styles.hero]}>
        <Text style={[theme.heading, styles.title]}>Account Console</Text>
        <Text style={styles.subtitle}>Your mobile parking profile and session access state.</Text>
      </View>

      <View style={[theme.card, styles.infoCard]}>
        <Text style={styles.label}>Signed-in user</Text>
        <Text style={styles.value}>User #{userId}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  hero: {
    gap: 8,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  infoCard: {
    padding: 18,
    gap: 6,
  },
  label: {
    color: theme.colors.textSoft,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  logoutBtn: {
    backgroundColor: theme.colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#2b1010",
    fontWeight: "800",
  },
});
