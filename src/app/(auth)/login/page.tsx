"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type AuthState } from "../actions";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-4">
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
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <p className="pt-2 text-center text-sm text-muted-foreground">
        ¿Aún no tienen cuenta?{" "}
        <Link href="/registro" className="font-semibold text-primary">
          Crear una
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
      {pending ? "Entrando…" : "Entrar"}
    </Button>
  );
}
