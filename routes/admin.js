const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');

const isAdmin = [
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Royal Access Only' });
    next();
  }
];

// GET /api/admin/stats
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const totalRevenueArr = await Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = totalRevenueArr[0]?.total || 0;
    const activeUsers = await User.countDocuments();
    const reservationsToday = await Reservation.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    });

    // Mock chart for trend visualization (real data would aggregate by day)
    const revenueChart = [
      { name: 'Mon', revenue: 24000 },
      { name: 'Tue', revenue: 13980 },
      { name: 'Wed', revenue: totalRevenue / 7 },
      { name: 'Thu', revenue: 39080 },
      { name: 'Fri', revenue: 48000 },
      { name: 'Sat', revenue: 68000 },
      { name: 'Sun', revenue: 63000 },
    ];

    res.json({
      metrics: {
        totalRevenue: Math.round(totalRevenue),
        reservationsToday,
        aiEngagement: '92%',
        activeUsers
      },
      revenueChart,
      popularItems: [
        { name: 'Royal Awadhi Biryani', count: 145 },
        { name: 'Signature Handi Biryani', count: 112 },
        { name: 'Diamond Chai', count: 98 },
        { name: 'Vada Pav Royal', count: 87 }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Analytics failure' });
  }
});

// GET /api/admin/recent-activity
router.get('/recent-activity', isAdmin, async (req, res) => {
  try {
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    const activities = recentOrders.map(o => ({
      id: o._id,
      type: 'Order',
      detail: `Order ${o.orderId.slice(-6)} placed by ${o.userEmail}`,
      time: 'Recently',
      amount: o.totalAmount
    }));

    res.json({ activities });
  } catch (err) {
    res.status(500).json({ message: 'Activity feed failure' });
  }
});

module.exports = router;
