"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

const credentials = z.object({
  email: z.email("Escribe un correo válido"),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres"),
});

const registration = credentials.extend({
  displayName: z.string().trim().min(2, "Escribe tu nombre").max(40),
});

/** Primer error de un ZodError, en el idioma de la app. */
function firstError(result: z.ZodSafeParseResult<unknown>) {
  return result.success ? undefined : result.error.issues[0].message;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: "Correo o contraseña incorrectos" };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registration.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) return { error: firstError(parsed) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "Ese correo ya tiene una cuenta"
          : "No se pudo crear la cuenta. Inténtalo otra vez.",
    };
  }

  // Sin sesión = Supabase espera confirmación por correo antes de dejar entrar.
  if (!data.session) {
    return { message: "Te enviamos un correo para confirmar la cuenta." };
  }

  revalidatePath("/", "layout");
  redirect("/bienvenida");
}
