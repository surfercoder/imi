"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { forgotPassword } from "@/actions/auth";
import { forgotPasswordSchema } from "@/schemas/auth";
import type { ForgotPasswordFormValues } from "@/types/auth";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPassword, null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    const formData = new FormData();
    formData.set("email", values.email);
    startTransition(() => formAction(formData));
  }

  if (state?.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MailCheck className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Revisá tu correo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Si existe una cuenta con ese correo, te enviamos un enlace para
              restablecer tu contraseña. Expira en 1 hora.
            </p>
          </div>
          <Link
            href="/login"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Olvidé mi contraseña</CardTitle>
        <CardDescription>
          Ingresá tu correo y te enviaremos un enlace para restablecer tu
          contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="doctor@hospital.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Enviando enlace…
                </>
              ) : (
                "Enviar enlace"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Recordás tu contraseña?{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
