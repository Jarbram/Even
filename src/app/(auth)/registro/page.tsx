"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUp, type AuthState } from "../actions";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";

export default function RegistroPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(signUp, {});

  if (state.message) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <p className="text-lg font-extrabold text-primary">Revisa tu correo</p>
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-primary"
        >
          Ir a entrar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field
        name="displayName"
        label="Tu nombre"
        autoComplete="given-name"
        placeholder="Abraham"
        required
      />
      <Field
        name="email"
        label="Correo"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
      />
      <Field
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        minLength={8}
        required
      />

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="pt-2 text-center text-sm text-muted-foreground">
        ¿Ya tienen cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-lg bg-primary text-[15px] font-extrabold text-primary-foreground hover:bg-primary/90"
    >
      {pending ? "Creando cuenta…" : "Crear cuenta"}
    </Button>
  );
}
