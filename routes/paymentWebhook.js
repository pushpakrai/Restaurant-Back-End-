const express = require('express');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Razorpay webhooks must receive the raw body for signature verification.
 * Mount with: app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), router)
 */
router.post('/', (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.get('x-razorpay-signature');

  if (!secret) {
    logger.warn('Webhook received but RAZORPAY_WEBHOOK_SECRET is not set');
    return res.status(503).json({ message: 'Webhook not configured' });
  }

  const body = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body || '');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (!signature || signature !== expected) {
    logger.warn('Invalid Razorpay webhook signature');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  const event = payload.event;
  logger.info('Razorpay webhook', { event, entity: payload.payload?.payment?.entity?.id });

  // Persist orders in DB in production; acknowledge quickly for Razorpay retries.
  if (event === 'payment.captured' || event === 'order.paid') {
    // Hook: emit to queue, update Order model, send receipt email, etc.
  }

  res.json({ received: true });
});

module.exports = router;
