import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { resetPasswordSchema } from "@/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { colors } from "@/components/ui/colors";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🔒</Text>
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>
            Elegí una contraseña segura para tu cuenta
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nueva contraseña"
            placeholder="Mín. 8 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.showHide}>
                  {showPassword ? "Ocultar" : "Ver"}
                </Text>
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirmar nueva contraseña"
            placeholder="Repetí tu nueva contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
            rightElement={
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                <Text style={styles.showHide}>
                  {showConfirm ? "Ocultar" : "Ver"}
                </Text>
              </TouchableOpacity>
            }
          />

          {error && <ErrorMessage message={error} />}

          <Button onPress={handleReset} loading={loading} fullWidth>
            Actualizar contraseña
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  showHide: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
});
