import { query } from '../config/database';

// Verified Unsplash photo IDs — all return 200
const IMG = {
  burrito:      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  sushi:        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
  tacos:        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
  salad:        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
  ramen:        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
  smoothie:     'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&h=400&fit=crop',
  pancakes:     'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
  pizza:        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
  burger:       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
  bowl:         'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
  sandwich:     'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop',
  curry:        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop',
  waffles:      'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&h=400&fit=crop',
  acai:         'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop',
  dumplings:    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop',
  coffee:       'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
  fruitbowl:    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
  pasta:        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop',
  nachos:       'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&h=400&fit=crop',
  poke:         'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=600&h=400&fit=crop',
};

export const seedListings = async () => {
  try {
    console.log('Seeding listings...');

    // Get or create a provider user
    let providerResult = await query(
      'SELECT id FROM users WHERE role = $1 LIMIT 1',
      ['provider']
    );

    let providerId: string;
    if (providerResult.rows.length === 0) {
      const newProvider = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        ['provider@foodbridge.local', 'hashed_password', 'Campus', 'Dining', 'provider']
      );
      providerId = newProvider.rows[0].id;
    } else {
      providerId = providerResult.rows[0].id;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // t(h, m) — returns today's date at hour h, minute m
    const t = (h: number, m = 0) =>
      new Date(today.getTime() + h * 3600000 + m * 60000);

    const listings = [
      // ── TODAY ──────────────────────────────────────────────────────────
      {
        title: 'Spicy Chicken Burrito Bowl',
        description: 'Grilled chicken, cilantro rice, black beans, pico de gallo, guac, and chipotle crema. Made fresh at the Student Center grill.',
        category: 'meal',
        quantity_available: 12,
        quantity_reserved: 3,
        pickup_location: 'Student Center Grill — Counter B',
        available_from: t(11),
        available_until: t(14),
        cuisine_type: 'Mexican',
        dietary_tags: ['Gluten-Free'],
        image_urls: [IMG.burrito],
      },
      {
        title: 'Salmon Sushi Platter',
        description: '12-piece assorted sushi platter — salmon nigiri, tuna rolls, and cucumber avocado rolls. Leftover from the International Lunch event.',
        category: 'event_food',
        quantity_available: 8,
        quantity_reserved: 2,
        pickup_location: 'International House — Lobby',
        available_from: t(12),
        available_until: t(15),
        cuisine_type: 'Japanese',
        dietary_tags: ['Gluten-Free'],
        image_urls: [IMG.sushi],
      },
      {
        title: 'Street Tacos (3-pack)',
        description: 'Carne asada or grilled veggie tacos on corn tortillas with onion, cilantro, and salsa verde. From today\'s food truck pop-up.',
        category: 'deal',
        quantity_available: 20,
        quantity_reserved: 5,
        pickup_location: 'Main Quad Food Truck',
        available_from: t(11, 30),
        available_until: t(14, 30),
        cuisine_type: 'Mexican',
        dietary_tags: ['Gluten-Free'],
        image_urls: [IMG.tacos],
      },
      {
        title: 'Mediterranean Grain Bowl',
        description: 'Quinoa, roasted chickpeas, cucumber, cherry tomatoes, kalamata olives, feta, and lemon tahini dressing.',
        category: 'meal',
        quantity_available: 15,
        quantity_reserved: 4,
        pickup_location: 'Dining Hall A — Wellness Station',
        available_from: t(11),
        available_until: t(13, 30),
        cuisine_type: 'Mediterranean',
        dietary_tags: ['Vegetarian', 'Gluten-Free'],
        image_urls: [IMG.bowl],
      },
      {
        title: 'Tonkotsu Ramen',
        description: 'Rich pork bone broth, chashu pork, soft-boiled egg, nori, bamboo shoots, and green onion. Limited bowls from the Dining Hall special.',
        category: 'meal',
        quantity_available: 10,
        quantity_reserved: 6,
        pickup_location: 'Dining Hall B — Noodle Bar',
        available_from: t(17),
        available_until: t(20),
        cuisine_type: 'Japanese',
        dietary_tags: [],
        image_urls: [IMG.ramen],
      },
      {
        title: 'Tropical Smoothie Pack',
        description: 'Mango, pineapple, and banana smoothies blended with coconut milk. 16oz cups, leftover from the Wellness Fair.',
        category: 'beverage',
        quantity_available: 25,
        quantity_reserved: 8,
        pickup_location: 'Recreation Center — Juice Bar',
        available_from: t(9),
        available_until: t(17),
        cuisine_type: 'Beverages',
        dietary_tags: ['Vegan', 'Gluten-Free'],
        image_urls: [IMG.smoothie],
      },
      {
        title: 'Buttermilk Pancake Stack',
        description: 'Fluffy buttermilk pancakes with maple syrup and fresh berries. Leftover from this morning\'s faculty breakfast.',
        category: 'meal',
        quantity_available: 14,
        quantity_reserved: 4,
        pickup_location: 'Faculty Club — Side Entrance',
        available_from: t(8),
        available_until: t(11),
        cuisine_type: 'American',
        dietary_tags: ['Vegetarian'],
        image_urls: [IMG.pancakes],
      },
      {
        title: 'Margherita Pizza (whole)',
        description: 'Wood-fired margherita pizza with San Marzano tomatoes, fresh mozzarella, and basil. Whole 12" pies from the Dining Hall surplus.',
        category: 'meal',
        quantity_available: 6,
        quantity_reserved: 1,
        pickup_location: 'Dining Hall A — Pizza Station',
        available_from: t(18),
        available_until: t(21),
        cuisine_type: 'Italian',
        dietary_tags: ['Vegetarian'],
        image_urls: [IMG.pizza],
      },
      {
        title: 'Smash Burger Combo',
        description: 'Double smash patty with American cheese, caramelized onions, pickles, and special sauce on a brioche bun. Comes with fries.',
        category: 'deal',
        quantity_available: 18,
        quantity_reserved: 7,
        pickup_location: 'Student Center Grill — Counter A',
        available_from: t(11),
        available_until: t(20),
        cuisine_type: 'American',
        dietary_tags: [],
        image_urls: [IMG.burger],
      },
      {
        title: 'Iced Coffee Bundle',
        description: 'Cold brew, vanilla latte, and oat milk cappuccino — 3-pack from the campus café end-of-day surplus.',
        category: 'beverage',
        quantity_available: 20,
        quantity_reserved: 5,
        pickup_location: 'Campus Café — Main Library',
        available_from: t(15),
        available_until: t(19),
        cuisine_type: 'Beverages',
        dietary_tags: ['Vegan'],
        image_urls: [IMG.coffee],
      },

      // ── ADDITIONAL LISTINGS ────────────────────────────────────────────
      {
        title: 'Avocado Toast & Poached Egg',
        description: 'Sourdough toast with smashed avocado, poached egg, everything bagel seasoning, and chili flakes. Brunch special.',
        category: 'meal',
        quantity_available: 16,
        quantity_reserved: 0,
        pickup_location: 'Dining Hall A — Brunch Station',
        available_from: t(9, 0),
        available_until: t(12, 0),
        cuisine_type: 'American',
        dietary_tags: ['Vegetarian'],
        image_urls: [IMG.sandwich],
      },
      {
        title: 'Butter Chicken & Naan',
        description: 'Creamy tomato-based butter chicken with basmati rice and garlic naan. From the South Asian Cultural Night.',
        category: 'event_food',
        quantity_available: 30,
        quantity_reserved: 5,
        pickup_location: 'Student Activities Center — Room 201',
        available_from: t(18, 0),
        available_until: t(21, 0),
        cuisine_type: 'Indian',
        dietary_tags: ['Gluten-Free'],
        image_urls: [IMG.curry],
      },
      {
        title: 'Belgian Waffle Bar',
        description: 'Crispy Belgian waffles with whipped cream, strawberries, blueberries, and maple syrup. Leftover from the morning event.',
        category: 'snack',
        quantity_available: 22,
        quantity_reserved: 0,
        pickup_location: 'Engineering Building — Atrium',
        available_from: t(8, 0),
        available_until: t(11, 0),
        cuisine_type: 'American',
        dietary_tags: ['Vegetarian'],
        image_urls: [IMG.waffles],
      },
      {
        title: 'Açaí Power Bowl',
        description: 'Organic açaí blend topped with granola, banana, strawberries, honey, and chia seeds. From the Wellness Week event.',
        category: 'snack',
        quantity_available: 18,
        quantity_reserved: 2,
        pickup_location: 'Recreation Center — Wellness Booth',
        available_from: t(10, 0),
        available_until: t(14, 0),
        cuisine_type: 'Brazilian',
        dietary_tags: ['Vegan', 'Gluten-Free'],
        image_urls: [IMG.acai],
      },
      {
        title: 'Steamed Dumplings (6-pack)',
        description: 'Pork & cabbage and vegetable dumplings with ginger soy dipping sauce. Leftover from the Lunar New Year celebration.',
        category: 'event_food',
        quantity_available: 25,
        quantity_reserved: 3,
        pickup_location: 'Asian Student Center — Kitchen',
        available_from: t(13, 0),
        available_until: t(17, 0),
        cuisine_type: 'Chinese',
        dietary_tags: [],
        image_urls: [IMG.dumplings],
      },
      {
        title: 'Fresh Fruit Bowl',
        description: 'Seasonal cut fruit — watermelon, cantaloupe, grapes, pineapple, and berries. From the morning orientation event.',
        category: 'snack',
        quantity_available: 30,
        quantity_reserved: 0,
        pickup_location: 'Welcome Center — Lobby',
        available_from: t(9, 0),
        available_until: t(13, 0),
        cuisine_type: 'Produce',
        dietary_tags: ['Vegan', 'Gluten-Free'],
        image_urls: [IMG.fruitbowl],
      },
      {
        title: 'Penne Arrabbiata',
        description: 'Al dente penne in a spicy tomato sauce with garlic, chili flakes, and fresh parsley. Vegan and filling.',
        category: 'meal',
        quantity_available: 20,
        quantity_reserved: 4,
        pickup_location: 'Cafe Central — Hot Counter',
        available_from: t(12, 0),
        available_until: t(15, 0),
        cuisine_type: 'Italian',
        dietary_tags: ['Vegan'],
        image_urls: [IMG.pasta],
      },
      {
        title: 'Loaded Nachos',
        description: 'Tortilla chips loaded with cheddar, jalapeños, black beans, sour cream, guacamole, and pico. From the Game Night event.',
        category: 'event_food',
        quantity_available: 15,
        quantity_reserved: 2,
        pickup_location: 'Student Lounge — Room 105',
        available_from: t(19, 0),
        available_until: t(22, 0),
        cuisine_type: 'Mexican',
        dietary_tags: ['Vegetarian'],
        image_urls: [IMG.nachos],
      },
      {
        title: 'Poke Bowl (Ahi Tuna)',
        description: 'Sushi-grade ahi tuna, edamame, cucumber, avocado, pickled ginger, and sesame seeds over sushi rice with ponzu.',
        category: 'deal',
        quantity_available: 12,
        quantity_reserved: 0,
        pickup_location: 'Dining Hall B — Poke Station',
        available_from: t(11, 0),
        available_until: t(14, 0),
        cuisine_type: 'Hawaiian',
        dietary_tags: ['Gluten-Free'],
        image_urls: [IMG.poke],
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const listing of listings) {
      try {
        // Non-destructive: skip if a listing with the same title already exists
        const existing = await query(
          'SELECT id FROM food_listings WHERE title = $1 AND provider_id = $2',
          [listing.title, providerId]
        );
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        await query(
          `INSERT INTO food_listings
           (provider_id, title, description, category, quantity_available, quantity_reserved,
            pickup_location, available_from, available_until, cuisine_type, dietary_tags, image_urls)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            providerId,
            listing.title,
            listing.description,
            listing.category,
            listing.quantity_available,
            listing.quantity_reserved,
            listing.pickup_location,
            listing.available_from,
            listing.available_until,
            listing.cuisine_type,
            listing.dietary_tags,
            listing.image_urls,
          ]
        );
        console.log(`  ✓ ${listing.title}`);
        created++;
      } catch (error: any) {
        console.error(`  ✗ ${listing.title}: ${error.message}`);
      }
    }

    console.log(`\nDone: ${created} created, ${skipped} skipped (already exist)`);
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
};
