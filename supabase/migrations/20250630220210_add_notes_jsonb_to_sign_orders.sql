ALTER TABLE sign_orders ADD COLUMN notes jsonb DEFAULT '[]'::jsonb;
