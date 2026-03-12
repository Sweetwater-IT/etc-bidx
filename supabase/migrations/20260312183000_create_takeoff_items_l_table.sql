create table if not exists public.takeoff_items_l (
  id uuid not null default gen_random_uuid(),
  takeoff_id uuid not null,
  product_name text not null,
  category text not null,
  unit text not null,
  quantity numeric(12, 4) not null default 0,
  requisition_type text not null default 'none'::text,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  in_stock_qty numeric(12, 4) null default 0,
  to_order_qty numeric(12, 4) null default 0,
  inventory_status text not null default 'pending_review'::text,
  material text null,
  sign_details jsonb null,
  sign_description text null,
  sheeting text null,
  width_inches numeric(8, 2) null,
  height_inches numeric(8, 2) null,
  sqft numeric(12, 4) null,
  total_sqft numeric(12, 4) null,
  load_order integer null default 1,
  cover boolean null default true,
  secondary_signs jsonb null,
  deleted_at timestamp with time zone null,
  deleted_by uuid null,
  pickup_condition public.pickup_condition_enum null,
  pickup_images text[] null default '{}'::text[],
  constraint takeoff_items_l_pkey primary key (id),
  constraint takeoff_items_l_takeoff_id_fkey foreign key (takeoff_id) references takeoffs_l (id) on delete cascade,
  constraint takeoff_items_l_load_order_check check ((load_order >= 1)),
  constraint takeoff_items_l_quantity_check check ((quantity >= (0)::numeric)),
  constraint takeoff_items_l_requisition_type_check check (
    requisition_type = any (
      array['none'::text, 'requisition'::text, 'purchase_order'::text, 'stock'::text, 'other'::text]
    )
  ),
  constraint takeoff_items_l_in_stock_qty_check check ((in_stock_qty >= (0)::numeric)),
  constraint takeoff_items_l_to_order_qty_check check ((to_order_qty >= (0)::numeric)),
  constraint takeoff_items_l_inventory_status_check check (
    inventory_status = any (
      array[
        'pending_review'::text,
        'in_stock'::text,
        'low_stock'::text,
        'out_of_stock'::text,
        'ordered'::text,
        'backordered'::text,
        'canceled'::text
      ]
    )
  )
);

create index if not exists idx_takeoff_items_l_takeoff_id on public.takeoff_items_l using btree (takeoff_id);
create index if not exists idx_takeoff_items_l_product_name on public.takeoff_items_l using btree (product_name);
create index if not exists idx_takeoff_items_l_category on public.takeoff_items_l using btree (category);
create index if not exists idx_takeoff_items_l_inventory_status on public.takeoff_items_l using btree (inventory_status);
create index if not exists idx_takeoff_items_l_created_at on public.takeoff_items_l using btree (created_at);
create index if not exists idx_takeoff_items_l_load_order on public.takeoff_items_l using btree (load_order);
create index if not exists idx_takeoff_items_l_pickup_condition on public.takeoff_items_l using btree (pickup_condition);

drop trigger if exists trig_takeoff_item_update_timestamp on public.takeoff_items_l;
create trigger trig_takeoff_item_update_timestamp
before update on public.takeoff_items_l
for each row
execute function update_takeoff_item_timestamp();