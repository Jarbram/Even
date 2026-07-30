"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createHousehold,
  joinHousehold,
  type HouseholdState,
} from "./actions";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";

export function OnboardingForms() {
  const [mode, setMode] = useState<"crear" | "unirse">("crear");
  const [createState, createAction] = useActionState<HouseholdState, FormData>(
    createHousehold,
    {},
  );
  const [joinState, joinAction] = useActionState<HouseholdState, FormData>(
    joinHousehold,
    {},
  );

  const state = mode === "crear" ? createState : joinState;

  return (
    <div className="space-y-5">
      <div className="glass flex rounded-lg p-1">
        {(["crear", "unirse"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className="flex-1 rounded-md py-2.5 text-xs font-bold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {m === "crear" ? "Crear hogar" : "Tengo un código"}
          </button>
        ))}
      </div>

      {mode === "crear" ? (
        <form action={createAction} className="space-y-4">
          <Field
            name="name"
            label="Nombre del hogar"
            placeholder="Hogar Abraham & Isabel"
            maxLength={60}
            required
          />
          <p className="text-xs text-muted-foreground">
            Después te damos un código de 6 caracteres para que tu pareja entre.
          </p>
          <Submit label="Crear hogar" pendingLabel="Creando…" />
        </form>
      ) : (
        <form action={joinAction} className="space-y-4">
          <Field
            name="code"
            label="Código de invitación"
            placeholder="A7K2M9"
            maxLength={6}
            autoCapitalize="characters"
            className="glass h-12 rounded-md px-4 text-center text-2xl font-extrabold tracking-[0.3em] uppercase"
            required
          />
          <Submit label="Unirme" pendingLabel="Uniéndome…" />
        </form>
      )}

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function Submit({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-lg bg-primary text-[15px] font-extrabold text-primary-foreground hover:bg-primary/90"
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
