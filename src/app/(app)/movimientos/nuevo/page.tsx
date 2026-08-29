import { BotonCerrar } from "@/components/navegacion";
import { requirePersona } from "@/lib/sesion";
import {
  categoriasUsadas,
  cuentaPorCategoria,
  descripcionesUsadas,
  listarCuentas,
} from "@/lib/datos";
import { hoyISO } from "@/lib/finanzas";
import { FormularioGasto } from "./formulario-gasto";

export default async function NuevoGastoPage() {
  const persona = await requirePersona();
  const [cuentas, categorias, descripciones, cuentaSugerida] = await Promise.all([
    listarCuentas(),
    categoriasUsadas(),
    descripcionesUsadas(),
    cuentaPorCategoria(),
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
        descripciones={descripciones}
        cuentaPorCategoria={cuentaSugerida}
        hoy={hoyISO()}
      />
    </>
  );
}
