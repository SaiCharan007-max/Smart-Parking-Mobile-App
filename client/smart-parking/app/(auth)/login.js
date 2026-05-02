import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import useSession from "../../hooks/useSession";
import { loginUser } from "../../services/authService";
import { useThemeMode } from "../../hooks/useThemeMode";

const DEBUG_PREFIX = "[ParkX FE][Login]";

export default function Login() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useSession();
  const { theme } = useThemeMode();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const handleLogin = async () => {
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    setError("");
    console.log(`${DEBUG_PREFIX} Attempting login`, { email: normalizedEmail });

    try {
      const data = await loginUser({ email: normalizedEmail, password });
      console.log(`${DEBUG_PREFIX} Login API returned`, {
        hasToken: Boolean(data?.token),
        userId: data?.userId,
      });
      await login(data.token, data.userId);
      console.log(`${DEBUG_PREFIX} Session updated, navigating to dashboard`);
      router.replace("/");
    } catch (err) {
      console.error(`${DEBUG_PREFIX} Login failed`, err?.message || err);
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[theme.screen, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[theme.screen, styles.container]}>
      <View style={styles.heroGlow} />
      <Text style={[theme.heading, styles.title]}>ParkX</Text>
      <Text style={styles.subtitle}>Access the parking operations dashboard.</Text>

      <View style={[theme.card, styles.form]}>
        <Text style={styles.formLabel}>Sign in</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSoft}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSoft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#092016" /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.linkText}>
          Need an account? <Text style={styles.link}>Create one</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    padding: 24,
  },
  heroGlow: {
    position: "absolute",
    top: 90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#12334a",
    opacity: 0.5,
  },
  title: {
    fontSize: 42,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: theme.colors.textMuted,
  },
  form: {
    padding: 20,
    gap: 12,
  },
  formLabel: {
    color: theme.colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: theme.colors.surfaceStrong,
    color: theme.colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  button: {
    marginTop: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#092016",
    fontWeight: "800",
    fontSize: 16,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: "center",
  },
  linkText: {
    marginTop: 20,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  link: {
    color: theme.colors.accent,
    fontWeight: "800",
  },
});
