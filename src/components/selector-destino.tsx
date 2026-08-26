import { CircleDashed, PiggyBank } from "lucide-react";
import {
  ICONO_TIPO,
  TIPOS_CUENTA,
  claseColor,
  leerSaldo,
  type CuentaRow,
} from "@/lib/cuentas";
import { soles } from "@/lib/finanzas";
import type { FondoRow } from "@/lib/datos";
import { Label } from "@/components/ui/label";
import { TarjetaOpcion } from "@/components/tarjeta-opcion";

/**
 * A dónde entra el dinero: a una cuenta o directo al ahorro.
 *
 * Un solo campo `destino` con el valor "cuenta:<id>" o "fondo:<id>", en vez de
 * dos radios que podrían quedar los dos marcados. La base tiene el mismo
 * criterio: un check impide que un ingreso apunte a las dos cosas.
 */
export function SelectorDestino({
  cuentas,
  fondos,
}: {
  cuentas: CuentaRow[];
  fondos: FondoRow[];
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <Label asChild>
        <legend>¿A dónde entra?</legend>
      </Label>

      <div className="grid grid-cols-2 gap-2.5">
        {cuentas.map((cuenta) => {
          const saldo = leerSaldo(cuenta);
          return (
            <TarjetaOpcion
              key={cuenta.id}
              name="destino"
              value={`cuenta:${cuenta.id}`}
              titulo={cuenta.nombre}
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

        {fondos.map((fondo) => (
          <TarjetaOpcion
            key={fondo.id}
            name="destino"
            value={`fondo:${fondo.id}`}
            titulo={fondo.nombre}
            pie={`Ahorro · ${soles(fondo.saldo)}`}
            punto="bg-primary"
            icono={PiggyBank}
            acento
          />
        ))}

        {/*
          Vacío = sin destino, y viene marcada de salida. Antes solo se marcaba
          cuando no había ninguna otra opción, así que en cuanto existía una
          cuenta el grupo entero aparecía sin nada seleccionado: no se veía qué
          iba a pasar al guardar.
        */}
        <TarjetaOpcion
          name="destino"
          value=""
          titulo="No lo asigno"
          pie="Solo suma al total"
          punto="bg-muted-foreground"
          icono={CircleDashed}
          predeterminada
        />
      </div>

      {fondos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Si eliges un ahorro, el fondo sube solo con este ingreso.
        </p>
      )}
    </fieldset>
  );
}
