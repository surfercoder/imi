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
import { loginSchema } from "@/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { colors } from "@/components/ui/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
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
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>IMI</Text>
          </View>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>
            Ingresá tu email y contraseña para acceder
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

          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.showHide}>{showPassword ? "Ocultar" : "Ver"}</Text>
              </TouchableOpacity>
            }
          />

          <Link href="/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </Link>

          {error && <ErrorMessage message={error} />}

          <Button onPress={handleLogin} loading={loading} fullWidth>
            Iniciar sesión
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tenés cuenta? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Registrarse</Text>
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
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
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
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
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
});
