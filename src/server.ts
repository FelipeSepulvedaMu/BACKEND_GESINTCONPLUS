import * as dotenv from 'dotenv';
import path from 'path';

// Cargar .env antes que cualquier otra cosa
// Fix: Property 'cwd' does not exist on type 'Process'. Use path.resolve('.env') which defaults to the current working directory.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
import { CONFIG } from './commons/configs';

// Escuchamos en 0.0.0.0 para que sea accesible desde cualquier IP local
app.listen(CONFIG.PORT, '0.0.0.0', () => {
  console.log(`==========================================`);
  console.log(`🚀 CondoMaster Modular Backend Online`);
  console.log(`📡 URL: http://localhost:${CONFIG.PORT}${CONFIG.API_PREFIX}`);
  console.log(`🛡️  Database: Supabase Cloud`);
  console.log(`📝 Log: Registrando peticiones entrantes...`);
  console.log(`==========================================`);
});
