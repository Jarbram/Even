"use client";

import { useActionState, useState } from "react";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import { AvatarPersona } from "@/components/avatar-persona";
import { BotonGuardar } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrar, type EntrarState } from "./actions";

export function EntrarForm() {
  const [state, action] = useActionState<EntrarState, FormData>(entrar, {});
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);

  return (
    <form action={action} className="flex flex-col gap-7">
      <fieldset className="flex gap-2.5">
        <legend className="sr-only">Elige quién eres</legend>
        {PERSONAS.map((p) => (
          <label
            key={p}
            data-activa={p === persona}
            className="panel flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-xl p-4 text-center text-sm font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring data-[activa=true]:outline-2 data-[activa=true]:outline-primary"
          >
            <input
              type="radio"
              name="persona"
              value={p}
              checked={p === persona}
              onChange={() => setPersona(p)}
              className="sr-only"
            />
            <AvatarPersona persona={p} />
            {NOMBRES[p]}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pin">PIN</Label>
        <Input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          required
          className="text-center text-2xl tracking-[0.5em]"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <BotonGuardar>Entrar</BotonGuardar>
    </form>
  );
}
