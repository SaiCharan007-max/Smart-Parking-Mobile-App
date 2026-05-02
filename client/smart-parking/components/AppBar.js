import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import DropDownMenu from "./DropDownMenu";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../hooks/useThemeMode";
import logo from "../assets/images/image.png";

export default function AppBar() {
    const [menuVisible, setMenuVisible] = useState(false);
    const router = useRouter();
    const { theme } = useThemeMode();

    function onClose() {
        setMenuVisible(false);
    }

    const goHome = () => {
        router.replace("/");
    };

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <View style={styles.appBar}>
            <TouchableOpacity style={styles.left} activeOpacity={0.8} onPress={goHome}>
                <View style={styles.logoBadge}>
                    <Image 
                        source={logo}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.middle} activeOpacity={0.8} onPress={goHome}>
                <Text style={styles.text}>ParkX</Text>
                <Text style={styles.subtext}>Smart Parking</Text>
            </TouchableOpacity>
            <View style={styles.right}>
                <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
                    <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
                </TouchableOpacity>

                <DropDownMenu visible={menuVisible} onClose={onClose} />
            </View>
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    appBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        height: 72,
        width: "100%",
        backgroundColor: theme.colors.surfaceMuted,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    left: {
        flex: 1,
        justifyContent: "center",
        alignItems: "flex-start",
    },
    middle: {
        flex: 3,
        justifyContent: "center",
        alignItems: "flex-start",
        paddingLeft: 8,
    },
    right: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    menuButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceStrong,
        alignItems: "center",
        justifyContent: "center",
    },
    logoBadge: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: theme.colors.surfaceStrong,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    logoImage: {
        width: 48,
        height: 48,
    },
    text: {
        fontSize: 22,
        fontWeight: "800",
        color: theme.colors.text,
    },
    subtext: {
        marginTop: 1,
        color: theme.colors.textSoft,
        fontSize: 11,
        letterSpacing: 1.1,
        textTransform: "uppercase",
    }
});
