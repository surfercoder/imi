import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  FileText,
  Stethoscope,
  MessageCircle,
  Download,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getPdfDownloadUrl } from "@/actions/informes";
import { WhatsAppButton } from "@/components/whatsapp-button";

interface Props {
  params: Promise<{ id: string }>;
}

const statusConfig = {
  recording: {
    label: "Grabando",
    variant: "secondary" as const,
    icon: Clock,
  },
  processing: {
    label: "Procesando",
    variant: "secondary" as const,
    icon: Loader2,
  },
  completed: {
    label: "Completado",
    variant: "default" as const,
    icon: FileText,
  },
  error: {
    label: "Error",
    variant: "destructive" as const,
    icon: AlertCircle,
  },
};

export default async function InformePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: informe, error } = await supabase
    .from("informes")
    .select("*, patients(name, phone, dob, email)")
    .eq("id", id)
    .eq("doctor_id", user.id)
    .single();

  if (error || !informe) notFound();

  if (informe.status === "recording") {
    redirect(`/informes/${id}/grabar`);
  }

  const patient = informe.patients as {
    name: string;
    phone: string;
    dob: string | null;
    email: string | null;
  };

  const dobFormatted = patient.dob
    ? new Date(patient.dob + "T00:00:00").toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const patientAge = patient.dob
    ? (() => {
        const today = new Date();
        const birth = new Date(patient.dob + "T00:00:00");
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      })()
    : null;

  const createdAt = new Date(informe.created_at).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const status = statusConfig[informe.status as keyof typeof statusConfig] ?? statusConfig.error;
  const StatusIcon = status.icon;

  let pdfSignedUrl: string | null = null;
  if (informe.pdf_path) {
    pdfSignedUrl = await getPdfDownloadUrl(informe.pdf_path);
  }

  const whatsappPhone = patient.phone.replace(/\D/g, "");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 mr-1.5" />
              Volver
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-medium truncate">{patient.name}</span>
          <Badge variant={status.variant} className="ml-auto flex items-center gap-1.5 text-xs">
            <StatusIcon className="size-3" />
            {status.label}
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 space-y-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Informe de consulta
            </h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {createdAt}
            </p>
          </div>

          {informe.status === "completed" && pdfSignedUrl && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" asChild>
                <a href={pdfSignedUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4 mr-1.5" />
                  Descargar PDF
                </a>
              </Button>
              <WhatsAppButton
                phone={whatsappPhone}
                patientName={patient.name}
                pdfUrl={pdfSignedUrl}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base">{patient.name}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {patient.phone}
                </span>
                {dobFormatted && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {dobFormatted}{patientAge !== null && ` (${patientAge} años)`}
                  </span>
                )}
                {patient.email && (
                  <span>{patient.email}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {informe.status === "processing" && (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-16 text-center">
            <Loader2 className="size-10 text-primary animate-spin mb-4" />
            <p className="font-medium">Generando informes...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La IA está analizando la consulta. Esto puede tomar unos momentos.
            </p>
          </div>
        )}

        {informe.status === "error" && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-16 text-center">
            <AlertCircle className="size-10 text-destructive mb-4" />
            <p className="font-medium text-destructive">Error al procesar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ocurrió un error al generar los informes. Por favor intente nuevamente.
            </p>
          </div>
        )}

        {informe.status === "completed" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Stethoscope className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Informe médico</p>
                  <p className="text-xs text-muted-foreground">Para el doctor</p>
                </div>
              </div>
              <div className="p-5">
                <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {informe.informe_doctor || "Sin contenido"}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center gap-3 border-b bg-emerald-50/50 px-5 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageCircle className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Informe para el paciente</p>
                  <p className="text-xs text-muted-foreground">
                    Se enviará por WhatsApp
                  </p>
                </div>
              </div>
              <div className="p-5">
                <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {informe.informe_paciente || "Sin contenido"}
                </div>
              </div>
            </div>
          </div>
        )}

        {informe.transcript && (
          <details className="rounded-xl border bg-card">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-medium hover:bg-muted/30 transition-colors">
              <FileText className="size-4 text-muted-foreground" />
              Ver transcripción completa
            </summary>
            <div className="border-t px-5 py-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {informe.transcript}
              </p>
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
