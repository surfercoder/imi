import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            IMI
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Restablecer contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
