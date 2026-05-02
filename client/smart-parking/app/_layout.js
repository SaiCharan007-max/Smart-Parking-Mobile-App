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
            paddingVertical: isWeb ? 24 : 0,
            paddingHorizontal: isWeb ? 12 : 0,
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
  },
  shell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 30,
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  shellWeb: {
    flex: 0,
    width: "100%",
    maxWidth: 408,
    minHeight: 860,
    height: "100%",
    maxHeight: 920,
    borderRadius: 36,
  },
  shellNative: {
    maxWidth: undefined,
    width: undefined,
    minHeight: undefined,
    maxHeight: undefined,
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
