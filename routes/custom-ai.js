const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getMenuItems } = require('../data/menuData');
const { getTenantFromRequest } = require('../config/tenant');
const { fetchFoodPhotoUrl } = require('../utils/unsplash');
const { logger } = require('../utils/logger');

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function hasGemini() {
  const k = process.env.GEMINI_API_KEY?.trim();
  return Boolean(k && k !== 'dummy_key');
}

function buildMenuCorpus(specificItems) {
  const lines = [];
  for (const cat of specificItems) {
    for (const it of cat.items) {
      lines.push(`- ${it.name} (${cat.category}): ${it.desc}. ₹${it.price}.`);
    }
  }
  return lines.join('\n');
}

function keywordMenuMatch(message, specificItems) {
  const msg = String(message || '').toLowerCase();
  const hits = [];
  for (const cat of specificItems) {
    for (const it of cat.items) {
      const n = it.name.toLowerCase();
      if (msg.includes('veg') && /chicken|mutton|fish|egg/.test(n)) continue;
      if (
        msg.split(/\s+/).some((w) => w.length > 2 && (n.includes(w) || it.desc.toLowerCase().includes(w)))
      ) {
        hits.push({ ...it, category: cat.category });
      }
    }
  }
  return hits.slice(0, 5);
}

/**
 * RAG-style concierge: live menu text in the prompt, optional Gemini generation.
 */
router.post('/chat', async (req, res) => {
  const tenant = getTenantFromRequest(req);
  const items = getMenuItems(tenant.id);
  
  const message = String(req.body?.message || '').trim();
  if (!message) {
    return res.json({
      reply: `Ask ${tenant.brand.conciergeName} about dietary preferences, reservations, or dishes.`,
    });
  }

  const corpus = buildMenuCorpus(items);
  const matches = keywordMenuMatch(message, items);
  const matchSummary =
    matches.length > 0
      ? `Strong menu matches: ${matches.map((m) => `${m.name} (₹${m.price})`).join('; ')}.`
      : 'No direct name match; suggest categories from the corpus.';

  if (!hasGemini()) {
    const fallback =
      matches.length > 0
        ? `${matchSummary} I recommend starting with ${matches[0].name} — it fits what you described. For allergies or spice level, tell me more.`
        : `I have our full menu loaded. Try naming a protein (paneer, chicken), a style (biryani, thali), or “something spicy and vegetarian” and I will narrow it down.`;
    return res.json({ reply: fallback, matches });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are "${tenant.brand.conciergeName}", concierge for ${tenant.brand.name}.
Use ONLY this menu:
${corpus}
User: "${message}"
Reply in 3 short sentences.`;
    
    const result = await model.generateContent(prompt);
    const text = (await result.response.text()).trim();
    return res.json({ reply: text || matchSummary, matches });
  } catch (e) {
    logger.warn('custom-ai chat failed', { message: e.message });
    return res.json({
      reply: matches.length > 0 
        ? `${matchSummary} (AI Concierge is currently offline — showing direct menu matches.)`
        : 'The AI Concierge is currently busy perfecting our recipes. Please try naming a dish or category.',
      matches,
    });
  }
});

function localDishFallback(base, tenant) {
  const adjectives = ['Signature', 'Royal', 'Spiced', 'Aromatic', 'Artisan', 'Chef Special'];
  const nouns = ['Fusion', 'Delight', 'Platter', 'Sensation', 'Medley', 'Bowl'];
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const name = `${rand(adjectives)} ${rand(nouns)} — Inspired by You`;
  const price = 220 + (Math.floor(Math.random() * 300));
  
  return {
    name,
    price,
    description: `A unique craft dish inspired by your craving for "${base}". Prepared live by our Diamond Chef (AI Offline Mode).`,
    category: 'Chef Custom',
    emoji: '💎',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=900',
  };
}

router.post('/generate-dish', async (req, res) => {
  const { input } = req.body || {};
  if (!input || !String(input).trim()) {
    return res.status(400).json({ message: 'Describe your cravings.' });
  }

  const tenant = getTenantFromRequest(req);
  const base = String(input).trim();

  if (!hasGemini()) {
    return res.json(localDishFallback(base, tenant));
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `Generate a gourmet dish for: "${base}". Output ONLY JSON: {"name":"str","price":num,"description":"str","emoji":"str"}`;
    
    const result = await model.generateContent(prompt);
    const raw = (await result.response.text()).trim().replace(/^```json\s*|\s*```$/g, '');
    let parsed = JSON.parse(raw);

    let imageUrl = null;
    try {
      imageUrl = await fetchFoodPhotoUrl(`${parsed.name} plated`);
    } catch {}

    return res.json({
      ...parsed,
      price: Math.round(Number(parsed.price) || 320),
      category: 'Chef Custom',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=900',
    });
  } catch (e) {
    const msg = e.message?.toLowerCase() || '';
    if (msg.includes('429') || msg.includes('quota')) {
      logger.info('Gemini Quota hit in generate-dish, using fallback');
    } else {
      logger.error('generate-dish error', { message: e.message });
    }
    return res.json(localDishFallback(base, tenant));
  }
});

module.exports = router;
