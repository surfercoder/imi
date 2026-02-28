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
import { Link, router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { forgotPasswordSchema } from "@/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { colors } from "@/components/ui/colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/verify?type=recovery&redirect_to=imi://reset-password`,
      }
    );
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✉</Text>
        </View>
        <Text style={styles.successTitle}>Revisá tu correo</Text>
        <Text style={styles.successText}>
          Si existe una cuenta con ese correo, te enviamos un enlace para
          restablecer tu contraseña. Expira en 1 hora.
        </Text>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.backToLogin}>
            <Text style={styles.backToLoginText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🔑</Text>
          </View>
          <Text style={styles.title}>Olvidé mi contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresá tu correo y te enviaremos un enlace para restablecerla
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Correo electrónico"
            placeholder="doctor@hospital.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          {error && <ErrorMessage message={error} />}

          <Button onPress={handleSubmit} loading={loading} fullWidth>
            Enviar enlace
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Recordás tu contraseña? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  backButton: {
    position: "absolute",
    top: 16,
    left: 0,
    padding: 4,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.blueLight,
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
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    color: colors.muted,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: colors.background,
    gap: 16,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconText: {
    fontSize: 28,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  successText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  backToLogin: {
    marginTop: 8,
  },
  backToLoginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
