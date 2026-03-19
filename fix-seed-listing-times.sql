-- Fix seed listing times: reset available_from/available_until to today's date
-- with the correct time-of-day windows. Run this once to fix the 12:27 AM issue.
--
-- Usage: psql $DATABASE_URL -f fix-seed-listing-times.sql

-- seedListings.ts listings (provider@foodbridge.local)
UPDATE food_listings fl
SET
  available_from  = (CURRENT_DATE + available_from::time),
  available_until = (CURRENT_DATE + available_until::time),
  updated_at      = NOW()
FROM users u
WHERE fl.provider_id = u.id
  AND u.email = 'provider@foodbridge.local'
  AND fl.status != 'cancelled';

-- seedDiningHall.ts listings (dininghall@university.edu)
-- These all had h(-1)/h(72) so times are corrupted — reset to proper windows by title
UPDATE food_listings fl
SET
  available_from = CASE fl.title
    WHEN 'Buttermilk Pancakes'       THEN CURRENT_DATE + TIME '07:00'
    WHEN 'Fresh Fruit Bowl'          THEN CURRENT_DATE + TIME '07:30'
    WHEN 'Belgian Waffles'           THEN CURRENT_DATE + TIME '08:00'
    WHEN 'Caesar Salad'              THEN CURRENT_DATE + TIME '11:00'
    WHEN 'Vegetable Curry with Rice' THEN CURRENT_DATE + TIME '11:30'
    WHEN 'Chicken Tacos'             THEN CURRENT_DATE + TIME '11:00'
    WHEN 'Tomato Basil Soup'         THEN CURRENT_DATE + TIME '12:00'
    WHEN 'Penne Pasta Marinara'      THEN CURRENT_DATE + TIME '12:00'
    WHEN 'Grilled Salmon Fillet'     THEN CURRENT_DATE + TIME '17:00'
    WHEN 'Herb-Roasted Chicken'      THEN CURRENT_DATE + TIME '17:30'
    WHEN 'Beef and Vegetable Stew'   THEN CURRENT_DATE + TIME '17:00'
    WHEN 'Asian Stir-Fry'            THEN CURRENT_DATE + TIME '18:00'
    ELSE available_from
  END,
  available_until = CASE fl.title
    WHEN 'Buttermilk Pancakes'       THEN CURRENT_DATE + TIME '10:00'
    WHEN 'Fresh Fruit Bowl'          THEN CURRENT_DATE + TIME '11:00'
    WHEN 'Belgian Waffles'           THEN CURRENT_DATE + TIME '11:30'
    WHEN 'Caesar Salad'              THEN CURRENT_DATE + TIME '14:00'
    WHEN 'Vegetable Curry with Rice' THEN CURRENT_DATE + TIME '14:30'
    WHEN 'Chicken Tacos'             THEN CURRENT_DATE + TIME '15:00'
    WHEN 'Tomato Basil Soup'         THEN CURRENT_DATE + TIME '15:00'
    WHEN 'Penne Pasta Marinara'      THEN CURRENT_DATE + TIME '14:30'
    WHEN 'Grilled Salmon Fillet'     THEN CURRENT_DATE + TIME '20:00'
    WHEN 'Herb-Roasted Chicken'      THEN CURRENT_DATE + TIME '20:30'
    WHEN 'Beef and Vegetable Stew'   THEN CURRENT_DATE + TIME '21:00'
    WHEN 'Asian Stir-Fry'            THEN CURRENT_DATE + TIME '21:00'
    ELSE available_until
  END,
  updated_at = NOW()
FROM users u
WHERE fl.provider_id = u.id
  AND u.email = 'dininghall@university.edu'
  AND fl.status != 'cancelled';

-- Verify
SELECT fl.title, fl.available_from, fl.available_until
FROM food_listings fl
JOIN users u ON fl.provider_id = u.id
WHERE u.email IN ('provider@foodbridge.local', 'dininghall@university.edu')
ORDER BY fl.available_from;
