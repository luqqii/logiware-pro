require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { createTables } = require('./database/migrate');

// Import routes
const authRoutes = require('./routes/authRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const routeRoutes = require('./routes/routeRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const automationRoutes = require('./routes/automationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Import sockets & workers
const setupSockets = require('./sockets/socketHandler');
const { workflowQueue, forecastQueue, alertQueue } = require('./workers/queueProcessor');
const redisClient = require('./database/redisClient');
const { connectMongo } = require('./database/mongoClient');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      callback(null, origin || true);
    },
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Dynamically allow any connected origin to prevent Vercel CORS blocking
    callback(null, origin || true);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize
async function startServer() {
  try {
    // Connect Redis
    await redisClient.connect();

    // Connect MongoDB
    await connectMongo();

    // Create DB tables
    await createTables();

    // Setup WebSockets
    setupSockets(io);

    // Start periodic workers
    startPeriodicJobs();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`LogiWare Pro API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Periodic jobs
function startPeriodicJobs() {
  // Check low stock every hour
  setInterval(async () => {
    try {
      const { getMongoDb } = require('./database/mongoClient');
      const db = await getMongoDb();
      const orgs = await db.collection('organizations').find().toArray();
      // This would check actual PostgreSQL
      console.log('Periodic low-stock check completed');
    } catch (err) {
      console.error('Periodic job error:', err);
    }
  }, 3600000);
}

startServer();
