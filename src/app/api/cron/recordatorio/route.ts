import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PERSONAS } from "@/lib/persona";
import { hoyISO } from "@/lib/finanzas";
import { enviarPush } from "@/lib/push";

/**
 * Vercel Cron llama esto una vez al día (ver `vercel.json`). Si nadie anotó
 * un gasto en un tiempo, se lo recuerda a los dos — no a uno solo, porque
 * cualquiera puede anotar cualquier gasto y no tiene sentido culpar al que
 * históricamente lo hace menos.
 */

const DIAS_SIN_ANOTAR_PARA_AVISAR = 2;

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (secreto && request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("gastos")
    .select("fecha")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle()
    .overrideTypes<{ fecha: string } | null>();

  const hoy = hoyISO();
  const dias = data
    ? Math.round((Date.parse(hoy) - Date.parse(data.fecha)) / 86_400_000)
    : Infinity;

  if (dias < DIAS_SIN_ANOTAR_PARA_AVISAR) {
    return NextResponse.json({ ok: true, avisado: false, dias });
  }

  await Promise.all(
    PERSONAS.map((persona) =>
      enviarPush(persona, {
        titulo: "¿Se les fue anotar algo?",
        cuerpo:
          dias === Infinity
            ? "Todavía no registran ningún gasto."
            : `Van ${dias} días sin registrar un gasto.`,
        url: "/movimientos/nuevo",
      }),
    ),
  );

  return NextResponse.json({ ok: true, avisado: true, dias });
}
