/**
 * Multi-tenant menu data.
 * In a full production env, these would be in their own Mongoose collection per tenant.
 */
const tenantMenus = {
  default: [
    {
      id: 1,
      category: 'Breakfast',
      emoji: '🥞',
      name: 'Morning Specials',
      description: 'Classic Indian breakfast - Poha, Upma, Sabudana Khichdi',
      items: [
        {
          name: 'Poha',
          price: 60,
          desc: 'Flattened rice with onions, peanuts & curry leaves',
          imageUrl:
            'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Upma',
          price: 55,
          desc: 'Semolina porridge with vegetables',
          imageUrl:
            'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Sabudana Khichdi',
          price: 70,
          desc: 'Sago pearls with peanuts and potatoes',
          imageUrl:
            'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Vada Pav',
          price: 30,
          desc: 'Mumbai classic spiced potato patty in pav',
          imageUrl:
            'https://images.unsplash.com/photo-1626776876729-babd0f2a5811?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
    {
      id: 2,
      category: 'Brunch',
      emoji: '🥗',
      name: 'Weekend Brunch',
      description: 'Hearty brunch options for lazy weekends',
      items: [
        {
          name: 'Full Breakfast Platter',
          price: 180,
          desc: 'Toast, eggs, sausage, baked beans & hash brown',
          imageUrl:
            'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Avocado Toast',
          price: 150,
          desc: 'Sourdough with smashed avocado & cherry tomatoes',
          imageUrl:
            'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Pancake Stack',
          price: 120,
          desc: 'Fluffy pancakes with maple syrup & fresh fruit',
          imageUrl:
            'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Smoothie Bowl',
          price: 140,
          desc: 'Acai base with granola and seasonal fruits',
          imageUrl:
            'https://images.unsplash.com/photo-1494597564530-859f0b19a71e?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
    {
      id: 3,
      category: 'Lunch',
      emoji: '🍛',
      name: 'Hearty Mains',
      description: 'Filling Indian and Continental lunch options',
      items: [
        {
          name: 'Thali',
          price: 150,
          desc: 'Complete Indian meal — dal, sabzi, roti, rice, pickle & raita',
          imageUrl:
            'https://images.unsplash.com/photo-1582576163090-6c515f9f6024?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Chicken Biryani',
          price: 200,
          desc: 'Aromatic basmati rice with tender chicken',
          imageUrl:
            'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Pasta Arrabbiata',
          price: 160,
          desc: 'Penne in spicy tomato sauce with garlic',
          imageUrl:
            'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Grilled Sandwich',
          price: 90,
          desc: 'Cheese, tomato, capsicum & mint chutney',
          imageUrl:
            'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
    {
      id: 4,
      category: 'Dinner',
      emoji: '🍽️',
      name: 'Evening Spreads',
      description: 'Satisfying dinners for a perfect evening',
      items: [
        {
          name: 'Butter Chicken',
          price: 240,
          desc: 'Creamy tomato sauce with tender chicken',
          imageUrl:
            'https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Paneer Tikka Masala',
          price: 200,
          desc: 'Chargrilled paneer in rich tikka gravy',
          imageUrl:
            'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Dal Makhani',
          price: 160,
          desc: 'Slow-cooked black lentils with cream',
          imageUrl:
            'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Chicken Schnitzel',
          price: 250,
          desc: 'Breaded chicken with fries and coleslaw',
          imageUrl:
            'https://images.unsplash.com/photo-1594834712647-9c9471f4fdf0?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
    {
      id: 5,
      category: 'Beverages',
      emoji: '☕',
      name: 'Drinks & More',
      description: 'Hot and cold beverages',
      items: [
        {
          name: 'Masala Chai',
          price: 30,
          desc: 'Spiced Indian tea brewed perfectly',
          imageUrl:
            'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Cold Coffee',
          price: 80,
          desc: 'Blended coffee with ice cream',
          imageUrl:
            'https://images.unsplash.com/photo-1461023232487-21ef3f638811?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Fresh Lime Soda',
          price: 50,
          desc: 'Sweet or salted with crushed ice',
          imageUrl:
            'https://images.unsplash.com/photo-1600271886391-da561ce30982?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Mango Lassi',
          price: 70,
          desc: 'Creamy yogurt-mango drink',
          imageUrl:
            'https://images.unsplash.com/photo-1571006682855-3fc2754687d3?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
    {
      id: 6,
      category: 'Desserts',
      emoji: '🍰',
      name: 'Sweet Endings',
      description: 'Indulgent desserts to finish your meal',
      items: [
        {
          name: 'Gulab Jamun',
          price: 60,
          desc: 'Soft milk dumplings in rose syrup',
          imageUrl:
            'https://images.unsplash.com/photo-1589119634773-84093a1b58bb?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Chocolate Lava Cake',
          price: 120,
          desc: 'Warm cake with molten chocolate center',
          imageUrl:
            'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Kulfi',
          price: 70,
          desc: 'Traditional Indian ice cream - Malai, Pista or Mango',
          imageUrl:
            'https://images.unsplash.com/photo-1570197570495-920f123d536a?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Cheesecake',
          price: 130,
          desc: 'New York style with berry compote',
          imageUrl:
            'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=85&w=900&h=600',
        },
        {
          name: 'Nana Banana Toffee',
          price: 95,
          desc: 'Golden caramelized bananas with toffee sauce & vanilla bean cream',
          imageUrl: 'https://images.unsplash.com/photo-1528448780762-2b63df99081e?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
  ],
  demoClient: [
    {
      id: 1,
      category: 'Signature',
      emoji: '🍷',
      name: 'Bistro Luxe',
      description: 'Exclusive white-label tasting selection.',
      items: [
        {
          name: 'Truffle Steak',
          price: 850,
          desc: 'Wagyu beef with black truffle shavings',
          imageUrl:
            'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=85&w=900&h=600',
        },
      ],
    },
  ],
};

function getMenuItems(tenantId = 'default') {
  return tenantMenus[tenantId] || tenantMenus.default;
}

function flattenMenuLines(tenantId = 'default') {
  const items = getMenuItems(tenantId);
  const lines = [];
  for (const cat of items) {
    for (const it of cat.items) {
      lines.push(`${it.name} (₹${it.price})`);
    }
  }
  return lines;
}

module.exports = { 
  getMenuItems, 
  flattenMenuLines,
  menuItems: tenantMenus.default 
};

