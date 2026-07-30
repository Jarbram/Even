"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type HouseholdState = { error?: string };

const nameSchema = z.string().trim().min(2, "Ponle un nombre al hogar").max(60);
const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(6, "El código tiene 6 caracteres");

export async function createHousehold(
  _prev: HouseholdState,
  formData: FormData,
): Promise<HouseholdState> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_household", {
    household_name: parsed.data,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function joinHousehold(
  _prev: HouseholdState,
  formData: FormData,
): Promise<HouseholdState> {
  const parsed = codeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_household", { code: parsed.data });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}
