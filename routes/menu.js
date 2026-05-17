const express = require('express');
const { getMenuItems } = require('../data/menuData');
const { getTenantFromRequest } = require('../config/tenant');
const { fetchFoodPhotoUrl } = require('../utils/unsplash');
const { logger } = require('../utils/logger');
const { sendOrderReceipt } = require('../utils/emailService');

const fs = require('fs');
const path = require('path');

const router = express.Router();

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200&h=800';

const CACHE_FILE = path.join(__dirname, '../utils/imageCache.json');
let imageCache = new Map();

// Load persistent cache on startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    imageCache = new Map(Object.entries(data));
  }
} catch (e) {
  console.warn('Could not load image cache file', e.message);
}

function saveCache() {
  try {
    const data = Object.fromEntries(imageCache);
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('Could not save image cache file', e.message);
  }
}

// Premium Category Fallbacks (Guaranteed Luxury visual even if API fails)
const FALLBACKS = {
  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=800',
  Brunch: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800',
  Lunch: 'https://images.unsplash.com/photo-1582576163090-6c515f9f6024?auto=format&fit=crop&q=80&w=800',
  Dinner: 'https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?auto=format&fit=crop&q=80&w=800',
  Beverages: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=80&w=800',
  Desserts: 'https://images.unsplash.com/photo-1589119634773-84093a1b58bb?auto=format&fit=crop&q=80&w=800',
  default: PLACEHOLDER
};

function cacheKey(tenantId, category, name) {
  return `${tenantId}|${category}|${name}`;
}

/**
 * PRODUCTION-GRADE ENRICHMENT
 * Returns INSTANTLY. Enrichment happens in background.
 */
function enrichMenuForTenant(tenant) {
  const tid = tenant?.id || 'default';
  const queries = tenant?.unsplashQueries || {};
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  const tenantMenu = getMenuItems(tid);

  if (!Array.isArray(tenantMenu) || tenantMenu.length === 0) {
    logger.warn('Tenant menu is empty or missing', { tid });
    return [];
  }

  // Map over categories (sections)
  return tenantMenu.map((section) => {
    const items = section.items.map((item) => {
      const ck = cacheKey(tid, section.category, item.name);
      
      // 1. If we have a cached production image, use it immediately
      if (imageCache.has(ck)) {
        return { ...item, ...imageCache.get(ck) };
      }

      // 2. Local fallback or existing item image
      const categoryFallback = FALLBACKS[section.category] || FALLBACKS.default;
      const initialImage = item.imageUrl && !item.imageUrl.includes('placeholder')
        ? item.imageUrl 
        : categoryFallback;

      // 3. Trigger Background Enrichment (Async)
      if (accessKey && accessKey !== 'dummy_key') {
        const gourmetQuery = `${item.name} ${section.category} Indian cuisine gourmet plated food`;
        fetchFoodPhotoUrl(gourmetQuery, { accessKey })
          .then((metadata) => {
            if (metadata && metadata.url) {
              imageCache.set(ck, { 
                imageUrl: metadata.url, 
                photographer: metadata.photographer,
                downloadLocation: metadata.downloadLocation 
              });
              saveCache();
              logger.info('Background imagery found', { dish: item.name });
            }
          })
          .catch(() => {}); // Failure is silent, user sees fallback
      }

      return { ...item, imageUrl: initialImage };
    });

    return { ...section, items };
  });
}

// GET /api/menu/categories
router.get('/categories', (req, res) => {
  try {
    const tenant = getTenantFromRequest(req);
    const tenantMenu = getMenuItems(tenant?.id || 'default');
    if (!Array.isArray(tenantMenu)) return res.json([]);
    const categories = tenantMenu.map((item) => item?.category).filter(Boolean);
    res.json([...new Set(categories)]);
  } catch (e) {
    logger.error('Failed to get categories', { message: e.message });
    res.status(200).json(['Breakfast', 'Lunch', 'Dinner', 'Beverages']); // Return safe defaults instead of 500
  }
});

// GET /api/menu
router.get('/', async (req, res, next) => {
  try {
    const tenant = getTenantFromRequest(req);
    const payload = enrichMenuForTenant(tenant); // Now synchronous and fast
    res.json(payload);
  } catch (e) {
    logger.error('Menu fetch failed', { message: e.message });
    // Emergency Fallback: Return raw menu data to prevent site breakage
    const fallback = getMenuItems('default');
    res.json(fallback);
  }
});

// GET /api/menu/:category
router.get('/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const tenant = getTenantFromRequest(req);
    const full = await enrichMenuForTenant(tenant);
    const found = full.find((m) => m.category?.toLowerCase() === category.toLowerCase());
    if (!found) return res.status(404).json({ message: 'Category not found' });
    res.json(found);
  } catch (e) {
    next(e);
  }
});

const Order = require('../models/Order');
const User = require('../models/User');

// POST /api/menu/confirm-order
router.post('/confirm-order', async (req, res) => {
  try {
    const { orderId, cart, total, email } = req.body;
    
    // 1. Persist the Order
    if (orderId && cart && total) {
      const order = new Order({
        orderId,
        userEmail: email || 'guest@diamondqueen.com',
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        totalAmount: total,
        status: 'paid'
      });
      await order.save();

      // 2. Update Loyalty (if user exists)
      if (email) {
        const pointsToAdd = Math.floor(total / 10); // 10% loyalty
        await User.findOneAndUpdate(
          { email: email.toLowerCase() },
          { $inc: { loyaltyPoints: pointsToAdd } }
        );
      }
    }

    // 3. Background: Send Receipts
    if (email && cart) {
      sendOrderReceipt({ email, orderId, cart, total }).catch((err) =>
        logger.warn('Receipt email failed (non-fatal)', { message: err.message })
      );
    }

    res.json({ success: true, message: 'Royal order confirmed and recorded.' });
  } catch (e) {
    logger.error('confirm-order error', { message: e.message });
    res.status(500).json({ success: false });
  }
});

module.exports = router;
