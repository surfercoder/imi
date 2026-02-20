import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            IMI
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Establecer nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Elegí una contraseña segura para tu cuenta
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
