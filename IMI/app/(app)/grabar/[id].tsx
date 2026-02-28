import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AppState,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import { getInforme, uploadAudio, processInformeWithAI, updateInformeStatus } from "@/services/informes";
import { colors } from "@/components/ui/colors";
import { useAuth } from "@/context/AuthContext";

type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped"
  | "uploading"
  | "processing"
  | "done"
  | "error";

interface PatientInfo {
  name: string;
  phone: string;
  dob: string | null;
  email: string | null;
}

export default function GrabarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    getInforme(id).then((result) => {
      if (result.data) {
        const p = (result.data as any).patients;
        setPatient(p ?? null);
        if (result.data.status === "completed") {
          router.replace(`/informe/${id}` as any);
        }
      }
      setLoadingPatient(false);
    });
  }, [id]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" && state === "recording") {
        stopAndProcess();
      }
    });
    return () => sub.remove();
  }, [state]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  }, [stopTimer]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError(null);
    setState("requesting");

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setError("Permiso de micrófono denegado. Por favor, habilitá el acceso al micrófono.");
        setState("error");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      durationRef.current = 0;
      setDuration(0);
      setState("recording");
      startTimer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar la grabación";
      setError(msg);
      setState("error");
    }
  };

  const pauseRecording = async () => {
    if (recordingRef.current && state === "recording") {
      await recordingRef.current.pauseAsync();
      stopTimer();
      setState("paused");
    }
  };

  const resumeRecording = async () => {
    if (recordingRef.current && state === "paused") {
      await recordingRef.current.startAsync();
      startTimer();
      setState("recording");
    }
  };

  const stopAndProcess = async () => {
    if (!id || !user) return;
    stopTimer();

    try {
      setState("stopped");
      let audioUri: string | undefined;
      let mimeType = "audio/m4a";

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        audioUri = recordingRef.current.getURI() ?? undefined;
        const status = await recordingRef.current.getStatusAsync();
        if ((status as any).uri) {
          mimeType = "audio/m4a";
        }
        recordingRef.current = null;
      }

      setState("uploading");
      setProgress(20);
      setProgressLabel("Subiendo grabación...");

      let audioPath: string | undefined;
      if (audioUri) {
        const uploadResult = await uploadAudio(user.id, id, audioUri, mimeType);
        if (uploadResult.path) {
          audioPath = uploadResult.path;
        }
      }

      setProgress(50);
      setState("processing");
      setProgressLabel("Analizando consulta con IA...");

      const transcript =
        `Grabación de audio de ${formatDuration(durationRef.current)} minutos. ` +
        `Consulta médica realizada el ${new Date().toLocaleDateString("es-AR")}.`;

      setProgress(70);
      setProgressLabel("Generando informes...");

      const result = await processInformeWithAI(id, transcript, audioPath);

      setProgress(100);

      if (result.error) {
        setError(result.error);
        setState("error");
      } else {
        setState("done");
        setTimeout(() => {
          router.replace(`/informe/${id}` as any);
        }, 1500);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al procesar";
      setError(msg);
      setState("error");
      await updateInformeStatus(id, "error");
    }
  };

  const confirmStop = () => {
    Alert.alert(
      "Finalizar consulta",
      "¿Estás seguro de que querés finalizar y procesar la consulta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Finalizar", style: "destructive", onPress: stopAndProcess },
      ]
    );
  };

  const resetRecorder = () => {
    setState("idle");
    setError(null);
    setDuration(0);
    durationRef.current = 0;
    setProgress(0);
    setProgressLabel("");
  };

  const isProcessing = ["uploading", "processing", "stopped"].includes(state);
  const isActive = state === "recording";
  const isPaused = state === "paused";

  const getCircleStyle = () => {
    if (isActive) return { backgroundColor: "#FEE2E2", borderColor: colors.destructive };
    if (isPaused) return { backgroundColor: colors.warningLight, borderColor: colors.warning };
    if (state === "done") return { backgroundColor: colors.emeraldLight, borderColor: colors.emerald };
    if (state === "error") return { backgroundColor: colors.destructiveLight, borderColor: colors.destructive };
    if (isProcessing) return { backgroundColor: colors.primaryLight, borderColor: colors.primary };
    return { backgroundColor: colors.mutedBg, borderColor: colors.border };
  };

  const getIcon = () => {
    if (state === "done") return "✓";
    if (state === "error") return "⚠";
    if (isProcessing) return "⏳";
    if (isActive) return "🎙";
    if (isPaused) return "⏸";
    return "🎙";
  };

  const getDobFormatted = () => {
    if (!patient?.dob) return null;
    const birth = new Date(patient.dob + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${birth.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })} (${age} años)`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          disabled={isProcessing || isActive || isPaused}
        >
          <Text
            style={[
              styles.backText,
              (isProcessing || isActive || isPaused) && styles.backDisabled,
            ]}
          >
            ← Volver
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grabar consulta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {patient && !loadingPatient && (
          <View style={styles.patientCard}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientAvatarText}>
                {patient.name[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientMeta}>📞 {patient.phone}</Text>
              {getDobFormatted() && (
                <Text style={styles.patientMeta}>📅 {getDobFormatted()}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.recorderCard}>
          <View style={[styles.circle, getCircleStyle()]}>
            <Text style={styles.circleIcon}>{getIcon()}</Text>
            {isActive && <View style={styles.pingDot} />}
          </View>

          <View style={styles.stateInfo}>
            {state === "idle" && (
              <>
                <Text style={styles.stateTitle}>Listo para grabar</Text>
                <Text style={styles.stateSubtitle}>
                  Presioná el botón para iniciar la consulta
                </Text>
              </>
            )}
            {state === "requesting" && (
              <Text style={styles.stateSubtitle}>Solicitando acceso al micrófono...</Text>
            )}
            {isActive && (
              <>
                <Text style={[styles.stateTimer, { color: colors.destructive }]}>
                  {formatDuration(duration)}
                </Text>
                <Text style={styles.stateSubtitle}>Grabando...</Text>
              </>
            )}
            {isPaused && (
              <>
                <Text style={[styles.stateTimer, { color: colors.warning }]}>
                  {formatDuration(duration)}
                </Text>
                <Text style={styles.stateSubtitle}>En pausa</Text>
              </>
            )}
            {state === "stopped" && (
              <Text style={styles.stateSubtitle}>Finalizando grabación...</Text>
            )}
            {state === "uploading" && (
              <Text style={styles.stateSubtitle}>Subiendo audio...</Text>
            )}
            {state === "processing" && (
              <Text style={styles.stateSubtitle}>Generando informes con IA...</Text>
            )}
            {state === "done" && (
              <>
                <Text style={[styles.stateTitle, { color: colors.emerald }]}>
                  ¡Informes generados!
                </Text>
                <Text style={styles.stateSubtitle}>Redirigiendo...</Text>
              </>
            )}
            {state === "error" && (
              <>
                <Text style={[styles.stateTitle, { color: colors.destructive }]}>
                  Error al procesar
                </Text>
                {error && (
                  <Text style={[styles.stateSubtitle, { color: colors.destructive }]}>
                    {error}
                  </Text>
                )}
              </>
            )}
          </View>

          {isProcessing && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{progressLabel}</Text>
            </View>
          )}

          <View style={styles.controls}>
            {state === "idle" && (
              <TouchableOpacity style={styles.primaryBtn} onPress={startRecording}>
                <Text style={styles.primaryBtnText}>🎙 Iniciar grabación</Text>
              </TouchableOpacity>
            )}

            {state === "requesting" && (
              <View style={[styles.primaryBtn, styles.primaryBtnDisabled]}>
                <Text style={styles.primaryBtnText}>Accediendo al micrófono...</Text>
              </View>
            )}

            {isActive && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.flex1]}
                  onPress={pauseRecording}
                >
                  <Text style={styles.secondaryBtnText}>⏸ Pausar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerBtn, styles.flex2]}
                  onPress={confirmStop}
                >
                  <Text style={styles.dangerBtnText}>⏹ Finalizar consulta</Text>
                </TouchableOpacity>
              </View>
            )}

            {isPaused && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, styles.flex1]}
                  onPress={resumeRecording}
                >
                  <Text style={styles.secondaryBtnText}>▶ Continuar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dangerBtn, styles.flex2]}
                  onPress={confirmStop}
                >
                  <Text style={styles.dangerBtnText}>⏹ Finalizar consulta</Text>
                </TouchableOpacity>
              </View>
            )}

            {state === "error" && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={resetRecorder}>
                <Text style={styles.secondaryBtnText}>↺ Intentar de nuevo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>¿Cómo funciona?</Text>
          <View style={styles.howSteps}>
            {[
              'Presiona "Iniciar grabacion" para comenzar',
              "Realiza la consulta con el paciente normalmente",
              'Al finalizar, presiona "Finalizar consulta"',
              "La IA analizará la conversación y generará dos informes automáticamente",
            ].map((step, i) => (
              <View key={i} style={styles.howStep}>
                <View style={styles.howNumber}>
                  <Text style={styles.howNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.howStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  backDisabled: {
    color: colors.muted,
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
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  patientAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  patientInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  patientMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  recorderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: "center",
    gap: 20,
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circleIcon: {
    fontSize: 36,
  },
  pingDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.destructive,
  },
  stateInfo: {
    alignItems: "center",
    gap: 4,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  stateTimer: {
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  stateSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.mutedBg,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
  },
  controls: {
    width: "100%",
    gap: 10,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  dangerBtn: {
    backgroundColor: colors.destructive,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  howItWorks: {
    backgroundColor: colors.mutedBg,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  howTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  howSteps: {
    gap: 10,
  },
  howStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  howNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  howNumberText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  howStepText: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
