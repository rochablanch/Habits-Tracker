import { createClient } from '@supabase/supabase-js'

/**
 * La "publishable key" está pensada para exponerse en el cliente (no es secreta):
 * la seguridad real la da RLS (Row Level Security) en la base de datos, no ocultar esta clave.
 */
const SUPABASE_URL = 'https://lthmglnzycsknqpkxnsl.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sz0gKepX4Wtc7D3gclUDwQ_ty0X_IQJ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
