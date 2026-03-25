-- Create build_request_items_l table for production snapshots of takeoff items

create or replace function public.set_build_request_items_l_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.build_request_items_l (
  id uuid not null default gen_random_uuid(),
  build_request_id uuid not null,
  takeoff_item_id uuid null,
  product_name text not null,
  category text not null,
  quantity numeric(12, 4) not null default 0,
  material text null,
  structure_type text null,
  order_type text not null default 'none'::text,
  order_required boolean not null default false,
  order_quantity numeric(12, 4) not null default 0,
  order_face_qty numeric(12, 4) not null default 0,
  order_full_qty numeric(12, 4) not null default 0,
  in_stock boolean not null default false,
  line_notes text not null default ''::text,
  notes_json jsonb null default '[]'::jsonb,
  diff_status text not null default 'unchanged'::text,
  diff_details jsonb null default '{}'::jsonb,
  material_override text null,
  structure_override text null,
  legend_override text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint build_request_items_l_pkey primary key (id),
  constraint build_request_items_l_build_request_id_fkey
    foreign key (build_request_id) references public.build_requests_l (id) on delete cascade,
  constraint build_request_items_l_takeoff_item_id_fkey
    foreign key (takeoff_item_id) references public.takeoff_items_l (id) on delete set null,
  constraint build_request_items_l_quantity_check
    check (quantity >= 0::numeric),
  constraint build_request_items_l_order_quantity_check
    check (order_quantity >= 0::numeric),
  constraint build_request_items_l_order_face_qty_check
    check (order_face_qty >= 0::numeric),
  constraint build_request_items_l_order_full_qty_check
    check (order_full_qty >= 0::numeric),
  constraint build_request_items_l_order_type_check
    check (order_type = any (array['none'::text, 'stock'::text, 'purchase_order'::text, 'requisition'::text, 'other'::text])),
  constraint build_request_items_l_diff_status_check
    check (diff_status = any (array['unchanged'::text, 'added'::text, 'modified'::text, 'removed'::text]))
);

create index if not exists idx_build_request_items_l_build_request_id
  on public.build_request_items_l using btree (build_request_id);

create index if not exists idx_build_request_items_l_takeoff_item_id
  on public.build_request_items_l using btree (takeoff_item_id);

create index if not exists idx_build_request_items_l_order_required
  on public.build_request_items_l using btree (order_required);

create index if not exists idx_build_request_items_l_category
  on public.build_request_items_l using btree (category);

drop trigger if exists trig_build_request_items_l_updated_at on public.build_request_items_l;
create trigger trig_build_request_items_l_updated_at
before update on public.build_request_items_l
for each row
execute function public.set_build_request_items_l_updated_at();

alter table public.build_request_items_l enable row level security;

create policy "Users can view build request items l" on public.build_request_items_l
  for select using (auth.uid() is not null);

create policy "Users can insert build request items l" on public.build_request_items_l
  for insert with check (auth.uid() is not null);

create policy "Users can update build request items l" on public.build_request_items_l
  for update using (auth.uid() is not null);

create policy "Users can delete build request items l" on public.build_request_items_l
  for delete using (auth.uid() is not null);
