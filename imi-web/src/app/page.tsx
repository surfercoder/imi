import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, User } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">IMI</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
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
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
          <p className="mt-1 text-muted-foreground">
            Bienvenido de nuevo, Doctor.
          </p>
        </div>

        <Separator className="mb-8" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Cuenta</CardTitle>
                  <CardDescription className="text-xs">
                    Detalles de tu perfil
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Correo electrónico</span>
                <span className="font-medium truncate max-w-[180px]">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant="secondary" className="text-xs">
                  Activo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} IMI. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
