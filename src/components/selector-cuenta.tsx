import { Link } from "next-view-transitions";
import { Banknote } from "lucide-react";
import {
  ICONO_TIPO,
  TIPOS_CUENTA,
  claseColor,
  leerSaldo,
  type CuentaRow,
} from "@/lib/cuentas";
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
        <Link href="/ajustes" className="-my-3.5 py-3.5 text-xs font-medium text-primary">
          Añadir cuenta
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cuentas.map((cuenta) => {
          // `leerSaldo` y no `cuenta.saldo` a secas: en una tarjeta el saldo
          // crudo es negativo, y aquí salía "Crédito · −S/ 6,537.69" mientras
          // que Ajustes decía "S/ 4,062.31 disponible" de la misma tarjeta.
          const saldo = leerSaldo(cuenta);
          return (
            <TarjetaOpcion
              key={cuenta.id}
              name="cuenta_id"
              value={cuenta.id}
              titulo={cuenta.nombre}
              // Saber cuánto queda en la tarjeta importa más al pagar que de quién es.
              pie={
                saldo.esCredito
                  ? `Disponible ${soles(saldo.principal)}`
                  : `${TIPOS_CUENTA[cuenta.tipo]} · ${soles(saldo.principal)}`
              }
              punto={claseColor(cuenta.color)}
              icono={ICONO_TIPO[cuenta.tipo]}
            />
          );
        })}

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
