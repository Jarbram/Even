"use server";

import { redirect } from "next/navigation";
import { iniciarSesion } from "@/lib/sesion";

export type EntrarState = { error?: string };

export async function entrar(
  _prev: EntrarState,
  formData: FormData,
): Promise<EntrarState> {
  const error = await iniciarSesion(
    formData.get("persona"),
    formData.get("pin"),
  );
  if (error) return { error };
  redirect("/");
}
