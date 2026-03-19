import { query } from '../config/database';
import bcrypt from 'bcrypt';

const DINING_IMAGES = {
  grilledSalmon:   'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop',
  roastChicken:    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop',
  vegCurry:        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop',
  caesarSalad:     'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop',
  beefStew:        'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  pancakes:        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
  fruitBowl:       'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
  soup:            'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
  pasta:           'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop',
  tacos:           'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
  waffles:         'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&h=400&fit=crop',
  stirFry:         'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop',
};

export const seedDiningHall = async () => {
  try {
    console.log('🍽️  Seeding dining hall data...');

    // Create dining hall provider account
    const passwordHash = await bcrypt.hash('DiningHall2024!', 10);

    const existingUser = await query(
      `SELECT id FROM users WHERE email = $1`,
      ['dininghall@university.edu']
    );

    let providerId: string;

    if (existingUser.rows.length > 0) {
      providerId = existingUser.rows[0].id;
      console.log('Using existing dining hall provider:', providerId);
    } else {
      const newProvider = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'provider', NOW(), NOW())
         RETURNING id`,
        ['dininghall@university.edu', passwordHash, 'Campus', 'Dining Hall']
      );
      providerId = newProvider.rows[0].id;
      console.log('Created dining hall provider:', providerId);
    }

    // Clear existing listings for this provider to avoid duplicates
    await query(
      `DELETE FROM food_listings WHERE provider_id = $1`,
      [providerId]
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // t(h, m) — today at hour h, minute m
    const t = (h: number, m = 0) => new Date(today.getTime() + h * 3600000 + m * 60000);

    const listings = [
      // ── Breakfast surplus ──────────────────────────────────────────────
      {
        title: 'Buttermilk Pancakes',
        description: 'Fluffy buttermilk pancakes with maple syrup and butter. Leftover from breakfast service.',
        category: 'meal',
        quantity_available: 20,
        quantity_reserved: 4,
        pickup_location: 'Main Dining Hall – Breakfast Counter',
        available_from: t(7, 0),
        available_until: t(10, 0),
        cuisine_type: 'Breakfast',
        dietary_tags: ['Vegetarian'],
        allergen_info: ['gluten', 'dairy', 'eggs'],
        original_price: 6.00,
        discounted_price: 2.00,
        image_urls: [DINING_IMAGES.pancakes],
      },
      {
        title: 'Fresh Fruit Bowl',
        description: 'Seasonal mixed fruit — strawberries, melon, grapes, and pineapple. Prepared fresh this morning.',
        category: 'snack',
        quantity_available: 30,
        quantity_reserved: 8,
        pickup_location: 'Main Dining Hall – Salad Bar',
        available_from: t(7, 30),
        available_until: t(11, 0),
        cuisine_type: 'Breakfast',
        dietary_tags: ['Vegan', 'Gluten-Free'],
        allergen_info: [],
        original_price: 4.50,
        discounted_price: 1.50,
        image_urls: [DINING_IMAGES.fruitBowl],
      },
      {
        title: 'Belgian Waffles',
        description: 'Crispy Belgian waffles with whipped cream and berry compote. Surplus from Sunday brunch.',
        category: 'meal',
        quantity_available: 15,
        quantity_reserved: 5,
        pickup_location: 'Main Dining Hall – Waffle Station',
        available_from: t(8, 0),
        available_until: t(11, 30),
        cuisine_type: 'Breakfast',
        dietary_tags: ['Vegetarian'],
        allergen_info: ['gluten', 'dairy', 'eggs'],
        original_price: 7.00,
        discounted_price: 2.50,
        image_urls: [DINING_IMAGES.waffles],
      },

      // ── Lunch surplus ──────────────────────────────────────────────────
      {
        title: 'Caesar Salad',
        description: 'Classic Caesar salad with romaine, croutons, parmesan, and house-made dressing.',
        category: 'meal',
        quantity_available: 25,
        quantity_reserved: 10,
        pickup_location: 'Main Dining Hall – Salad Bar',
        available_from: t(11, 0),
        available_until: t(14, 0),
        cuisine_type: 'Salad',
        dietary_tags: ['Vegetarian'],
        allergen_info: ['gluten', 'dairy', 'eggs', 'fish'],
        original_price: 5.00,
        discounted_price: 1.50,
        image_urls: [DINING_IMAGES.caesarSalad],
      },
      {
        title: 'Vegetable Curry with Rice',
        description: 'Hearty chickpea and vegetable curry in a fragrant tomato-coconut sauce, served with basmati rice.',
        category: 'meal',
        quantity_available: 18,
        quantity_reserved: 6,
        pickup_location: 'Main Dining Hall – Hot Line',
        available_from: t(11, 30),
        available_until: t(14, 30),
        cuisine_type: 'Indian',
        dietary_tags: ['Vegan', 'Gluten-Free', 'sustainable'],
        allergen_info: [],
        original_price: 8.50,
        discounted_price: 3.00,
        image_urls: [DINING_IMAGES.vegCurry],
      },
      {
        title: 'Chicken Tacos',
        description: 'Soft flour tortillas with seasoned grilled chicken, pico de gallo, sour cream, and shredded cheese.',
        category: 'deal',
        quantity_available: 22,
        quantity_reserved: 7,
        pickup_location: 'Main Dining Hall – Taco Bar',
        available_from: t(11, 0),
        available_until: t(15, 0),
        cuisine_type: 'Mexican',
        dietary_tags: ['Gluten-Free'],
        allergen_info: ['dairy'],
        original_price: 9.00,
        discounted_price: 4.00,
        image_urls: [DINING_IMAGES.tacos],
      },
      {
        title: 'Tomato Basil Soup',
        description: 'Creamy tomato basil soup made from scratch. Served with a side of crusty bread.',
        category: 'meal',
        quantity_available: 35,
        quantity_reserved: 12,
        pickup_location: 'Main Dining Hall – Soup Station',
        available_from: t(12, 0),
        available_until: t(15, 0),
        cuisine_type: 'Soup',
        dietary_tags: ['Vegetarian'],
        allergen_info: ['gluten', 'dairy'],
        original_price: 4.00,
        discounted_price: 1.00,
        image_urls: [DINING_IMAGES.soup],
      },
      {
        title: 'Penne Pasta Marinara',
        description: 'Al dente penne pasta tossed in a rich marinara sauce with fresh basil and parmesan.',
        category: 'meal',
        quantity_available: 28,
        quantity_reserved: 9,
        pickup_location: 'Main Dining Hall – Pasta Station',
        available_from: t(12, 0),
        available_until: t(14, 30),
        cuisine_type: 'Italian',
        dietary_tags: ['Vegetarian'],
        allergen_info: ['gluten', 'dairy'],
        original_price: 7.50,
        discounted_price: 2.50,
        image_urls: [DINING_IMAGES.pasta],
      },

      // ── Dinner surplus ─────────────────────────────────────────────────
      {
        title: 'Grilled Salmon Fillet',
        description: 'Pan-seared Atlantic salmon with lemon butter sauce, roasted asparagus, and wild rice.',
        category: 'deal',
        quantity_available: 12,
        quantity_reserved: 3,
        pickup_location: 'Main Dining Hall – Grill Station',
        available_from: t(17, 0),
        available_until: t(20, 0),
        cuisine_type: 'Seafood',
        dietary_tags: ['Gluten-Free', 'sustainable'],
        allergen_info: ['fish', 'dairy'],
        original_price: 14.00,
        discounted_price: 6.00,
        image_urls: [DINING_IMAGES.grilledSalmon],
      },
      {
        title: 'Herb-Roasted Chicken',
        description: 'Oven-roasted half chicken with rosemary, garlic, and thyme. Served with mashed potatoes and green beans.',
        category: 'deal',
        quantity_available: 16,
        quantity_reserved: 5,
        pickup_location: 'Main Dining Hall – Carving Station',
        available_from: t(17, 30),
        available_until: t(20, 30),
        cuisine_type: 'American',
        dietary_tags: ['Gluten-Free'],
        allergen_info: ['dairy'],
        original_price: 12.00,
        discounted_price: 5.00,
        image_urls: [DINING_IMAGES.roastChicken],
      },
      {
        title: 'Beef and Vegetable Stew',
        description: 'Slow-cooked beef stew with carrots, potatoes, and celery in a rich broth. Served with dinner roll.',
        category: 'meal',
        quantity_available: 20,
        quantity_reserved: 8,
        pickup_location: 'Main Dining Hall – Hot Line',
        available_from: t(17, 0),
        available_until: t(21, 0),
        cuisine_type: 'American',
        dietary_tags: [],
        allergen_info: ['gluten', 'dairy'],
        original_price: 10.00,
        discounted_price: 3.50,
        image_urls: [DINING_IMAGES.beefStew],
      },
      {
        title: 'Asian Stir-Fry',
        description: 'Wok-tossed tofu and seasonal vegetables in a savory ginger-soy glaze over steamed jasmine rice.',
        category: 'meal',
        quantity_available: 24,
        quantity_reserved: 6,
        pickup_location: 'Main Dining Hall – Asian Station',
        available_from: t(18, 0),
        available_until: t(21, 0),
        cuisine_type: 'Asian',
        dietary_tags: ['Vegan', 'sustainable'],
        allergen_info: ['soy'],
        original_price: 9.00,
        discounted_price: 3.00,
        image_urls: [DINING_IMAGES.stirFry],
      },
    ];

    let created = 0;
    for (const listing of listings) {
      try {
        await query(
          `INSERT INTO food_listings
           (provider_id, title, description, category, quantity_available, quantity_reserved,
            pickup_location, available_from, available_until, cuisine_type, dietary_tags,
            allergen_info, original_price, discounted_price, image_urls, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active')`,
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
            listing.dietary_tags,       // native pg array
            listing.allergen_info,      // native pg array
            listing.original_price,
            listing.discounted_price,
            listing.image_urls,         // native pg array
          ]
        );
        console.log(`  ✓ ${listing.title}`);
        created++;
      } catch (err) {
        console.error(`  ✗ Failed: ${listing.title}`, err);
      }
    }

    console.log(`\n✅ Dining hall seed complete — ${created}/${listings.length} listings created`);
    console.log(`   Login: dininghall@university.edu / DiningHall2024!`);
    console.log(`   Provider ID: ${providerId}`);

    return { providerId, created };
  } catch (error) {
    console.error('❌ Dining hall seed failed:', error);
    throw error;
  }
};

// Run directly: npx ts-node src/seeds/seedDiningHall.ts
if (require.main === module) {
  seedDiningHall()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
