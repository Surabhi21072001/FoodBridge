-- Clear all pantry inventory data
TRUNCATE TABLE pantry_inventory CASCADE;

-- Re-insert the 8 pantry items
INSERT INTO pantry_inventory (item_name, category, quantity, unit, expiration_date, dietary_tags, allergen_info, location, reorder_threshold) VALUES
('Canned Black Beans', 'canned_goods', 45, 'can', '2027-12-31', ARRAY['vegan', 'gluten-free'], ARRAY[]::TEXT[], 'Shelf A1', 15),
('Pasta - Penne', 'dry_goods', 30, 'box', '2026-06-30', ARRAY['vegan'], ARRAY['gluten'], 'Shelf B2', 10),
('Rice - White', 'dry_goods', 50, 'lb', '2027-01-31', ARRAY['vegan', 'gluten-free'], ARRAY[]::TEXT[], 'Shelf B1', 20),
('Peanut Butter', 'dry_goods', 25, 'jar', '2026-09-30', ARRAY['vegetarian'], ARRAY['peanuts'], 'Shelf C3', 10),
('Canned Tomatoes', 'canned_goods', 60, 'can', '2027-08-31', ARRAY['vegan', 'gluten-free'], ARRAY[]::TEXT[], 'Shelf A2', 20),
('Oatmeal', 'dry_goods', 40, 'box', '2026-12-31', ARRAY['vegan'], ARRAY['gluten'], 'Shelf B3', 15),
('Granola Bars', 'snacks', 100, 'bar', '2026-07-31', ARRAY['vegetarian'], ARRAY['nuts', 'gluten'], 'Shelf D1', 30),
('Apple Juice', 'beverages', 35, 'bottle', '2026-05-31', ARRAY['vegan', 'gluten-free'], ARRAY[]::TEXT[], 'Shelf E1', 15);
