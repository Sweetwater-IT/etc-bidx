alter table if exists public.sov_items
  add column if not exists uom_7 text null;

create table if not exists public.custom_sov_items (
  id bigint generated always as identity not null,
  job_id uuid not null,
  item_number text not null,
  display_item_number text not null,
  description text not null,
  display_name text not null,
  work_type text not null,
  uom_1 text null,
  uom_2 text null,
  uom_3 text null,
  uom_4 text null,
  uom_5 text null,
  uom_6 text null,
  uom_7 text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint custom_sov_items_pkey primary key (id),
  constraint custom_sov_items_job_id_fkey foreign key (job_id) references public.jobs_l (id) on delete cascade,
  constraint custom_sov_items_job_id_item_number_key unique (job_id, item_number)
);

alter table if exists public.sov_entries
  add column if not exists custom_sov_item_id bigint null;

alter table if exists public.sov_entries
  alter column sov_item_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sov_entries_custom_sov_item_id_fkey'
  ) then
    alter table public.sov_entries
      add constraint sov_entries_custom_sov_item_id_fkey
      foreign key (custom_sov_item_id)
      references public.custom_sov_items (id)
      on delete cascade;
  end if;
end
$$;

create unique index if not exists sov_entries_job_id_custom_sov_item_id_key
  on public.sov_entries (job_id, custom_sov_item_id)
  where custom_sov_item_id is not null;

create unique index if not exists custom_sov_items_job_id_display_item_number_idx
  on public.custom_sov_items (job_id, display_item_number);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sov_entries_single_master_reference_check'
  ) then
    alter table public.sov_entries
      add constraint sov_entries_single_master_reference_check
      check (num_nonnulls(sov_item_id, custom_sov_item_id) = 1);
  end if;
end
$$;

create or replace function public.set_custom_sov_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists custom_sov_items_set_updated_at on public.custom_sov_items;

create trigger custom_sov_items_set_updated_at
before update on public.custom_sov_items
for each row
execute function public.set_custom_sov_items_updated_at();
