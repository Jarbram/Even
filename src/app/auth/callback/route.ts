import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino del enlace de confirmación de correo. Acepta las dos formas que usa
 * Supabase: `code` (PKCE, plantilla por defecto) y `token_hash` (plantillas
 * nuevas), para no depender de cómo esté configurada la plantilla del proyecto.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Enlace incompleto") };

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=enlace_invalido`);
  }

  return NextResponse.redirect(`${origin}/bienvenida`);
}
