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
import { signup } from "@/actions/auth";
import { signupSchema } from "@/schemas/auth";
import type { SignupFormValues } from "@/types/auth";
import { Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
  const [state, formAction] = useActionState(signup, null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(values: SignupFormValues) {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("confirmPassword", values.confirmPassword);
    startTransition(() => formAction(formData));
  }

  if (state?.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Revisá tu correo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Te enviamos un enlace de confirmación. Hacé clic en él para
              activar tu cuenta.
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
        <CardTitle className="text-xl">Crear una cuenta</CardTitle>
        <CardDescription>
          Registrate como médico para acceder a la plataforma IMI
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Mín. 8 caracteres"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Repetí tu contraseña"
                      autoComplete="new-password"
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
                  Creando cuenta…
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{" "}
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
