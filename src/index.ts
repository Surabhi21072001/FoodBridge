import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import listingRoutes from './routes/listingRoutes';
import reservationRoutes from './routes/reservationRoutes';
import pantryAppointmentRoutes from './routes/pantryAppointmentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import pantryInventoryRoutes from './routes/pantryInventoryRoutes';
import pantryOrderRoutes from './routes/pantryOrderRoutes';
import preferenceRoutes from './routes/preferenceRoutes';
import volunteerRoutes from './routes/volunteerRoutes';
import chatRoutes from './routes/chatRoutes';
import pantryCartRoutes from './routes/pantryCartRoutes';
import eventFoodRoutes from './routes/eventFoodRoutes';
import providerMetricsRoutes from './routes/providerMetricsRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';

// Import scheduler
import { startSeedListingsRefreshJob } from './scheduler/seedListingsRefresh';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased for development
  message: 'Too many requests from this IP, please try again later.',
  skip: () => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disable caching for API responses
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/pantry/appointments', pantryAppointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pantry/inventory', pantryInventoryRoutes);
app.use('/api/pantry/orders', pantryOrderRoutes);
app.use('/api/pantry/cart', pantryCartRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/event-food', eventFoodRoutes);
app.use('/api/provider/metrics', providerMetricsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FoodBridge API server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  // Keep seed listing dates fresh so they never expire
  startSeedListingsRefreshJob();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
