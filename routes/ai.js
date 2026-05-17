const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getMenuItems, flattenMenuLines } = require('../data/menuData');
const { getTenantFromRequest } = require('../config/tenant');
const { logger } = require('../utils/logger');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const hasValidGeminiKey = Boolean(
  process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() && process.env.GEMINI_API_KEY !== 'dummy_key'
);

// 🏺 Optimized RAG Context
function getMenuContext(tenantId = 'default') {
  try {
    return flattenMenuLines(tenantId).slice(0, 45).join('; ');
  } catch {
    return "Our menu features signatures like Handi Biryani and Poha.";
  }
}

function staticIntelligence(message, tenant) {
  const msg = String(message || '').toLowerCase();
  
  // Safe categories extraction
  let categoryList = 'Breakfast, Lunch, Dinner, Beverages, Desserts';
  try {
    const raw = getMenuItems(tenant.id);
    categoryList = [...new Set(raw.map((m) => m.category))].join(', ');
  } catch {}

  const addr = tenant.contact?.addressLines?.join(', ') || 'Pune';
  const phone = tenant.contact?.phone || 'our contact line';

  if (/hour|open|close|time|when/.test(msg)) {
    return `We're open ${tenant.hours?.summary || 'Daily'}. ${tenant.hours?.brunchNote || ''}. For a quiet table, book ahead via Reservations.`;
  }
  if (/where|location|address|map|reach/.test(msg)) {
    return `You'll find ${tenant.brand?.name || 'us'} at ${addr}.`;
  }
  if (/reserve|book|table|booking|resevwstions/.test(msg)) {
    return `To secure your table, please navigate to our "Reserve" page or call us directly at ${phone}. We recommend booking 24 hours in advance for weekends.`;
  }
  if (/share me list|what is on menu|show menu|list features/.test(msg)) {
    return `Our current menu features: ${categoryList}. You can browse the full sensory experience with live pricing on the Menu page.`;
  }
  if (/price|cost|how much|₹|rupee|cheap|expensive/.test(msg)) {
    return `Our menu spans quick bites to full spreads — open the Menu page for exact prices, or name a dish like "Butter Chicken" for details.`;
  }
  if (/chai|coffee|drink|beverage|lassi/.test(msg)) {
    return `For drinks, explore Beverages on the menu — masala chai, cold coffee, and lassi are guest favourites.`;
  }
  if (/menu|food|eat|dish|biryani|thali|breakfast|lunch|dinner|brunch|veg|non|chicken|paneer/.test(msg)) {
    return `We serve ${categoryList}. Open the Menu for the full list with imagery and pricing.`;
  }
  if (/hello|hi|hey|namaste/.test(msg)) {
    return `Hello — I'm ${tenant.brand?.conciergeName || 'Diamond AI'} for ${tenant.brand?.name || 'Cafe Diamond Queen'}. Ask about the menu, hours, or reservations.`;
  }
  if (/thank/.test(msg)) {
    return "You're welcome — we're glad to host you.";
  }

  return `I helps you with hours, the menu, reservations, and location. Ask me anything specific!`;
}

let genAI = null;
if (hasValidGeminiKey) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  } catch (e) {
    console.warn('Gemini client init failed:', e.message);
  }
}

async function callGemini(modelName, prompt) {
  if (!genAI) throw new Error('AI Provider not initialized');
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return typeof text === 'string' ? text : await text;
}

router.post('/chat', async (req, res) => {
  const tenant = getTenantFromRequest(req);
  const { message, context = 'general' } = req.body;
  
  if (!message || !String(message).trim()) {
    return res.json({
      reply: `I'm ${tenant.brand?.conciergeName || 'Diamond AI'} — ask about our menu, hours, or reservations.`,
    });
  }

  const trimmed = String(message).trim();

  // 1. Direct Fallback if Gemini key is missing
  if (!genAI || !hasValidGeminiKey) {
    return res.json({ reply: staticIntelligence(trimmed, tenant) });
  }

  try {
    const menuLines = getMenuContext(tenant.id);
    const systemInstruction = context === 'sommelier' 
      ? `You are the "Royal Flavor Sommelier" for ${tenant.brand?.name}. Pair dishes with beverages. Menu: ${menuLines}`
      : `You are "${tenant.brand?.conciergeName}", concierge for ${tenant.brand?.name}. Menu: ${menuLines}`;

    const prompt = `
${systemInstruction}
Location: ${tenant.contact?.addressLines?.join(', ')}. Hours: ${tenant.hours?.summary}.
User: "${trimmed.replace(/"/g, '\\"')}"
Assistant: (Reply in max 3 short sentences)`;

    let reply;
    try {
      // Primary Attempt: 2.0 Flash
      reply = await callGemini(GEMINI_MODEL, prompt);
    } catch (e) {
      if (e.message?.includes('429') || e.message?.includes('quota')) {
        // Fallback Attempt: 1.5 Flash (often has separate quota or higher limits)
        logger.info('429 detected, attempting model fallback to gemini-1.5-flash');
        try {
          reply = await callGemini('gemini-1.5-flash', prompt);
        } catch (e2) {
          throw e2; // Bubble up if both fail
        }
      } else {
        throw e;
      }
    }

    if (!reply) throw new Error('Empty result');
    return res.json({ reply: reply.trim() });
  } catch (err) {
    const errorMsg = err.message?.toLowerCase() || '';
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      logger.warn('Gemini Quota Exceeded (429) - Using Enhanced Static Intelligence');
    } else {
      logger.warn('AI Concierge Error - Using Static Fallback', { error: err.message });
    }
    return res.json({ reply: staticIntelligence(trimmed, tenant) });
  }
});

router.get('/recommendations', (req, res) => {
  const hour = new Date().getHours();
  let reco = { message: 'The house selection awaits.', items: ['Biryani', 'Chai'] };
  if (hour < 11) reco = { message: 'Morning radiance — breakfast classics.', items: ['Poha', 'Masala Chai'] };
  else if (hour < 16) reco = { message: 'Lunch — thalis and grills.', items: ['Thali', 'Chicken Biryani'] };
  else if (hour < 19) reco = { message: 'Afternoon pick-me-up.', items: ['Vada Pav', 'Cold Coffee'] };
  res.json(reco);
});

router.get('/fun-fact', (req, res) => {
  const facts = [
    'Coffee beans are seeds of a fruit called a coffee cherry.',
    'High-quality basmati is aged to deepen aroma before it ever hits the handi.',
    'Irani café culture blends Persian roots with Indian spice routes.'
  ];
  res.json({ fact: facts[Math.floor(Math.random() * facts.length)] });
});

module.exports = router;
