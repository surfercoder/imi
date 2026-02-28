import { SignupForm } from "@/components/signup-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/30">
            IMI
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Unite a IMI
            </h1>
            <p className="mt-1 text-sm text-foreground/60">
              Creá tu cuenta de médico para comenzar
            </p>
          </div>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
