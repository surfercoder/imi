"use client";

import { useState, useActionState, useTransition } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { signup } from "@/actions/auth";
import { signupSchema, ESPECIALIDADES } from "@/schemas/auth";
import type { SignupFormValues } from "@/types/auth";
import { Loader2, CheckCircle2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SignatureField } from "@/components/signature-field";

export function SignupForm() {
  const [state, formAction] = useActionState(signup, null);
  const [isPending, startTransition] = useTransition();
  const [especialidadOpen, setEspecialidadOpen] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: undefined,
      email: "",
      password: "",
      confirmPassword: "",
      dni: undefined,
      matricula: "",
      phone: "",
      especialidad: "",
      firmaDigital: undefined,
    },
  });

  function onSubmit(values: SignupFormValues) {
    const formData = new FormData();
    formData.set("name", values.name ?? "");
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("confirmPassword", values.confirmPassword);
    formData.set("dni", values.dni ?? "");
    formData.set("matricula", values.matricula);
    formData.set("phone", values.phone);
    formData.set("especialidad", values.especialidad);
    formData.set("firmaDigital", values.firmaDigital ?? "");
    startTransition(() => formAction(formData));
  }

  if (state?.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
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
            className="flex flex-col gap-5"
            noValidate
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Row 1: Nombre | DNI */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Dra. María García"
                        autoComplete="name"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 30123456"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 2: Correo | Teléfono */}
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
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        inputMode="tel"
                        placeholder="Ej: +54 11 1234-5678"
                        autoComplete="tel"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 3: Matrícula | Especialidad */}
              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 123456"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="especialidad"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Especialidad</FormLabel>
                    <Popover
                      open={especialidadOpen}
                      onOpenChange={setEspecialidadOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <button
                            type="button"
                            role="combobox"
                            aria-controls="especialidad-listbox"
                            aria-expanded={especialidadOpen}
                            className={cn(
                              "border-input bg-transparent flex h-9 w-full items-center justify-between rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                              field.value ? "text-card-foreground" : "text-muted-foreground"
                            )}
                          >
                            {field.value || "Seleccioná tu especialidad"}
                            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                          </button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command className="bg-white text-[#1a1733]">
                          <CommandInput placeholder="Buscar especialidad…" className="text-[#1a1733] placeholder:text-[#4a4868]" />
                          <CommandList id="especialidad-listbox">
                            <CommandEmpty className="text-[#4a4868]">
                              No se encontró la especialidad.
                            </CommandEmpty>
                            <CommandGroup>
                              {ESPECIALIDADES.map((esp) => (
                                <CommandItem
                                  key={esp}
                                  value={esp}
                                  className="text-[#1a1733] data-[selected=true]:bg-[#f0f0f8] data-[selected=true]:text-[#1a1733]"
                                  onSelect={(val) => {
                                    field.onChange(val);
                                    setEspecialidadOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      field.value === esp
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {esp}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 4: Firma Digital — full width */}
              <div className="col-span-1 sm:col-span-2">
                <FormField
                  control={form.control}
                  name="firmaDigital"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <SignatureField
                          onChange={field.onChange}
                          error={fieldState.error?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 5: Contraseña | Confirmar contraseña */}
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
                        value={field.value ?? ""}
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
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
