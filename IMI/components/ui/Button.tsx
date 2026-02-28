import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from "react-native";
import { colors } from "./colors";

type Variant = "primary" | "outline" | "ghost" | "destructive" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? colors.primary : colors.white}
        />
      ) : (
        <View style={styles.content}>
          {typeof children === "string" ? (
            <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  success: {
    backgroundColor: colors.success,
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  text: {
    fontWeight: "600",
  },
  primaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.foreground,
  },
  ghostText: {
    color: colors.foreground,
  },
  destructiveText: {
    color: colors.white,
  },
  successText: {
    color: colors.white,
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 16,
  },
});
