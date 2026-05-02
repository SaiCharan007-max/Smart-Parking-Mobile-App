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
  Alert,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import useSession from "../../hooks/useSession";
import { registerUser } from "../../services/authService";
import { useThemeMode } from "../../hooks/useThemeMode";

const DEBUG_PREFIX = "[ParkX FE][Register]";

export default function Register() {
  const router = useRouter();
  const { isLoading, isAuthenticated, login } = useSession();
  const { theme } = useThemeMode();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const handleRegister = async () => {
    if (submitting) return;

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password.trim()) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    setError("");
    console.log(`${DEBUG_PREFIX} Attempting register`, {
      username: normalizedUsername,
      email: normalizedEmail,
    });

    try {
      const response = await registerUser({
        username: normalizedUsername,
        email: normalizedEmail,
        password,
      });
      const authData = response?.data || response;
      console.log(`${DEBUG_PREFIX} Register API returned`, {
        hasToken: Boolean(authData?.token),
        userId: authData?.userId,
      });
      
      // Auto-login since the backend now returns a token on register
      if (authData?.token) {
        await login(authData.token, authData.userId);
        console.log(`${DEBUG_PREFIX} Auto-login successful, navigating to dashboard`);
        router.replace("/");
      } else {
        // Fallback just in case
        console.warn(`${DEBUG_PREFIX} Token missing in register response, redirecting to login`);
        Alert.alert("Success", "Registration complete. Please log in.");
        router.replace("/login");
      }
    } catch (err) {
      console.error(`${DEBUG_PREFIX} Register failed`, err?.message || err);
      setError(err?.message || "Registration failed. Please try again.");
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
      <Text style={[theme.heading, styles.title]}>Create Access</Text>
      <Text style={styles.subtitle}>Set up your ParkX operator account.</Text>

      <View style={[theme.card, styles.form]}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={theme.colors.textSoft}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
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

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleRegister} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#092016" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.linkText}>
          Already registered? <Text style={styles.link}>Sign in</Text>
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
  title: {
    fontSize: 34,
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
