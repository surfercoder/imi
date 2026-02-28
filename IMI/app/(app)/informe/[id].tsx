import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { getInforme, getPdfSignedUrl } from "@/services/informes";
import { colors } from "@/components/ui/colors";
import { InformeWithPatient } from "@/types/database";

const statusConfig = {
  recording: { label: "Grabando", color: colors.warning, bg: colors.warningLight, icon: "🎙" },
  processing: { label: "Procesando", color: colors.blue, bg: colors.blueLight, icon: "⏳" },
  completed: { label: "Completado", color: colors.emerald, bg: colors.emeraldLight, icon: "✓" },
  error: { label: "Error", color: colors.destructive, bg: colors.destructiveLight, icon: "⚠" },
};

export default function InformeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [informe, setInforme] = useState<InformeWithPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const fetchInforme = useCallback(async () => {
    if (!id) return;
    const result = await getInforme(id);
    if (result.data) {
      const data = result.data as InformeWithPatient;
      setInforme(data);

      if (data.status === "recording") {
        router.replace(`/grabar/${id}` as any);
        return;
      }

      if (data.pdf_path) {
        const url = await getPdfSignedUrl(data.pdf_path);
        setPdfUrl(url);
      }
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchInforme();
    }, [fetchInforme])
  );

  const getPatientAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birth = new Date(dob + "T00:00:00");
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleWhatsApp = () => {
    if (!informe?.patients || !pdfUrl) return;
    const phone = informe.patients.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${informe.patients.name}, le enviamos su informe medico de la consulta de hoy.\n\nPuede descargarlo aqui: ${pdfUrl}\n\nAnte cualquier duda, no dude en contactarnos.`
    );
    const url = `https://wa.me/${phone}?text=${message}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir WhatsApp"));
  };

  const handleOpenPdf = () => {
    if (!pdfUrl) return;
    Linking.openURL(pdfUrl).catch(() => Alert.alert("Error", "No se pudo abrir el PDF"));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!informe) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Informe no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusConfig[informe.status as keyof typeof statusConfig] ?? statusConfig.error;
  const patient = informe.patients;
  const dobFormatted = patient?.dob
    ? new Date(patient.dob + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;
  const age = getPatientAge(patient?.dob ?? null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {patient?.name ?? "Informe"}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.metaRow}>
          <Text style={styles.metaTitle}>Informe de consulta</Text>
          <Text style={styles.metaDate}>🕐 {formatDate(informe.created_at)}</Text>
        </View>

        {informe.status === "completed" && (
          <View style={styles.actionsRow}>
            {pdfUrl && (
              <TouchableOpacity style={styles.outlineBtn} onPress={handleOpenPdf}>
                <Text style={styles.outlineBtnText}>📄 Ver PDF</Text>
              </TouchableOpacity>
            )}
            {pdfUrl && (
              <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
                <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.patientCard}>
          <View style={styles.patientAvatar}>
            <Text style={styles.patientAvatarText}>
              {patient?.name?.[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.name ?? "Desconocido"}</Text>
            <View style={styles.patientMetas}>
              {patient?.phone && (
                <Text style={styles.patientMeta}>📞 {patient.phone}</Text>
              )}
              {dobFormatted && (
                <Text style={styles.patientMeta}>
                  📅 {dobFormatted}{age !== null ? ` (${age} años)` : ""}
                </Text>
              )}
              {patient?.email && (
                <Text style={styles.patientMeta}>✉ {patient.email}</Text>
              )}
            </View>
          </View>
        </View>

        {informe.status === "processing" && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
            <Text style={styles.processingTitle}>Generando informes...</Text>
            <Text style={styles.processingSubtitle}>
              La IA esta analizando la consulta. Esto puede tomar unos momentos.
            </Text>
          </View>
        )}

        {informe.status === "error" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠</Text>
            <Text style={styles.errorTitle}>Error al procesar</Text>
            <Text style={styles.errorSubtitle}>
              Ocurrio un error al generar los informes. Por favor intente nuevamente.
            </Text>
          </View>
        )}

        {informe.status === "completed" && (
          <>
            <View style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={[styles.reportIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.reportIcon}>🩺</Text>
                </View>
                <View>
                  <Text style={styles.reportTitle}>Informe medico</Text>
                  <Text style={styles.reportSubtitle}>Para el doctor</Text>
                </View>
              </View>
              <Text style={styles.reportContent}>
                {informe.informe_doctor || "Sin contenido"}
              </Text>
            </View>

            <View style={styles.reportCard}>
              <View style={[styles.reportHeader, { backgroundColor: colors.emeraldLight }]}>
                <View style={[styles.reportIconContainer, { backgroundColor: "#BBF7D0" }]}>
                  <Text style={styles.reportIcon}>💬</Text>
                </View>
                <View>
                  <Text style={styles.reportTitle}>Informe para el paciente</Text>
                  <Text style={styles.reportSubtitle}>Se enviara por WhatsApp</Text>
                </View>
              </View>
              <Text style={styles.reportContent}>
                {informe.informe_paciente || "Sin contenido"}
              </Text>
            </View>
          </>
        )}

        {informe.transcript && (
          <View style={styles.transcriptCard}>
            <TouchableOpacity
              style={styles.transcriptToggle}
              onPress={() => setShowTranscript((v) => !v)}
            >
              <Text style={styles.transcriptToggleText}>📝 Ver transcripcion completa</Text>
              <Text style={styles.transcriptToggleIcon}>{showTranscript ? "▲" : "▼"}</Text>
            </TouchableOpacity>
            {showTranscript && (
              <View style={styles.transcriptContent}>
                <Text style={styles.transcriptText}>{informe.transcript}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.muted,
  },
  backLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexShrink: 0,
  },
  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "500",
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  metaRow: {
    gap: 4,
  },
  metaTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  metaDate: {
    fontSize: 13,
    color: colors.muted,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  outlineBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },
  whatsappBtn: {
    backgroundColor: colors.whatsapp,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  patientAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  patientInfo: {
    flex: 1,
    gap: 4,
  },
  patientName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  patientMetas: {
    gap: 2,
  },
  patientMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  processingCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  spinner: {
    marginBottom: 4,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  processingSubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: colors.destructiveLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.destructive,
  },
  errorSubtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  reportCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: colors.mutedBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reportIcon: {
    fontSize: 18,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  reportSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  reportContent: {
    padding: 14,
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 21,
  },
  transcriptCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  transcriptToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  transcriptToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  transcriptToggleIcon: {
    fontSize: 13,
    color: colors.muted,
  },
  transcriptContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 14,
  },
  transcriptText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
});
