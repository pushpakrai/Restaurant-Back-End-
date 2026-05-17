const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { getTenantFromRequest } = require('../config/tenant');

const router = express.Router();

function hasRazorpayKeys() {
  const id = process.env.RAZORPAY_KEY_ID && String(process.env.RAZORPAY_KEY_ID).trim();
  const secret = process.env.RAZORPAY_KEY_SECRET && String(process.env.RAZORPAY_KEY_SECRET).trim();
  return Boolean(id && secret);
}

function getRazorpayClient() {
  if (!hasRazorpayKeys()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
  });
}

/**
 * @route   POST /api/payment/create-order
 * @desc    Creates a Razorpay order (production).
 */
router.post('/create-order', async (req, res, next) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    const tenant = getTenantFromRequest(req);

    if (!amount || Number(amount) < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const rupees = Number(amount);
    const client = getRazorpayClient();

    if (!client) {
      logger.error('Payment failure: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in production.');
      return res.status(503).json({
        message: 'Payments are not configured for production. Please add Razorpay keys to environment variables.',
        code: 'PAY_UNCONFIGURED',
      });
    }

    const options = {
      amount: Math.round(rupees * 100),
      currency,
      receipt: `rcpt_${tenant.id.slice(0, 4)}_${Date.now()}`,
      notes: { tenantId: tenant.id },
    };

    const order = await client.orders.create(options);
    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID.trim(),
      businessName: tenant.payment.razorpayBusinessName,
      description: tenant.payment.razorpayDescription,
    });
  } catch (err) {
    logger.error('create-order failed', { message: err.message, stack: err.stack });
    res.status(500).json({ message: 'Could not initialize session with payment treasury.' });
  }
});

/**
 * @route   POST /api/payment/verify-signature
 * @desc    Verifies payment signature securely using the Secret Key.
 */
router.post('/verify-signature', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  if (!razorpay_signature || !hasRazorpayKeys()) {
    return res.status(400).json({ success: false, message: 'Invalid verification state' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET.trim())
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    logger.info('Live payment verified', { razorpay_order_id, razorpay_payment_id });
    return res.json({ success: true, message: 'Payment authenticated' });
  }

  logger.warn('Invalid payment signature', { razorpay_order_id });
  return res.status(400).json({ success: false, message: 'Signature mismatch' });
});

/** Lightweight capability probe for the checkout UI */
router.get('/status', (req, res) => {
  res.json({
    configured: hasRazorpayKeys(),
    mode: hasRazorpayKeys() ? 'live' : 'unavailable',
  });
});

module.exports = router;
