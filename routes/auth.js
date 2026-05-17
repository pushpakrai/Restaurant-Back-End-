const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { getTenantFromRequest } = require('../config/tenant');
const { logger } = require('../utils/logger');

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// 🛡️ ADMIN SEEDER (Internal helper, or checks during specific logins)
const SEED_ADMIN_EMAIL = 'admin@diamondqueen.com';
const SEED_ADMIN_PASS = 'DiamondQueen2026!'; // Only used if not already in DB

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ message: 'User already exists' });

      // Identify admin based on reserved email
      const role = email.toLowerCase() === SEED_ADMIN_EMAIL ? 'admin' : 'user';

      const user = new User({ name, email: email.toLowerCase(), password, role });
      await user.save();

      const token = generateToken(user);
      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      logger.error('Registration error', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email: email.toLowerCase() });

      // 🏺 Auto-Seed Admin if and only if it's the first time
      if (!user && email.toLowerCase() === SEED_ADMIN_EMAIL && password === SEED_ADMIN_PASS) {
        user = new User({
          name: 'The Royal Admin',
          email: SEED_ADMIN_EMAIL,
          password: SEED_ADMIN_PASS,
          role: 'admin'
        });
        await user.save();
        logger.info('Admin account seeded upon first login.');
      }

      if (!user) return res.status(401).json({ message: 'Invalid email or password' });

      const valid = await user.comparePassword(password);
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

      const token = generateToken(user);
      res.json({
        message: `Welcome back, ${user.name}`,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, loyaltyPoints: user.loyaltyPoints },
      });
    } catch (err) {
      logger.error('Login error', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
);

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Session expired' });
  }
});

module.exports = router;
