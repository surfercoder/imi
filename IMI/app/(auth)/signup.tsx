import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/utils/supabase";
import { signupSchema, ESPECIALIDADES } from "@/schemas/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { colors } from "@/components/ui/colors";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matricula, setMatricula] = useState("");
  const [phone, setPhone] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [especialidadModal, setEspecialidadModal] = useState(false);
  const [especialidadSearch, setEspecialidadSearch] = useState("");

  const filteredEspecialidades = ESPECIALIDADES.filter((e) =>
    e.toLowerCase().includes(especialidadSearch.toLowerCase())
  );

  const handleSignup = async () => {
    setError(null);
    const parsed = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
      matricula,
      phone,
      especialidad,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          matricula: parsed.data.matricula,
          phone: parsed.data.phone,
          especialidad: parsed.data.especialidad,
        },
      },
    });
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
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Revisá tu correo</Text>
        <Text style={styles.successText}>
          Te enviamos un enlace de confirmación. Hacé clic en él para activar tu
          cuenta.
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
    <>
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
            <Text style={styles.title}>Crear una cuenta</Text>
            <Text style={styles.subtitle}>
              Registrate como médico para acceder a la plataforma
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
              label="Matrícula"
              placeholder="Ej: 123456"
              value={matricula}
              onChangeText={setMatricula}
              keyboardType="numeric"
            />

            <Input
              label="Teléfono"
              placeholder="Ej: +54 11 1234-5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Especialidad</Text>
              <TouchableOpacity
                style={[
                  styles.combobox,
                  especialidad ? null : styles.comboboxEmpty,
                ]}
                onPress={() => setEspecialidadModal(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.comboboxText,
                    !especialidad && styles.comboboxPlaceholder,
                  ]}
                  numberOfLines={1}
                >
                  {especialidad || "Seleccioná tu especialidad"}
                </Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Contraseña"
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
              label="Confirmar contraseña"
              placeholder="Repetí tu contraseña"
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

            <Button onPress={handleSignup} loading={loading} fullWidth>
              Crear cuenta
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Iniciar sesión</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={especialidadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEspecialidadModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccioná tu especialidad</Text>
            <TouchableOpacity onPress={() => setEspecialidadModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar especialidad..."
              placeholderTextColor={colors.muted}
              value={especialidadSearch}
              onChangeText={setEspecialidadSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredEspecialidades}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.especialidadItem,
                  item === especialidad && styles.especialidadItemSelected,
                ]}
                onPress={() => {
                  setEspecialidad(item);
                  setEspecialidadSearch("");
                  setEspecialidadModal(false);
                }}
              >
                <Text
                  style={[
                    styles.especialidadText,
                    item === especialidad && styles.especialidadTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {item === especialidad && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
    </>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
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
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  combobox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  comboboxEmpty: {},
  comboboxText: {
    flex: 1,
    fontSize: 15,
    color: colors.foreground,
  },
  comboboxPlaceholder: {
    color: colors.muted,
  },
  chevron: {
    fontSize: 14,
    color: colors.muted,
    marginLeft: 8,
  },
  showHide: {
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
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconText: {
    fontSize: 28,
    color: colors.success,
    fontWeight: "700",
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.foreground,
  },
  modalClose: {
    fontSize: 17,
    color: colors.muted,
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.mutedBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: colors.foreground,
  },
  especialidadItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  especialidadItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  especialidadText: {
    fontSize: 15,
    color: colors.foreground,
    flex: 1,
  },
  especialidadTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "700",
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
});
