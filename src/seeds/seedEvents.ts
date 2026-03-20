import { query } from '../config/database';

export const seedEvents = async () => {
  console.log('🎉 Seeding events data...');

  // ── 1. Refresh existing event_food listings to today/tomorrow ──────────────
  console.log('  Refreshing event food listing dates...');
  await query(
    `UPDATE food_listings
     SET available_from  = (CURRENT_DATE + available_from::time),
         available_until = (CURRENT_DATE + available_until::time),
         updated_at      = NOW()
     WHERE category = 'event_food' AND status != 'cancelled'`
  );
  console.log('  ✓ Event food dates refreshed');

  // ── 2. Add more event food listings (today + tomorrow) ────────────────────
  const eventFoodItems = [
    {
      title: 'Campus BBQ Feast',
      description: 'Grilled burgers, hot dogs, corn on the cob, and coleslaw from the annual campus BBQ.',
      category: 'event_food',
      quantity_available: 80,
      pickup_location: 'Main Quad – BBQ Tent',
      available_from: `CURRENT_DATE + interval '11 hours'`,
      available_until: `CURRENT_DATE + interval '14 hours'`,
      dietary_tags: ['{"gluten-free option"}'],
      allergen_info: ['{"gluten","dairy"}'],
      cuisine_type: 'American',
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop',
    },
    {
      title: 'International Food Fair – Pad Thai',
      description: 'Authentic Pad Thai with rice noodles, tofu, bean sprouts, and peanuts.',
      category: 'event_food',
      quantity_available: 50,
      pickup_location: 'Student Union – Hall B',
      available_from: `CURRENT_DATE + interval '12 hours'`,
      available_until: `CURRENT_DATE + interval '16 hours'`,
      dietary_tags: ['{"vegetarian"}'],
      allergen_info: ['{"peanuts","gluten"}'],
      cuisine_type: 'Thai',
      image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&h=400&fit=crop',
    },
    {
      title: 'Club Fair Pizza Slices',
      description: 'Free pizza slices available during the spring club fair. Cheese and veggie options.',
      category: 'event_food',
      quantity_available: 120,
      pickup_location: 'Recreation Center Lobby',
      available_from: `CURRENT_DATE + interval '13 hours'`,
      available_until: `CURRENT_DATE + interval '17 hours'`,
      dietary_tags: ['{"vegetarian"}'],
      allergen_info: ['{"gluten","dairy"}'],
      cuisine_type: 'Italian',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
    },
    {
      title: 'Wellness Week Smoothie Bar',
      description: 'Fresh fruit smoothies — mango, berry, and green options. Free for all students.',
      category: 'event_food',
      quantity_available: 60,
      pickup_location: 'Health & Wellness Center',
      available_from: `CURRENT_DATE + interval '9 hours'`,
      available_until: `CURRENT_DATE + interval '12 hours'`,
      dietary_tags: ['{"vegan","gluten-free"}'],
      allergen_info: ['{}'],
      cuisine_type: 'Healthy',
      image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&h=400&fit=crop',
    },
    {
      title: 'Engineering Dept. Taco Night',
      description: 'Tacos with seasoned beef, chicken, or black beans. Toppings bar included.',
      category: 'event_food',
      quantity_available: 70,
      pickup_location: 'Engineering Building – Atrium',
      available_from: `CURRENT_DATE + interval '17 hours'`,
      available_until: `CURRENT_DATE + interval '20 hours'`,
      dietary_tags: ['{"gluten-free option","vegetarian option"}'],
      allergen_info: ['{"dairy"}'],
      cuisine_type: 'Mexican',
      image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
    },
  ];

  // Get the dining hall provider ID (or any active provider)
  const providerResult = await query(
    `SELECT id FROM users WHERE role = 'provider' AND is_active = true LIMIT 1`
  );
  const providerId = providerResult.rows[0]?.id;
  if (!providerId) {
    console.warn('  ⚠ No provider found — skipping new event food listings');
  } else {
    for (const item of eventFoodItems) {
      await query(
        `INSERT INTO food_listings
           (provider_id, title, description, category, quantity_available, pickup_location,
            available_from, available_until, dietary_tags, allergen_info, cuisine_type, image_urls, status)
         VALUES ($1, $2, $3, $4, $5, $6, ${item.available_from}, ${item.available_until},
                 $7, $8, $9, ARRAY[$10], 'active')
         ON CONFLICT DO NOTHING`,
        [
          providerId, item.title, item.description, item.category,
          item.quantity_available, item.pickup_location,
          item.dietary_tags[0], item.allergen_info[0],
          item.cuisine_type, item.image_url,
        ]
      );
      console.log(`  ✓ Event food: ${item.title}`);
    }
  }

  // ── 3. Seed volunteer shifts ───────────────────────────────────────────────
  console.log('  Seeding volunteer shifts...');

  const shifts = [
    {
      title: 'Food Pantry Distribution Helper',
      description: 'Help sort and distribute food items to students visiting the campus food pantry.',
      shift_date: 'CURRENT_DATE',
      start_time: '09:00',
      end_time: '12:00',
      location: 'Campus Food Pantry',
      slots_available: 8,
    },
    {
      title: 'Campus BBQ Setup & Cleanup',
      description: 'Assist with setting up the BBQ stations, serving food, and post-event cleanup.',
      shift_date: 'CURRENT_DATE',
      start_time: '10:00',
      end_time: '15:00',
      location: 'Main Quad',
      slots_available: 12,
    },
    {
      title: 'International Food Fair Volunteer',
      description: 'Help coordinate the international food fair — manage booths and assist vendors.',
      shift_date: 'CURRENT_DATE',
      start_time: '11:00',
      end_time: '17:00',
      location: 'Student Union – Hall B',
      slots_available: 10,
    },
    {
      title: 'Meal Delivery to Dorms',
      description: 'Deliver surplus meal boxes to students in residence halls who signed up.',
      shift_date: `(CURRENT_DATE + interval '1 day')::date`,
      start_time: '17:00',
      end_time: '19:00',
      location: 'Dining Hall – Loading Dock',
      slots_available: 6,
    },
    {
      title: 'Weekend Pantry Volunteer',
      description: 'Staff the food pantry on Saturday — check in students and help them select items.',
      shift_date: `(CURRENT_DATE + interval '2 days')::date`,
      start_time: '10:00',
      end_time: '14:00',
      location: 'Campus Food Pantry',
      slots_available: 5,
    },
    {
      title: 'Community Garden Harvest',
      description: 'Help harvest fresh vegetables from the campus community garden for pantry donation.',
      shift_date: `(CURRENT_DATE + interval '3 days')::date`,
      start_time: '08:00',
      end_time: '11:00',
      location: 'Campus Community Garden',
      slots_available: 15,
    },
    {
      title: 'Food Waste Reduction Drive',
      description: 'Collect surplus food from dining halls and package it for redistribution.',
      shift_date: `(CURRENT_DATE + interval '4 days')::date`,
      start_time: '19:00',
      end_time: '21:00',
      location: 'Main Dining Hall',
      slots_available: 8,
    },
  ];

  for (const shift of shifts) {
    await query(
      `INSERT INTO volunteer_shifts (title, description, shift_date, start_time, end_time, location, slots_available)
       VALUES ($1, $2, ${shift.shift_date}, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [shift.title, shift.description, shift.start_time, shift.end_time, shift.location, shift.slots_available]
    );
    console.log(`  ✓ Volunteer shift: ${shift.title}`);
  }

  console.log('✅ Events seeded successfully');
};

if (require.main === module) {
  seedEvents().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
