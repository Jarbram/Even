-- Mover dinero al ahorro: sumar al saldo, no reescribirlo.
--
-- Leer el saldo, sumar en JavaScript y volver a escribirlo perdería un aporte
-- si los dos guardan a la vez — y con dinero eso no es aceptable. Sumar dentro
-- de la base es atómico y no necesita bloqueos.

create or replace function public.aportar_a_fondo(
  fondo_id uuid,
  aporte numeric
)
returns numeric
language sql
security definer
set search_path = public
as $$
  update public.fondos
     set saldo = greatest(saldo + aporte, 0)
   where id = fondo_id
  returning saldo;
$$;

-- greatest(..., 0): retirar más de lo que hay deja el fondo en cero en vez de
-- en negativo, que es lo que dice el check de la columna.

revoke all on function public.aportar_a_fondo(uuid, numeric) from anon, authenticated;
