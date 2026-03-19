-- Delete duplicate pantry inventory items, keeping only the first one of each
DELETE FROM pantry_inventory
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY item_name ORDER BY created_at ASC) as rn
    FROM pantry_inventory
  ) t
  WHERE rn > 1
);
