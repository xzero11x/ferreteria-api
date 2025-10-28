import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { db } from './config/db';
import authRoutes from './routes/auth.routes';
import productosRoutes from './routes/productos.routes';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3001');

// Configuración de middlewares
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoint
app.get('/api/healthcheck', async (req: Request, res: Response) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      message: "Servidor API funcionando y CONECTADO a la Base de Datos!"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al conectar con la Base de Datos.",
    });
  }
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

// Iniciar servidor
try {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
  });
} catch (error: any) {
  console.error(`Error al iniciar el servidor: ${error.message}`);
}


