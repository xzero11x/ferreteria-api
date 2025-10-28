// 'import' ---> "esModuleInterop": true
import express from 'express';
// Importamos los *tipos* de Express
import { Application, Request, Response } from 'express';
import cors from 'cors';

// Inicializa la aplicación Express
const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3001'); // Puerto para la API

// --- Configuración de Middlewares ---

// Configura CORS (para permitir peticiones desde tu frontend en desarrollo)
app.use(cors({
  origin: 'http://localhost:5173' // El puerto donde correrá Vite/React
}));


app.use(express.json());
// Permite a Express entender datos de formularios
app.use(express.urlencoded({ extended: true }));


// --- Rutas ---
// Ruta preuba - verificar que el servidor funcione bien
app.get('/api/healthcheck', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Servidor API funcionando correctamente" 
  });
});

// (uturas rutas, ej: app.use('/api/auth', authRoutes))


// --- Iniciar el Servidor ---
try {
  app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
  });
} catch (error: any) {
  console.error(`Error al iniciar el servidor: ${error.message}`);
}
