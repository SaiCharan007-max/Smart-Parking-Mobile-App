import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AvailableParkingSlots(props) {
  return (
    <TouchableOpacity style={styles.mainBlock} onPress={props.func}>
      <View style={styles.innerBlock}>
        <Text style={styles.text}>{props.text}</Text>

        <View style={styles.slotInfo}>
          <Text style={styles.total}>
            Total Slots: {props.totalSlots}
          </Text>

          <Text style={styles.available}>
            • Available: {props.availableSlots}
          </Text>

          <Text style={styles.occupied}>
            • Occupied: {props.totalSlots - props.availableSlots}
          </Text>
        </View>
      </View>

      <View style={styles.arrowBlock}>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mainBlock: {
    backgroundColor: "#1c2541",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },

  innerBlock: {
    flex: 10,
    gap: 6,
  },

  arrowBlock: {
    flex: 1,
    alignItems: "center",
  },

  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },

  slotInfo: {
    flexDirection: "row",
    gap: 10,
  },

  total: {
    color: "#e5e7eb",
    fontSize: 13,
  },

  available: {
    color: "#22c55e",
    fontSize: 13,
  },

  occupied: {
    color: "#ef4444",
    fontSize: 13,
  },
});
