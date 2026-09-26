-- ============================================================================
-- Reintentar los recordatorios de hoy (herramienta de prueba).
--
-- El servidor manda el aviso de cada hábito UNA sola vez por día: cuando lo manda, lo anota en
-- `push_enviados` y no lo vuelve a intentar. Eso evita molestar con avisos repetidos, pero
-- también significa que si un aviso se perdió (el teléfono lo descartó, estaba sin señal, el
-- sistema lo retuvo), no hay segundo intento hasta el otro día.
--
-- Borrar esas marcas hace que, en el próximo minuto, el servidor vuelva a mandar todos los
-- recordatorios de hoy que sigan sin marcar. Sirve para probar el camino completo sin esperar
-- al día siguiente: correr esto con la app cerrada y la pantalla apagada, y esperar un minuto.
--
-- No borra ningún dato de los hábitos ni de los registros: solo el "ya avisé de esto hoy".
-- ============================================================================

delete from public.push_enviados where fecha_local >= current_date - 1;

-- Qué va a mandar el servidor en el próximo minuto:
select nombre, hora_preferida from public.recordatorios_a_enviar();
