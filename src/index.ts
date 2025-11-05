import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import { db } from './config/db';
import authRoutes from './routes/auth.routes';
import productosRoutes from './routes/productos.routes';
import categoriasRoutes from './routes/categorias.routes';
import clientesRoutes from './routes/clientes.routes';
import proveedoresRoutes from './routes/proveedores.routes';
import pedidosRoutes from './routes/pedidos.routes';
import ventasRoutes from './routes/ventas.routes';
import inventarioRoutes from './routes/inventario.routes';
import ordenesCompraRoutes from './routes/ordenes-compra.routes';
import tenantRoutes from './routes/tenant.routes';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3001');

// Configuración de middlewares
// CORS dinámico por entorno — soporta lista y comodín *.localhost:5173
const corsOriginsEnv = process.env.CORS_ORIGINS || 'http://localhost:5173';
const allowedOrigins = corsOriginsEnv.split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // permitir herramientas como Postman
    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === origin) return true;
      // soporte simple para comodín http://*.localhost:5173
      if (allowed.includes('*.localhost') && origin.startsWith('http://') && origin.endsWith(':5173')) {
        return origin.includes('.localhost');
      }
      // soporte simple para https://*.tudominio.com
      if (allowed.includes('*') && allowed.startsWith('https://') && allowed.endsWith('.com')) {
        const base = allowed.replace('https://*.', '');
        return origin.startsWith('https://') && origin.endsWith('.' + base);
      }
      return false;
    });
    if (isAllowed) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
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
app.use('/api/categorias', categoriasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/compras', ordenesCompraRoutes);
app.use('/api/tenant', tenantRoutes);

// Iniciar servidor
try {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
  });
} catch (error: any) {
  console.error(`Error al iniciar el servidor: ${error.message}`);
}


