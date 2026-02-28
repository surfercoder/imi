"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Square, Play, Pause, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { processInformeFromTranscript } from "@/actions/informes";
import { useRouter } from "next/navigation";

interface AudioRecorderProps {
  informeId: string;
  doctorId: string;
}

type RecorderState =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "stopped"
  | "uploading"
  | "transcribing"
  | "processing"
  | "done"
  | "error";

export function AudioRecorder({ informeId, doctorId }: AudioRecorderProps) {
  const router = useRouter();
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [progress, setProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fullTranscriptRef = useRef<string>("");

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, [stopTimer]);

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      (typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-AR";
    recognition.maxAlternatives = 1;

    let interimTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          fullTranscriptRef.current += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      setTranscript(fullTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          recognition.start();
        } catch {
        }
      }
    };

    return recognition;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setState("recording");
      startTimer();

      const recognition = setupSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch {
        }
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo acceder al micrófono";
      setError(
        msg.includes("Permission")
          ? "Permiso de micrófono denegado. Por favor, permita el acceso al micrófono."
          : msg
      );
      setState("error");
    }
  }, [startTimer, setupSpeechRecognition]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      recognitionRef.current?.stop();
      stopTimer();
      setState("paused");
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setState("recording");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
        }
      }
    }
  }, [startTimer]);

  const stopAndProcess = useCallback(async () => {
    stopTimer();

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const finalTranscript = fullTranscriptRef.current.trim();

    const processAudio = async (resolve: () => void) => {
      setState("uploading");
      setProgress(20);

      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });

      let audioPath: string | undefined;

      try {
        const supabase = createClient();
        const ext = blob.type.includes("ogg") ? "ogg" : "webm";
        const fileName = `${doctorId}/${informeId}/recording.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("audio-recordings")
          .upload(fileName, blob, {
            contentType: blob.type,
            upsert: true,
          });

        if (!uploadError) {
          audioPath = fileName;
        }
      } catch (uploadErr) {
        console.warn("Audio upload failed, continuing without it:", uploadErr);
      }

      setProgress(40);
      setState("processing");

      const transcriptToUse =
        finalTranscript ||
        "No se pudo transcribir el audio automáticamente. Por favor revise la grabación.";

      setProgress(60);

      const result = await processInformeFromTranscript(
        informeId,
        transcriptToUse,
        audioPath
      );

      setProgress(100);

      if (result.error) {
        setError(result.error);
        setState("error");
      } else {
        setState("done");
        setTimeout(() => {
          router.push(`/informes/${informeId}`);
        }, 1200);
      }

      resolve();
    };

    return new Promise<void>((resolve) => {
      /* v8 ignore next 4 */
      if (!mediaRecorderRef.current) {
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = () => processAudio(resolve);

      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        setState("stopped");
      } else {
        processAudio(resolve);
      }
    });
  }, [stopTimer, informeId, doctorId, router]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [stopTimer]);

  const isProcessing = ["uploading", "processing", "stopped"].includes(state);
  const isActive = state === "recording";
  const isPaused = state === "paused";

  /* istanbul ignore next */
  const progressLabel =
    progress < 40
      ? "Subiendo grabación..."
      : progress < 80
      ? "Analizando consulta con IA..."
      : "Generando informes...";

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 p-10 transition-all duration-300",
          isActive && "border-destructive/50 bg-destructive/5",
          isPaused && "border-primary/40 bg-primary/5",
          state === "idle" && "border-dashed border-border bg-muted",
          state === "done" && "border-accent/50 bg-accent/5",
          state === "error" && "border-destructive/50 bg-destructive/5",
          isProcessing && "border-primary/40 bg-primary/5"
        )}
      >
        {isActive && (
          <span className="absolute top-4 right-4 flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-destructive" />
          </span>
        )}

        <div
          className={cn(
            "mb-4 flex size-20 items-center justify-center rounded-full transition-all duration-300",
            isActive && "bg-destructive/15 text-destructive",
            isPaused && "bg-primary/10 text-primary",
            state === "idle" && "bg-secondary text-muted-foreground",
            state === "done" && "bg-accent/15 text-accent",
            state === "error" && "bg-destructive/15 text-destructive",
            isProcessing && "bg-primary/10 text-primary"
          )}
        >
          {state === "done" ? (
            <CheckCircle2 className="size-9" />
          ) : state === "error" ? (
            <AlertCircle className="size-9" />
          ) : isProcessing ? (
            <Loader2 className="size-9 animate-spin" />
          ) : isActive ? (
            <Mic className="size-9" />
          ) : isPaused ? (
            <Pause className="size-9" />
          ) : (
            <Mic className="size-9" />
          )}
        </div>

        <div className="text-center">
          {state === "idle" && (
            <>
              <p className="text-base font-medium text-card-foreground">Listo para grabar</p>
              <p className="mt-1 text-sm text-card-foreground/60">
                Presione el botón para iniciar la consulta
              </p>
            </>
          )}
          {state === "requesting" && (
            <p className="text-sm text-muted-foreground">
              Solicitando acceso al micrófono...
            </p>
          )}
          {isActive && (
            <>
              <p className="text-2xl font-mono font-semibold tabular-nums text-destructive tracking-wider">
                {formatDuration(duration)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Grabando...</p>
            </>
          )}
          {isPaused && (
            <>
              <p className="text-2xl font-mono font-semibold tabular-nums text-primary tracking-wider">
                {formatDuration(duration)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">En pausa</p>
            </>
          )}
          {state === "stopped" && (
            <p className="text-sm text-muted-foreground">
              Finalizando grabación...
            </p>
          )}
          {state === "uploading" && (
            <p className="text-sm text-muted-foreground">
              Subiendo audio...
            </p>
          )}
          {state === "processing" && (
            <p className="text-sm text-muted-foreground">
              Generando informes con IA...
            </p>
          )}
          {state === "done" && (
            <>
              <p className="text-base font-medium text-accent">
                ¡Informes generados!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Redirigiendo...
              </p>
            </>
          )}
          {state === "error" && (
            <>
              <p className="text-base font-medium text-destructive">
                Error al procesar
              </p>
              {error && (
                <p className="mt-1 text-sm text-destructive/80">{error}</p>
              )}
            </>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-1.5">
          <Progress value={progress} className="h-1.5" />
          <p className="text-center text-xs text-muted-foreground">
            {progressLabel}
          </p>
        </div>
      )}

      {(isActive || isPaused) && transcript && (
        <div className="rounded-lg border border-border bg-muted p-4 max-h-40 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Transcripción en tiempo real
          </p>
          <p className="text-sm leading-relaxed text-card-foreground">{transcript}</p>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        {state === "idle" && (
          <Button
            size="lg"
            variant="destructive"
            onClick={startRecording}
            className="gap-2 px-8"
          >
            <Mic className="size-4" />
            Iniciar grabación
          </Button>
        )}

        {state === "requesting" && (
          <Button size="lg" disabled className="gap-2 px-8">
            <Loader2 className="size-4 animate-spin" />
            Accediendo al micrófono...
          </Button>
        )}

        {isActive && (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={pauseRecording}
              className="gap-2"
            >
              <Pause className="size-4" />
              Pausar
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={stopAndProcess}
              className="gap-2 px-8"
            >
              <Square className="size-4" />
              Finalizar consulta
            </Button>
          </>
        )}

        {isPaused && (
          <>
            <Button
              size="lg"
              variant="outline"
              onClick={resumeRecording}
              className="gap-2"
            >
              <Play className="size-4" />
              Continuar
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={stopAndProcess}
              className="gap-2 px-8"
            >
              <Square className="size-4" />
              Finalizar consulta
            </Button>
          </>
        )}

        {state === "error" && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setState("idle");
              setError(null);
              setDuration(0);
              setTranscript("");
              fullTranscriptRef.current = "";
              chunksRef.current = [];
            }}
            className="gap-2"
          >
            <MicOff className="size-4" />
            Intentar de nuevo
          </Button>
        )}
      </div>
    </div>
  );
}
