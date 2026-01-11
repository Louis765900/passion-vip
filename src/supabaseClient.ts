import { createClient } from '@supabase/supabase-js'

// Ces clés seront dans ton fichier .env (sécurité)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)