import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 
process.env['NEXT_PUBLIC_SUPABASE_URL'] || 
atob(process.env['NEXT_PUBLIC_DEFAULT_SUPABASE_URL_BASE64']!);

const supabaseAnonKey = 
process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ||
atob(process.env['NEXT_PUBLIC_DEFAULT_SUPABASE_KEY_BASE64']!);

export const supabase = createClient(supabaseUrl,supabaseAnonKey);