-- A dónde entra la plata: a una cuenta (tarjeta, efectivo, Yape) o directa al
-- ahorro. Nunca a las dos, de ahí el check.

alter table public.ingresos
  add column if not exists cuenta_id uuid references public.cuentas (id) on delete set null,
  add column if not exists fondo_id  uuid references public.fondos (id)  on delete set null;

do $$
begin
  alter table public.ingresos
    add constraint ingresos_un_solo_destino
    check (num_nonnulls(cuenta_id, fondo_id) <= 1);
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Un ingreso que va al ahorro tiene que hacer crecer el fondo. Si eso lo
-- hiciera la app en dos pasos —insertar y luego sumar—, un fallo entre medias
-- dejaría el ingreso registrado y el fondo sin su plata.
--
-- Con un trigger las dos cosas ocurren en la misma transacción, y el borrado
-- deshace el aporte sin que la app tenga que acordarse.
-- ---------------------------------------------------------------------------
create or replace function public.aplicar_ingreso_a_fondo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.fondo_id is not null then
    update public.fondos
       set saldo = saldo + new.monto
     where id = new.fondo_id;

  elsif tg_op = 'DELETE' and old.fondo_id is not null then
    -- greatest(...,0): si alguien vació el fondo a mano, restar no lo deja en
    -- negativo, que es lo que prohíbe el check de la columna.
    update public.fondos
       set saldo = greatest(saldo - old.monto, 0)
     where id = old.fondo_id;
  end if;

  return coalesce(new, old);
end $$;

-- Solo INSERT y DELETE: los ingresos no se editan, se borran y se vuelven a
-- crear. El día que se editen, este trigger necesita su rama UPDATE.
drop trigger if exists ingresos_al_fondo on public.ingresos;
create trigger ingresos_al_fondo
  after insert or delete on public.ingresos
  for each row execute function public.aplicar_ingreso_a_fondo();

create index if not exists ingresos_fondo_idx on public.ingresos (fondo_id);
