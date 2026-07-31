import Link from "next/link";
import { Banknote, Wallet } from "lucide-react";
import { TIPOS_CUENTA, claseColor, type CuentaRow } from "@/lib/cuentas";
import { soles } from "@/lib/finanzas";
import { Label } from "@/components/ui/label";
import { TarjetaOpcion } from "@/components/tarjeta-opcion";

/**
 * Con qué se pagó, en tarjetas.
 *
 * "Efectivo" está siempre, aunque no haya ninguna cuenta creada: pagar en
 * efectivo es lo más común y no debería obligar a pasar antes por Ajustes. Y
 * viene marcado de salida, porque un grupo de radios sin nada elegido guardaba
 * el gasto sin cuenta sin que se notara.
 */
export function SelectorCuenta({ cuentas }: { cuentas: CuentaRow[] }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Label asChild>
          <legend>¿Con qué pagaste?</legend>
        </Label>
        <Link href="/ajustes" className="text-xs font-medium text-primary">
          Añadir cuenta
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cuentas.map((cuenta) => (
          <TarjetaOpcion
            key={cuenta.id}
            name="cuenta_id"
            value={cuenta.id}
            titulo={cuenta.nombre}
            // Saber cuánto queda en la tarjeta importa más al pagar que de quién es.
            pie={`${TIPOS_CUENTA[cuenta.tipo]} · ${soles(cuenta.saldo)}`}
            punto={claseColor(cuenta.color)}
            icono={Wallet}
          />
        ))}

        {/* Valor vacío: el gasto se guarda sin cuenta enlazada. */}
        <TarjetaOpcion
          name="cuenta_id"
          value=""
          titulo="Efectivo"
          pie="Sin cuenta"
          punto="bg-muted-foreground"
          icono={Banknote}
          predeterminada
        />
      </div>
    </fieldset>
  );
}
