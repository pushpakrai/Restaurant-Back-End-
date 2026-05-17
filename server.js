const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const paymentWebhook = require('./routes/paymentWebhook');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');

dotenv.config();

const app = express();

const origins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
    credentials: true,
  })
);

app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentWebhook);

app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.json({
    message: '💎 Welcome to the Cafe Diamond Queen API Backend',
    status: 'Running Securely',
    frontend_url: 'https://resturant-front-end.onrender.com'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/tenant', require('./routes/tenant'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/custom-ai', require('./routes/custom-ai'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/utils', require('./routes/utils'));
app.use('/api/admin', require('./routes/admin'));

app.use(errorHandler);

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    logger.warn('MONGO_URI not set — skipping MongoDB');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.warn('MongoDB not connected — continuing without database', { message: err.message });
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
