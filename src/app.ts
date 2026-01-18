
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { CONFIG } from './commons/configs';

const app = express();

// Middleware de CORS abierto para desarrollo
app.use(cors({ origin: '*' }) as any);
app.use(express.json() as any);

// Middleware de Logging personalizado
app.use((req: any, res: any, next: any) => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
});

// Rutas
app.use(CONFIG.API_PREFIX, apiRoutes);

// Error 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada en el backend modular' });
});

// Manejo de errores global
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error detectado:', err);
  res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
});

export default app;
