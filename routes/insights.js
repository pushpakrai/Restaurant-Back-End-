const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../utils/logger');
const { getTenantFromRequest } = require('../config/tenant');

const router = express.Router();

/** @type {{ id: string, text: string, rating: number, createdAt: string, sentiment?: string }[]} */
const feedbackStore = [];

function adminAuth(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key || req.get('x-admin-key') !== key) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

/** Free weather — Open-Meteo, no API key */
async function fetchWeatherPune() {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current_weather=true';
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return data?.current_weather || null;
  } catch {
    return null;
  }
}

/**
 * AI-driven homepage spotlight: time + weather + light menu heuristics.
 */
router.get('/menu-spotlight', async (req, res, next) => {
  try {
    const tenant = getTenantFromRequest(req);
    const hour = new Date().getHours();
    const weather = await fetchWeatherPune();
    const temp = weather?.temperature;
    const code = weather?.weathercode;
    const isRain = code != null && [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code);

    let headline = 'Chef-curated picks for right now';
    const featured = [];

    if (isRain || (temp != null && temp < 22)) {
      headline = 'Rainy Pune afternoon — warm Irani chai & comfort plates';
      featured.push('Masala Chai', 'Chicken Biryani', 'Dal Makhani');
    } else if (hour < 11) {
      headline = 'Morning at the café — breakfast classics';
      featured.push('Poha', 'Masala Chai', 'Vada Pav');
    } else if (hour < 16) {
      headline = 'Lunch service — thalis & grills';
      featured.push('Thali', 'Grilled Sandwich', 'Mango Lassi');
    } else {
      headline = 'Evening dining — slow-cooked gravies';
      featured.push('Butter Chicken', 'Paneer Tikka Masala', 'Gulab Jamun');
    }

    res.json({
      tenantId: tenant.id,
      headline,
      featured,
      context: {
        hour,
        weather: weather
          ? { temperatureC: temp, code, isRain }
          : { unavailable: true },
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/feedback', (req, res) => {
  const { text, rating = 5 } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: 'Feedback text required' });
  }
  const entry = {
    id: `fb_${Date.now()}`,
    text: String(text).trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    createdAt: new Date().toISOString(),
  };
  feedbackStore.unshift(entry);
  feedbackStore.splice(200);
  res.status(201).json({ ok: true, id: entry.id });
});

/**
 * Admin: batch sentiment labels via Gemini when key present, else keyword heuristic.
 */
router.get('/admin/sentiment-summary', adminAuth, async (req, res) => {
  const sample = feedbackStore.slice(0, 40);
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key || key === 'dummy_key') {
    const buckets = { positive: 0, neutral: 0, negative: 0 };
    for (const f of sample) {
      const t = f.text.toLowerCase();
      if (/bad|slow|cold|worst|never/.test(t)) buckets.negative += 1;
      else if (/great|love|best|amazing|excellent/.test(t)) buckets.positive += 1;
      else buckets.neutral += 1;
    }
    return res.json({ mode: 'heuristic', total: feedbackStore.length, buckets, sample });
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    const prompt = `You are an ops analyst. For each JSON review, respond with ONLY valid JSON array of objects {id, sentiment: "positive"|"neutral"|"negative", theme: string}.
Reviews: ${JSON.stringify(sample.map((s) => ({ id: s.id, text: s.text })))}`;
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
    } catch {
      parsed = [];
    }
    res.json({ mode: 'gemini', total: feedbackStore.length, labels: parsed, sample });
  } catch (e) {
    logger.warn('Sentiment Gemini failed', { message: e.message });
    res.status(500).json({ message: 'Sentiment analysis failed' });
  }
});

module.exports = router;
