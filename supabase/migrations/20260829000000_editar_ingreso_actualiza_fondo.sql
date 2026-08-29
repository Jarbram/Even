-- El trigger que suma un ingreso al fondo cuando entra ("destino del
-- ingreso") solo tenía rama INSERT y DELETE, con este comentario explícito:
-- "El día que se editen, este trigger necesita su rama UPDATE." Ese día
-- llegó: ahora se puede editar un ingreso ya guardado, y si tenía un fondo
-- como destino, cambiar su monto o su destino dejaba el saldo del fondo
-- mintiendo — la fila cambiaba, el número del fondo no.
--
-- La rama UPDATE deshace el aporte viejo (si tenía fondo) y aplica el nuevo
-- (si lo tiene), en la misma transacción. Si el fondo no cambió, deshacer y
-- volver a aplicar da el mismo resultado que ajustar por la diferencia; si
-- cambió de fondo, mueve el aporte del uno al otro.

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

  elsif tg_op = 'UPDATE' then
    if old.fondo_id is not null then
      update public.fondos
         set saldo = greatest(saldo - old.monto, 0)
       where id = old.fondo_id;
    end if;
    if new.fondo_id is not null then
      update public.fondos
         set saldo = saldo + new.monto
       where id = new.fondo_id;
    end if;
  end if;

  return coalesce(new, old);
end $$;

drop trigger if exists ingresos_al_fondo on public.ingresos;
create trigger ingresos_al_fondo
  after insert or update or delete on public.ingresos
  for each row execute function public.aplicar_ingreso_a_fondo();
