import { query } from '../config/database';

export const seedPantryInventory = async () => {
  console.log('🥫 Seeding pantry inventory...');

  const items = [
    // Canned goods
    { item_name: 'Canned Black Beans', category: 'canned_goods', quantity: 50, unit: 'can', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Canned Chickpeas', category: 'canned_goods', quantity: 40, unit: 'can', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Canned Diced Tomatoes', category: 'canned_goods', quantity: 60, unit: 'can', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Canned Tuna', category: 'canned_goods', quantity: 35, unit: 'can', dietary_tags: ['gluten-free'], allergen_info: ['fish'] },
    { item_name: 'Canned Corn', category: 'canned_goods', quantity: 45, unit: 'can', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Canned Lentil Soup', category: 'canned_goods', quantity: 30, unit: 'can', dietary_tags: ['vegan'], allergen_info: [] },

    // Dry goods
    { item_name: 'White Rice (2 lb)', category: 'dry_goods', quantity: 25, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Pasta (Penne)', category: 'dry_goods', quantity: 30, unit: 'box', dietary_tags: ['vegan'], allergen_info: ['gluten'] },
    { item_name: 'Oatmeal', category: 'dry_goods', quantity: 20, unit: 'container', dietary_tags: ['vegan'], allergen_info: [] },
    { item_name: 'All-Purpose Flour', category: 'dry_goods', quantity: 15, unit: 'bag', dietary_tags: ['vegan'], allergen_info: ['gluten'] },
    { item_name: 'Quinoa', category: 'dry_goods', quantity: 18, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Lentils (Red)', category: 'dry_goods', quantity: 22, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },

    // Fresh produce
    { item_name: 'Bananas', category: 'fresh_produce', quantity: 40, unit: 'item', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Apples', category: 'fresh_produce', quantity: 35, unit: 'item', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Carrots', category: 'fresh_produce', quantity: 30, unit: 'item', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Potatoes', category: 'fresh_produce', quantity: 25, unit: 'item', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Onions', category: 'fresh_produce', quantity: 28, unit: 'item', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Spinach', category: 'fresh_produce', quantity: 15, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },

    // Dairy
    { item_name: 'Whole Milk (1 gal)', category: 'dairy', quantity: 12, unit: 'jug', dietary_tags: ['vegetarian', 'gluten-free'], allergen_info: ['dairy'] },
    { item_name: 'Cheddar Cheese (block)', category: 'dairy', quantity: 10, unit: 'item', dietary_tags: ['vegetarian', 'gluten-free'], allergen_info: ['dairy'] },
    { item_name: 'Greek Yogurt', category: 'dairy', quantity: 20, unit: 'container', dietary_tags: ['vegetarian', 'gluten-free'], allergen_info: ['dairy'] },
    { item_name: 'Eggs (dozen)', category: 'dairy', quantity: 15, unit: 'carton', dietary_tags: ['vegetarian', 'gluten-free'], allergen_info: ['eggs'] },

    // Snacks
    { item_name: 'Peanut Butter', category: 'snacks', quantity: 20, unit: 'jar', dietary_tags: ['vegan'], allergen_info: ['peanuts'] },
    { item_name: 'Granola Bars', category: 'snacks', quantity: 50, unit: 'item', dietary_tags: ['vegetarian'], allergen_info: ['gluten', 'nuts'] },
    { item_name: 'Trail Mix', category: 'snacks', quantity: 30, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: ['nuts'] },
    { item_name: 'Rice Cakes', category: 'snacks', quantity: 25, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },

    // Beverages
    { item_name: 'Orange Juice (64 oz)', category: 'beverages', quantity: 10, unit: 'bottle', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Almond Milk', category: 'beverages', quantity: 15, unit: 'carton', dietary_tags: ['vegan', 'gluten-free'], allergen_info: ['tree nuts'] },
    { item_name: 'Green Tea (box)', category: 'beverages', quantity: 20, unit: 'box', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },

    // Frozen
    { item_name: 'Frozen Mixed Vegetables', category: 'frozen', quantity: 18, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
    { item_name: 'Frozen Brown Rice', category: 'frozen', quantity: 12, unit: 'bag', dietary_tags: ['vegan', 'gluten-free'], allergen_info: [] },
  ];

  for (const item of items) {
    await query(
      `INSERT INTO pantry_inventory (item_name, category, quantity, unit, dietary_tags, allergen_info, location, reorder_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, 'Campus Food Pantry', 10)
       ON CONFLICT DO NOTHING`,
      [item.item_name, item.category, item.quantity, item.unit, item.dietary_tags, item.allergen_info]
    );
    console.log(`  ✓ ${item.item_name}`);
  }

  console.log(`✅ Pantry inventory seeded with ${items.length} items`);
};

if (require.main === module) {
  seedPantryInventory().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
