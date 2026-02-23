"use client";

import Link from "next/link";
import {
  FileText,
  User,
  Phone,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InformeRow {
  id: string;
  status: string;
  created_at: string;
  patients: {
    name: string;
    phone: string;
    email: string | null;
  } | null;
}

interface InformesListProps {
  informes: InformeRow[];
}

const statusConfig = {
  recording: {
    label: "Grabando",
    variant: "secondary" as const,
    icon: Mic,
    className: "text-amber-600 bg-amber-50 border-amber-200",
  },
  processing: {
    label: "Procesando",
    variant: "secondary" as const,
    icon: Loader2,
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  completed: {
    label: "Completado",
    variant: "default" as const,
    icon: FileText,
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  error: {
    label: "Error",
    variant: "destructive" as const,
    icon: AlertCircle,
    className: "text-destructive bg-destructive/10 border-destructive/20",
  },
};

export function InformesList({ informes }: InformesListProps) {
  if (informes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <FileText className="size-7" />
        </div>
        <p className="font-medium">Sin informes aún</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cree un nuevo informe para comenzar una consulta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {informes.map((informe) => {
        const status =
          statusConfig[informe.status as keyof typeof statusConfig] ??
          statusConfig.error;
        const StatusIcon = status.icon;
        const href =
          informe.status === "recording"
            ? `/informes/${informe.id}/grabar`
            : `/informes/${informe.id}`;

        const date = new Date(informe.created_at).toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Link
            key={informe.id}
            href={href}
            className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">
                  {informe.patients?.name ?? "Paciente desconocido"}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                    status.className
                  )}
                >
                  <StatusIcon
                    className={cn(
                      "size-3",
                      informe.status === "processing" && "animate-spin"
                    )}
                  />
                  {status.label}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                {informe.patients?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {informe.patients.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {date}
                </span>
              </div>
            </div>

            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </div>
  );
}
