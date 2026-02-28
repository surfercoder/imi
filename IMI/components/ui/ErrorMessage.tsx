import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "./colors";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.destructiveLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    color: colors.destructive,
    fontSize: 14,
  },
});
