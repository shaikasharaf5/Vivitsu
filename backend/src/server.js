// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv before importing any other modules
const envPath = path.resolve(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error.message);
  console.error('   Make sure .env file exists at:', envPath);
  process.exit(1);
}

console.log(`\n📄 .env file loaded from: ${envPath}`);

// Now import everything else AFTER env vars are loaded
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import assignmentRoutes from './routes/assignments.js';
import verificationRoutes from './routes/verifications.js';
import bidRoutes from './routes/bids.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import { initCloudinary, checkCloudinaryConnection } from './utils/cloudinaryService.js';

// Debug: Show which environment variables are loaded
console.log('\n🔍 Environment Variables Check:');
console.log(`   PORT: ${process.env.PORT ? '✅ Set' : '❌ Not set'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set (' + process.env.CLOUDINARY_CLOUD_NAME + ')' : '❌ Not set'}`);
console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set'}`);

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error('\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
  missingEnvVars.forEach(key => {
    console.error(`   - ${key}`);
  });
  console.error('\n📝 Create a .env file in c:\\Users\\ashar\\OneDrive\\Desktop\\Vivitsu\\backend\\');
  process.exit(1);
}

// Initialize Cloudinary AFTER env vars are loaded
console.log('\n🔧 Initializing Cloudinary...');
initCloudinary();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Check Cloudinary connection on startup
console.log('🔍 Checking Cloudinary connection...');
checkCloudinaryConnection().catch(err => {
  console.warn('⚠️ Cloudinary check failed (image uploads will not work)');
});

// MongoDB Connection
console.log('🔗 Connecting to MongoDB...');

async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: 'majority'
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

connectMongoDB()
  .then(() => {
    // Start server after successful MongoDB connection
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`📦 Node Env: ${process.env.NODE_ENV}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    mongoDb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
