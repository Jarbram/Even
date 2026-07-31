import Link from "next/link";
import { requirePersona } from "@/lib/sesion";
import { listarCuentas } from "@/lib/datos";
import { hoyISO } from "@/lib/finanzas";
import { FormularioGasto } from "./formulario-gasto";

export default async function NuevoGastoPage() {
  const persona = await requirePersona();
  const cuentas = (await listarCuentas()).filter((c) => c.activa);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Nuevo gasto</h1>
        <Link
          href="/"
          aria-label="Cerrar"
          className="glass flex size-9 items-center justify-center rounded-full text-sm text-muted-foreground"
        >
          ✕
        </Link>
      </div>

      <FormularioGasto persona={persona} cuentas={cuentas} hoy={hoyISO()} />
    </>
  );
}
