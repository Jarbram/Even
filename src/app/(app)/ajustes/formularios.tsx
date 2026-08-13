"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import { TIPOS_CUENTA, claseColor, type CuentaRow } from "@/lib/cuentas";
import { soles } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { Plegable } from "@/components/plegable";
import { TarjetaOpcion } from "@/components/tarjeta-opcion";
import { Button } from "@/components/ui/button";
import {
  BotonGuardar,
  ErrorForm,
  useAlGuardar,
} from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  crearCuenta,
  crearFondo,
  crearReembolso,
  moverDinero,
  moverEnFondo,
  type Resultado,
} from "../acciones";

// ---------------------------------------------------------------------------

export function NuevaCuenta({ persona }: { persona: Persona }) {
  const [estado, action] = useActionState<Resultado, FormData>(crearCuenta, {});
  const ref = useAlGuardar(estado, "Cuenta añadida");
  const [tipo, setTipo] = useState<string>(Object.keys(TIPOS_CUENTA)[0]);

  return (
    <Plegable titulo="Añadir billetera o tarjeta">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-cuenta">Nombre</Label>
          <Input
            id="nombre-cuenta"
            name="nombre"
            placeholder="BCP, Yape, Efectivo…"
            maxLength={40}
            required
          />
        </div>

        <Chips
          name="tipo"
          label="Tipo"
          columnas={2}
          onChange={setTipo}
          opciones={Object.entries(TIPOS_CUENTA).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        {/* Una tarjeta de crédito se mide por su cupo, no por lo que tiene
            dentro: preguntar las dos cosas confundiría más que ayudar. */}
        {tipo === "credito" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linea-cuenta">Línea de crédito (S/)</Label>
            <Input
              id="linea-cuenta"
              name="linea"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="10500"
            />
            <p className="text-xs text-muted-foreground">
              El cupo total. La app lleva cuánto llevas consumido y cuánto te
              queda disponible.
            </p>
          </div>
        )}

        <Chips
          name="persona"
          label="¿De quién es?"
          defaultValue={persona}
          opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="saldo-cuenta">
            {tipo === "credito" ? "¿Cuánto llevas consumido? (S/)" : "¿Cuánto tiene ahora? (S/)"}
          </Label>
          <Input
            id="saldo-cuenta"
            name="saldo_base"
            type="number"
            inputMode="decimal"
            step="0.01"
            defaultValue="0"
          />
          <p className="text-xs text-muted-foreground">
            Sube y baja solo con lo que entre y salga.
          </p>
        </div>

        {/* El color ya no se elige: se asigna solo, evitando los que estén en
            uso. Solo sirve para distinguir cuentas en la lista, y era una
            pregunta más en un formulario que ya tenía cuatro. */}

        <ErrorForm estado={estado} />
        <BotonGuardar>Añadir cuenta</BotonGuardar>
      </form>
    </Plegable>
  );
}

// ---------------------------------------------------------------------------

export function NuevoFondo() {
  const [estado, action] = useActionState<Resultado, FormData>(crearFondo, {});
  const ref = useAlGuardar(estado, "Fondo creado");

  return (
    <Plegable titulo="Crear fondo de ahorro">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-fondo">Nombre</Label>
          <Input
            id="nombre-fondo"
            name="nombre"
            placeholder="Viaje, Emergencia…"
            maxLength={40}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="saldo-fondo">¿Cuánto tiene ya? (S/)</Label>
          <Input
            id="saldo-fondo"
            name="saldo"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue="0"
          />
          <p className="text-xs text-muted-foreground">
            Lo que ya tengan guardado.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta">
            Meta{" "}
            <span className="font-normal text-muted-foreground">
              · opcional
            </span>
          </Label>
          <Input
            id="meta"
            name="meta"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="Sin meta fija"
          />
        </div>

        <ErrorForm estado={estado} />
        <BotonGuardar>Crear fondo</BotonGuardar>
      </form>
    </Plegable>
  );
}

/**
 * Mover plata al fondo, o sacarla. Es lo que hace que un fondo crezca; sin esto
 * el saldo se quedaba congelado en lo que se puso al crearlo.
 */
export function MoverEnFondo({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    moverEnFondo,
    {},
  );
  const ref = useAlGuardar(estado, "Saldo actualizado");

  return (
    <form ref={ref} action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <Input
          name="monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="Monto"
          required
          aria-label={`Cuánto mover en ${nombre}`}
          className="h-10 flex-1 text-sm"
        />
        <Mover direccion="meter" nombre={nombre}>
          Meter
        </Mover>
        <Mover direccion="sacar" nombre={nombre}>
          Sacar
        </Mover>
      </div>
      <ErrorForm estado={estado} />
    </form>
  );
}

/** Los dos botones mandan el mismo formulario cambiando solo la dirección. */
function Mover({
  direccion,
  nombre,
  children,
}: {
  direccion: "meter" | "sacar";
  nombre: string;
  children: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="direccion"
      value={direccion}
      disabled={pending}
      variant={direccion === "meter" ? "default" : "ghost"}
      aria-label={`${children} en ${nombre}`}
      className="h-10 shrink-0 rounded-lg px-3 text-xs"
    >
      {children}
    </Button>
  );
}

