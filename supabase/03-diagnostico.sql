-- ============================================================================
-- Diagnóstico de las notificaciones push.
--
-- Se puede correr cuantas veces haga falta, no cambia ningún dato: solo informa.
-- Pegar todo en Supabase → SQL Editor → Run, y mirar (o copiar) las filas del resultado.
--
-- Qué muestra cada fila:
--   1. tipos de columnas    : para confirmar que la consulta de recordatorios calza con el esquema.
--   2. dispositivos         : qué teléfonos/navegadores están anotados para recibir avisos.
--   3. tarea programada     : si el cron está corriendo cada minuto y cómo le fue.
--   4. avisos ya enviados   : qué se mandó hoy.
--   5. a enviar ahora mismo : lo que la función mandaría en este instante (o el error que da).
-- ============================================================================

create or replace function public.diagnostico_push()
returns table (paso text, detalle text)
language plpgsql
as $$
declare
  error_texto text;
begin
  return query
    select
      '1. tipos de columnas'::text,
      coalesce(string_agg(c.table_name || '.' || c.column_name || '=' || c.data_type, ', ' order by c.table_name, c.column_name), 'no se encontraron las tablas')::text
    from information_schema.columns c
    where c.table_schema = 'public'
      and (
        (c.table_name = 'habitos'  and c.column_name in ('uuid', 'user_id', 'nombre', 'fecha_inicio', 'hora_preferida', 'dias_semana', 'frecuencia', 'estado'))
        or (c.table_name = 'registros' and c.column_name in ('habito_uuid', 'fecha', 'user_id'))
      );

  return query
    select
      '2. dispositivos anotados'::text,
      coalesce(
        string_agg(
          left(s.endpoint, 45) || '… tz=' || s.zona_horaria || coalesce(' ÚLTIMO ERROR: ' || s.ultimo_error, ''),
          ' || '
        ),
        'ninguno (falta prender el interruptor en la app)'
      )::text
    from public.push_subscriptions s;

  begin
    return query
      select
        '3. tarea programada'::text,
        coalesce(
          string_agg(to_char(x.start_time, 'HH24:MI:SS') || ' ' || x.status || ' ' || coalesce(left(x.return_message, 80), ''), ' || '),
          'todavía no corrió ninguna vez'
        )::text
      from (select * from cron.job_run_details order by start_time desc limit 5) x;
  exception when others then
    error_texto := sqlerrm;
    return query select '3. tarea programada'::text, ('no se pudo leer: ' || error_texto)::text;
  end;

  return query
    select
      '4. avisos enviados hoy'::text,
      coalesce(string_agg(e.habito_uuid::text || ' ' || to_char(e.enviado_en, 'HH24:MI'), ', '), 'ninguno')::text
    from public.push_enviados e
    where e.fecha_local >= current_date - 1;

  begin
    return query
      select
        '5. a enviar ahora mismo'::text,
        coalesce(string_agg(r.nombre || ' (' || r.hora_preferida || ')', ', '), 'nada pendiente en este momento')::text
      from public.recordatorios_a_enviar() r;
  exception when others then
    error_texto := sqlerrm;
    return query select '5. a enviar ahora mismo'::text, ('ERROR: ' || error_texto)::text;
  end;
end;
$$;

select * from public.diagnostico_push();
