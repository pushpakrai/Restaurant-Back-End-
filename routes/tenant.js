const express = require('express');
const { getTenantFromRequest, toPublicTenant } = require('../config/tenant');

const router = express.Router();

/** Public branding + contact for white-label clients */
router.get('/', (req, res) => {
  const tenant = getTenantFromRequest(req);
  res.json(toPublicTenant(tenant));
});

module.exports = router;
