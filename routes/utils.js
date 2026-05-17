const express = require('express');
const router = express.Router();
const { fetchFoodPhotoUrl } = require('../utils/unsplash');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/utils/unsplash-proxy
 * @desc    Proxies Unsplash requests to hide API keys and add caching/default logic.
 */
router.get('/unsplash-proxy', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    const metadata = await fetchFoodPhotoUrl(q);
    res.json(metadata);
  } catch (err) {
    logger.warn('Unsplash proxy failed', { message: err.message });
    res.status(500).json({ error: 'Failed to fetch image', url: null });
  }
});

/**
 * @route   POST /api/utils/unsplash-download
 * @desc    Triggers the download track event required by Unsplash API compliance.
 */
router.post('/unsplash-download', async (req, res) => {
  try {
    const { downloadLocation } = req.body;
    if (!downloadLocation) return res.status(400).json({ error: 'downloadLocation required' });

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return res.json({ success: true, simulated: true });

    // Unsplash compliance requires a GET to the download_location with the Access Key
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    res.json({ success: true });
  } catch (err) {
    logger.warn('Unsplash download tracking failed', { message: err.message });
    res.json({ success: false }); // Non-fatal for the user
  }
});

module.exports = router;
