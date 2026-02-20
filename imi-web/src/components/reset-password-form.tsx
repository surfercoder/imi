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
import { resetPassword } from "@/actions/auth";
import { resetPasswordSchema } from "@/schemas/auth";
import type { ResetPasswordFormValues } from "@/types/auth";
import { Loader2 } from "lucide-react";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPassword, null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordFormValues) {
    const formData = new FormData();
    formData.set("password", values.password);
    formData.set("confirmPassword", values.confirmPassword);
    startTransition(() => formAction(formData));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Establecer nueva contraseña</CardTitle>
        <CardDescription>
          Elegí una contraseña segura para tu cuenta
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
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
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Repetí tu nueva contraseña"
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
                  Actualizando contraseña…
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
