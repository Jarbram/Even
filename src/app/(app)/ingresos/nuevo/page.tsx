import { requirePersona } from "@/lib/sesion";
import { mesActual, nombreMes } from "@/lib/finanzas";
import { BotonCerrar } from "@/components/navegacion";
import { FormularioIngreso } from "./formulario-ingreso";

export default async function NuevoIngresoPage() {
  const persona = await requirePersona();
  const mes = mesActual();

  return (
    <>
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Nuevo ingreso</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Entra en {nombreMes(mes)}
          </p>
        </div>
        <BotonCerrar href="/presupuesto" />
      </div>

      <FormularioIngreso persona={persona} mes={mes} />
    </>
  );
}
