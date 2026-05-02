import React from "react";
import { Text, Image, StyleSheet, TouchableOpacity } from "react-native";

export default function ModifiedButton(props) {
  return (
    <TouchableOpacity style={styles.container} onPress={props.onPress}>
      <Image source={props.img} style={styles.logo} />
      <Text style={styles.text}>{props.text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#1c2541",
    borderRadius: 10,
  },

  logo: {
    width: 28,
    height: 28,
    borderRadius: 15,
    marginRight: 12,
  },

  text: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});
