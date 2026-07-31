import { BotonCerrar } from "@/components/navegacion";
import { requirePersona } from "@/lib/sesion";
import { categoriasUsadas, listarCuentas } from "@/lib/datos";
import { hoyISO } from "@/lib/finanzas";
import { FormularioGasto } from "./formulario-gasto";

export default async function NuevoGastoPage() {
  const persona = await requirePersona();
  const [cuentas, categorias] = await Promise.all([
    listarCuentas(),
    categoriasUsadas(),
  ]);

  return (
    <>
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Nuevo gasto</h1>
        <BotonCerrar href="/" />
      </div>

      <FormularioGasto
        persona={persona}
        cuentas={cuentas.filter((c) => c.activa)}
        categorias={categorias}
        hoy={hoyISO()}
      />
    </>
  );
}
