import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { NuevoInformeDialog } from "@/components/nuevo-informe-dialog";
import { InformesList } from "@/components/informes-list";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: informes } = await supabase
    .from("informes")
    .select("*, patients(name, phone, email)")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  const allInformes = informes ?? [];
  const completedCount = allInformes.filter((i) => i.status === "completed").length;
  const processingCount = allInformes.filter((i) => i.status === "processing").length;
  const errorCount = allInformes.filter((i) => i.status === "error").length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-bold tracking-tight text-foreground">
            IMI
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60 hidden sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="size-4 mr-1.5" />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Panel principal
            </h1>
            <p className="mt-1 text-foreground/60">
              Bienvenido de nuevo, Doctor.
            </p>
          </div>
          <NuevoInformeDialog />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <FileText className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{allInformes.length}</p>
                <p className="text-xs text-muted-foreground">Total informes</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex size-9 items-center justify-center rounded-lg ${errorCount > 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                {errorCount > 0 ? (
                  <AlertCircle className="size-4" />
                ) : (
                  <Clock className="size-4" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {errorCount > 0 ? errorCount : processingCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {errorCount > 0 ? "Con errores" : "En proceso"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Informes recientes</h2>
          <Badge variant="secondary" className="text-xs">
            {allInformes.length} total
          </Badge>
        </div>

        <InformesList informes={allInformes} />
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-6 text-sm text-foreground/50">
          © {new Date().getFullYear()} IMI. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
