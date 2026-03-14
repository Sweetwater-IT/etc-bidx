-- Add separate condition columns for sign, structure, and light components
ALTER TABLE takeoff_items_l
ADD COLUMN sign_condition public.pickup_condition_enum NULL,
ADD COLUMN structure_condition public.pickup_condition_enum NULL,
ADD COLUMN light_condition public.pickup_condition_enum NULL;