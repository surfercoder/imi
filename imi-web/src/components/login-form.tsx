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
import { login } from "@/actions/auth";
import { loginSchema } from "@/schemas/auth";
import type { LoginFormValues } from "@/types/auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const [state, formAction] = useActionState(login, null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    startTransition(() => formAction(formData));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Ingresá tu email y contraseña para acceder a tu cuenta
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Contraseña</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
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
                  Ingresando…
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <Link
                href="/signup"
                className="text-primary underline-offset-4 hover:underline"
              >
                Registrarse
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
