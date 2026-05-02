import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import useSession from "../hooks/useSession";
import { useThemeMode } from "../hooks/useThemeMode";

export default function DropDownMenu({ visible, onClose }) {
  const router = useRouter();
  const { logout } = useSession();
  const { theme, toggleMode, mode } = useThemeMode();

  function goTo(route) {
    onClose();
    router.push(route);
  }

  async function handleLogout() {
    await logout();
    onClose();
    router.dismissAll();
    router.replace("/login");
  }

  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const menuItems = (
    <>
      <TouchableOpacity style={styles.item} onPress={() => { toggleMode(); onClose(); }}>
        <Text style={styles.text}>Switch to {mode === "dark" ? "Light" : "Dark"} Mode</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => goTo("/profile")}>
        <Text style={styles.text}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => goTo("/history")}>
        <Text style={styles.text}>History</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={handleLogout}>
        <Text style={styles.text}>Logout</Text>
      </TouchableOpacity>
    </>
  );

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          {menuItems}
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 10,
    backgroundColor: "rgba(3, 10, 18, 0.35)",
  },

  menu: {
    width: 180,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 6,
  },

  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  text: {
    color: theme.colors.text,
    fontSize: 15,
  },
});
