import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para Server Components y Server Actions. Solo existe este:
 * el navegador nunca habla con Supabase directamente.
 *
 * Por qué la `service_role` y no la `anon`: sin login, RLS no puede distinguir a
 * nadie, así que unas políticas abiertas a `anon` dejarían la base entera al
 * alcance de cualquiera que sacara la URL y la clave del JavaScript — y el PIN
 * no habría servido de nada, porque PostgREST no sabe nada del PIN.
 *
 * Así que las tablas están cerradas a `anon` (RLS activo y sin políticas) y el
 * único que entra es este cliente, que corre en el servidor detrás del PIN.
 * Ninguna de estas variables lleva el prefijo NEXT_PUBLIC_ a propósito: si lo
 * llevaran, acabarían en el bundle del navegador.
 */
export function createClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Están en Supabase → Project Settings → API.",
    );
  }

  return createSupabaseClient(url, key, {
    // No hay sesiones que guardar: la identidad la lleva la cookie de la app.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
