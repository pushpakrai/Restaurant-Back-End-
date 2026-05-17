/**
 * Multi-tenant branding and operational defaults.
 * Add new keys under `tenants` and set TENANT_ID (or X-Tenant-Id header) to switch clients.
 * Menu data stays in data/menuData.js until you move it to MongoDB per tenant.
 */

const tenants = {
  default: {
    id: 'default',
    slug: 'diamond-queen',
    brand: {
      name: 'Cafe Diamond Queen',
      tagline: "Pune's Finest",
      established: 'Est. 1950 · Pune',
      heroBadge: "Pune's Crown Jewel of Dining",
      logoUrl: '/logo.svg',
      primaryColor: '#C9A84C',
      conciergeName: 'Diamond AI',
    },
    contact: {
      addressLines: ['Near Silver Jubilee Petrol Pump', 'Pune 411001, MH'],
      phone: '+91 20 2636 2749',
      email: 'admin@diamondqueen.com',
      helloEmail: 'hello@diamondqueen.com',
    },
    hours: {
      summary: 'Daily 8:00 AM – 11:00 PM',
      brunchNote: 'Weekend brunch 10:00 AM – 3:00 PM',
    },
    story:
      "Pune's legendary culinary destination where Irani tradition meets modern luxury. Every guest is treated as Diamond royalty.",
    payment: {
      razorpayBusinessName: 'Cafe Diamond Queen',
      razorpayDescription: 'Premium culinary experience',
    },
    email: {
      fromName: 'Reservations',
      fromAddress: 'reservations@cafediamondqueen.com',
    },
    unsplashQueries: {
      default: 'fine dining restaurant food',
      Breakfast: 'indian breakfast poha',
      Brunch: 'brunch platter gourmet',
      Lunch: 'indian thali biryani',
      Dinner: 'indian curry fine dining',
      Beverages: 'masala chai coffee',
      Desserts: 'indian dessert gulab jamun',
    },
  },
  // Example second tenant — duplicate and edit for your next client
  demoClient: {
    id: 'demoClient',
    slug: 'demo-bistro',
    brand: {
      name: 'Demo Bistro',
      tagline: 'White-label ready',
      established: 'Est. 2026',
      heroBadge: 'Seasonal tasting menu',
      logoUrl: '/logo.svg',
      primaryColor: '#2d6a4f',
      conciergeName: 'Bistro AI',
    },
    contact: {
      addressLines: ['123 Market Street', 'Your City'],
      phone: '+1 555 0100',
      email: 'hello@demobistro.example',
      helloEmail: 'hello@demobistro.example',
    },
    hours: { summary: 'Tue–Sun 5pm–11pm', brunchNote: 'Brunch Sat–Sun 10am–2pm' },
    story: 'Replace this copy per client. Same codebase, different tenant id.',
    payment: {
      razorpayBusinessName: 'Demo Bistro',
      razorpayDescription: 'Table & preorder',
    },
    email: {
      fromName: 'Demo Bistro',
      fromAddress: 'bookings@demobistro.example',
    },
    unsplashQueries: {
      default: 'modern bistro food',
    },
  },
};

/** @param {string} [tenantId] */
function getTenant(tenantId) {
  const tid = tenantId && tenants[tenantId] ? tenantId : 'default';
  return tenants[tid];
}

function getTenantFromRequest(req) {
  if (!req) return getTenant('default');
  
  // 1. Check Header (X-Tenant-Id)
  const header = req.get('x-tenant-id');
  if (header && tenants[header]) return getTenant(header);

  // 2. Check Environment Variable
  const envId = process.env.TENANT_ID;
  if (envId && tenants[envId]) return getTenant(envId);

  // 3. Ultra-safe Fallback
  return getTenant('default');
}

/**
 * Public-safe payload for the browser (no secrets).
 * @param {Object} tenant
 */
function toPublicTenant(tenant) {
  const t = tenant || tenants.default;
  return {
    id: t.id,
    slug: t.slug,
    brand: t.brand,
    contact: t.contact,
    hours: t.hours,
    story: t.story,
    payment: { 
      businessName: t.payment?.razorpayBusinessName || t.brand?.name, 
      description: t.payment?.razorpayDescription || t.brand?.tagline 
    },
  };
}

module.exports = { tenants, getTenant, getTenantFromRequest, toPublicTenant };
