const { logger } = require('./logger');

const UNSPLASH_ROOT = 'https://api.unsplash.com';

/**
 * Fetch a single food-related photo object for a search query.
 * @param {string} query
 * @param {{ accessKey?: string }} [opts]
 * @returns {Promise<{ url: string, photographer: { name: string, link: string }, downloadLocation: string } | null>}
 */
async function fetchFoodPhotoUrl(query, opts = {}) {
  const accessKey = opts.accessKey || process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || !String(query).trim()) return null;

  const q = encodeURIComponent(String(query).trim());
  const url = `${UNSPLASH_ROOT}/search/photos?query=${q}&per_page=1&orientation=landscape&content_filter=high`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!res.ok) {
      logger.warn('Unsplash search failed', { status: res.status });
      return null;
    }
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return null;

    return {
      url: first?.urls?.regular || first?.urls?.small,
      photographer: {
        name: first.user.name,
        link: `${first.user.links.html}?utm_source=cafe_diamond_queen&utm_medium=referral`,
      },
      downloadLocation: first.links.download_location,
    };
  } catch (e) {
    logger.warn('Unsplash request error', { message: e.message });
    return null;
  }
}

module.exports = { fetchFoodPhotoUrl };
