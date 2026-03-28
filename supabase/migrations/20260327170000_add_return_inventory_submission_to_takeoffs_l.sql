alter table public.takeoffs_l
add column if not exists return_inventory_submitted_at timestamp with time zone;
