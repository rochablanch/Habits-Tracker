-- ============================================================================
-- Recordatorios que llegan con la app cerrada (Web Push)  —  parte 2 de 2
--
-- Programa la tarea que, una vez por minuto, le pide al servidor que revise si hay algún
-- recordatorio para mandar. Correr DESPUÉS de haber creado la Edge Function
-- "enviar-recordatorios" (si no, la tarea va a fallar hasta que exista).
--
-- ANTES DE CORRER: reemplazá PEGAR_CRON_SECRET_ACA por el valor que guardaste como
-- CRON_SECRET en los secretos de la Edge Function (tiene que ser idéntico).
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya existía de una corrida anterior, se reemplaza.
select cron.unschedule('recordatorios-push')
where exists (select 1 from cron.job where jobname = 'recordatorios-push');

select cron.schedule(
  'recordatorios-push',
  '* * * * *',  -- cada minuto
  $$
  select net.http_post(
    url     := 'https://lthmglnzycsknqpkxnsl.supabase.co/functions/v1/enviar-recordatorios',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', 'PEGAR_CRON_SECRET_ACA'
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- Limpieza semanal de los avisos ya enviados (los domingos a las 4 de la mañana).
select cron.unschedule('limpiar-push-enviados')
where exists (select 1 from cron.job where jobname = 'limpiar-push-enviados');

select cron.schedule('limpiar-push-enviados', '0 4 * * 0', $$ select public.limpiar_push_enviados(); $$);

-- Para revisar cómo viene la tarea:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 20;
