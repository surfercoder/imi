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
import { createPatient, createInforme } from "@/services/informes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { colors } from "@/components/ui/colors";

export default function NuevoInformeScreen() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (phone.trim().length < 6) {
      setError("Ingresá un número de teléfono válido");
      return;
    }

    setLoading(true);

    const patientResult = await createPatient({
      name: name.trim(),
      dob: dob.trim() || null,
      phone: phone.trim(),
      email: email.trim() || null,
    });

    if (patientResult.error || !patientResult.data) {
      setError(patientResult.error ?? "Error al crear el paciente");
      setLoading(false);
      return;
    }

    const informeResult = await createInforme(patientResult.data.id);
    if (informeResult.error || !informeResult.data) {
      setError(informeResult.error ?? "Error al crear el informe");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace(`/grabar/${informeResult.data.id}` as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Informe</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Ingresá los datos del paciente para comenzar la consulta.
        </Text>

        <View style={styles.form}>
          <Input
            label="Nombre completo *"
            placeholder="Ej: María García"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Fecha de nacimiento"
            placeholder="AAAA-MM-DD"
            value={dob}
            onChangeText={setDob}
            hint="Formato: 1980-05-23"
          />

          <Input
            label="Teléfono (WhatsApp) *"
            placeholder="Ej: +54 9 261 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            hint="El informe del paciente se enviará a este número por WhatsApp."
          />

          <Input
            label="Email (opcional)"
            placeholder="paciente@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {error && <ErrorMessage message={error} />}

          <View style={styles.buttons}>
            <Button
              variant="outline"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.flex1}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSubmit}
              loading={loading}
              style={styles.flex1}
            >
              Iniciar consulta
            </Button>
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
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    minWidth: 60,
  },
  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.foreground,
  },
  headerSpacer: {
    minWidth: 60,
  },
  scroll: {
    padding: 20,
    gap: 0,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
});