// ---------------------------------------------------------------------------

/**
 * Salda un gasto marcado "a reembolsar": plata real que sale de una cuenta
 * de quien debe y entra a una de quien pagó. Las dos son obligatorias — sin
 * ellas el saldo de alguna de las dos personas quedaría mintiendo.
 */
export function SaldarReembolso({
  gastoId,
  monto,
  cuentasDesde,
  cuentasHacia,
  hoy,
}: {
  gastoId: string;
  monto: number;
  /** Cuentas de quien debe devolver. */
  cuentasDesde: CuentaRow[];
  /** Cuentas de quien pagó y va a cobrar. */
  cuentasHacia: CuentaRow[];
  /** La fecha de hoy en Lima, calculada en el servidor. */
  hoy: string;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    crearReembolso,
    {},
  );
  const ref = useAlGuardar(estado, "Devolución registrada");

  if (cuentasDesde.length === 0 || cuentasHacia.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Para registrar esta devolución, las dos personas necesitan al menos
        una cuenta propia en Billeteras.
      </p>
    );
  }

  return (
    <form ref={ref} action={action} className="flex flex-col gap-6">
      <input type="hidden" name="gasto_id" value={gastoId} />
      <input type="hidden" name="fecha" value={hoy} />
      <input type="hidden" name="monto" value={monto} />

      <fieldset className="flex flex-col gap-2.5">
        <Label asChild>
          <legend>Sale de</legend>
        </Label>
        <div className="grid grid-cols-2 gap-2.5">
          {cuentasDesde.map((cuenta) => (
            <TarjetaOpcion
              key={cuenta.id}
              name="desde_cuenta_id"
              value={cuenta.id}
              titulo={cuenta.nombre}
              pie={TIPOS_CUENTA[cuenta.tipo]}
              punto={claseColor(cuenta.color)}
              required
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <Label asChild>
          <legend>Entra a</legend>
        </Label>
        <div className="grid grid-cols-2 gap-2.5">
          {cuentasHacia.map((cuenta) => (
            <TarjetaOpcion
              key={cuenta.id}
              name="hacia_cuenta_id"
              value={cuenta.id}
              titulo={cuenta.nombre}
              pie={TIPOS_CUENTA[cuenta.tipo]}
              punto={claseColor(cuenta.color)}
              required
            />
          ))}
        </div>
      </fieldset>

      <ErrorForm estado={estado} />
      <BotonGuardar>{`Registrar devolución de ${soles(monto)}`}</BotonGuardar>
    </form>
  );
}

// ---------------------------------------------------------------------------

/**
 * Sacar efectivo, recargar el Yape desde el banco: mover plata entre dos
 * cuentas cualquiera, sin que eso salde una devolución ni sea un gasto de
 * la casa. Cualquier cuenta puede ser el origen o el destino de cualquier
 * otra — a diferencia de Saldar, aquí no importa de quién es cada una.
 */
export function MoverDinero({
  cuentas,
  hoy,
}: {
  cuentas: CuentaRow[];
  /** La fecha de hoy en Lima, calculada en el servidor. */
  hoy: string;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    moverDinero,
    {},
  );
  const ref = useAlGuardar(estado, "Dinero movido");

  if (cuentas.length < 2) {
    return (
      <p className="text-xs text-muted-foreground">
        Hace falta al menos dos cuentas para mover dinero entre ellas.
      </p>
    );
  }

  return (
    <Plegable titulo="Mover dinero entre cuentas">
      <form ref={ref} action={action} className="flex flex-col gap-6">
        <input type="hidden" name="fecha" value={hoy} />

        <fieldset className="flex flex-col gap-2.5">
          <Label asChild>
            <legend>Sale de</legend>
          </Label>
          <div className="grid grid-cols-2 gap-2.5">
            {cuentas.map((cuenta) => (
              <TarjetaOpcion
                key={cuenta.id}
                name="desde_cuenta_id"
                value={cuenta.id}
                titulo={cuenta.nombre}
                pie={`${NOMBRES[cuenta.persona]} · ${TIPOS_CUENTA[cuenta.tipo]}`}
                punto={claseColor(cuenta.color)}
                required
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2.5">
          <Label asChild>
            <legend>Entra a</legend>
          </Label>
          <div className="grid grid-cols-2 gap-2.5">
            {cuentas.map((cuenta) => (
              <TarjetaOpcion
                key={cuenta.id}
                name="hacia_cuenta_id"
                value={cuenta.id}
                titulo={cuenta.nombre}
                pie={`${NOMBRES[cuenta.persona]} · ${TIPOS_CUENTA[cuenta.tipo]}`}
                punto={claseColor(cuenta.color)}
                required
              />
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monto-mover">Monto (S/)</Label>
          <Input
            id="monto-mover"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <ErrorForm estado={estado} />
        <BotonGuardar>Mover</BotonGuardar>
      </form>
    </Plegable>
  );
}
