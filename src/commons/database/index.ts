import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno inmediatamente
// Fix: Property 'cwd' does not exist on type 'Process'. Use path.resolve('.env') which defaults to the current working directory.
dotenv.config({ path: path.resolve('.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Faltan credenciales de Supabase en el .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);