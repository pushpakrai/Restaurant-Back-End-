const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Reservation = require('../models/Reservation');
const { getTenantFromRequest } = require('../config/tenant');
const { generateOtp, verifyOtp } = require('../utils/otpService');
const { sendOtpEmail, sendReservationEmail } = require('../utils/emailService');

// POST /api/reservations/send-otp
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const tenant = getTenantFromRequest(req);
  if (!email) return res.status(400).json({ message: 'Email registry is required' });

  try {
    const code = generateOtp(email);
    await sendOtpEmail(email, code, tenant);
    return res.json({ success: true, message: 'Access code dispatched' });
  } catch (err) {
    return res.status(500).json({ message: 'Communication failure' });
  }
});

// POST /api/reservations/verify-and-book
router.post('/verify-and-book', async (req, res) => {
  const { name, email, date, time, guests, specialRequests, otp } = req.body;
  const tenant = getTenantFromRequest(req);

  if (!verifyOtp(email, otp)) {
    return res.status(401).json({ message: 'Invalid or expired access code' });
  }

  try {
    const reservation = new Reservation({
      name: name || 'Valued Guest',
      email,
      date,
      time,
      guests: parseInt(guests),
      specialRequests: specialRequests || '',
      confirmationCode: `RES-${Math.random().toString(36).toUpperCase().slice(2, 8)}`,
    });

    await reservation.save();

    // Background: Send Confirmation
    sendReservationEmail(reservation, tenant).catch(e => console.error('Reservation email failed', e));

    res.status(201).json({
      message: 'Identity verified and reservation secured.',
      reservation
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /api/reservations (Admin/Authenticated view)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { email: req.user.email };
    const list = await Reservation.find(filter).sort({ createdAt: -1 });
    res.json({ reservations: list });
  } catch (err) {
    res.status(500).json({ message: 'Could not retrieve sanctuary bookings' });
  }
});

module.exports = router;
