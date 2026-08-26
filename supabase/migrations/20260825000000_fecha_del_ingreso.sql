-- Un ingreso solo sabía de qué mes era, así que la pantalla de ingresos no
-- podía contestar "¿qué entró el martes?" — que es como se recuerda un sueldo
-- o una venta. Misma columna y mismo formato que ya tienen los gastos.

-- Nula primero y con relleno después: con `not null default current_date` de
-- una vez, todo el histórico quedaría fechado hoy.
alter table public.ingresos add column if not exists fecha date;

-- Lo ya cargado se fecha con el día en que se registró, en la hora de Lima:
-- un ingreso guardado a las 8 de la noche es de ese día, no del siguiente en UTC.
update public.ingresos
  set fecha = (created_at at time zone 'America/Lima')::date
  where fecha is null;

alter table public.ingresos alter column fecha set default current_date;
alter table public.ingresos alter column fecha set not null;

create index if not exists ingresos_fecha_idx on public.ingresos (fecha);
