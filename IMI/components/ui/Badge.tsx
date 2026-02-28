import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors } from "./colors";

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ children, variant = "default", style, textStyle }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
  default: {
    backgroundColor: colors.primaryLight,
  },
  defaultText: {
    color: colors.primary,
  },
  secondary: {
    backgroundColor: colors.mutedBg,
  },
  secondaryText: {
    color: colors.muted,
  },
  destructive: {
    backgroundColor: colors.destructiveLight,
  },
  destructiveText: {
    color: colors.destructive,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  successText: {
    color: colors.success,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  warningText: {
    color: colors.warning,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.foreground,
  },
});
