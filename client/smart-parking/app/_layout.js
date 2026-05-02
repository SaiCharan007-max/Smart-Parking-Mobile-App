import { Stack, usePathname } from "expo-router";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBar from "../components/AppBar.js";
import { useFonts } from "expo-font";
import { SessionProvider } from "../hooks/useSession";
import { ThemeModeProvider, useThemeMode } from "../hooks/useThemeMode";

function Shell() {
  const pathname = usePathname();
  const { theme, mode, isReady } = useThemeMode();

  const loadHeader = !(pathname === "/login" || pathname === "/register");

  const [fontsLoaded] = useFonts({
    "Orbitron-Regular": require("../assets/fonts/Orbitron-VariableFont_wght.ttf"),
  });

  if (!fontsLoaded || !isReady) {
    return null; // or a loading spinner
  }

  const isWeb = Platform.OS === "web";

  return (
    <SessionProvider>
      <View
        style={[
          styles.root,
          {
            backgroundColor: isWeb ? theme.colors.surfaceStrong : theme.colors.background,
            paddingVertical: isWeb ? "2%" : 0,
            alignItems: isWeb ? "center" : undefined,
            justifyContent: isWeb ? "center" : undefined,
          },
        ]}
      >
        <View
          style={[
            styles.shell,
            isWeb
              ? [
                  styles.shellWeb,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    shadowColor: "#000000",
                  },
                ]
              : styles.shellNative,
          ]}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar barStyle={mode === "light" ? "dark-content" : "light-content"} />
            {loadHeader && <AppBar />}
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
                animation: "none",
              }}
            />
          </SafeAreaView>
        </View>
      </View>
    </SessionProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <Shell />
    </ThemeModeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: "100vh",
  },
  shell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  shellWeb: {
    width: "100%",
    maxWidth: 480,
    height: "100%",
    maxHeight: 920,
    borderWidth: 1,
    borderRadius: 24,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shellNative: {
    width: "100%",
    height: "100%",
  },
});
