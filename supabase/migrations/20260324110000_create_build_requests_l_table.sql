-- Create build_requests_l table for build shop workflow on _l entities

create or replace function public.set_build_requests_l_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.build_requests_l (
  id uuid not null default gen_random_uuid(),
  job_id uuid not null,
  takeoff_id uuid not null,
  work_order_id uuid null,
  branch text null,
  requested_by uuid null,
  requested_at timestamp with time zone not null default now(),
  priority text not null default 'standard'::text,
  status text not null default 'new'::text,
  pm_notes text null,
  builder_notes text null,
  inventory_notes text null,
  rejection_reason text null,
  assigned_builder uuid null,
  signs_ordered_at timestamp with time zone null,
  signs_ready_at timestamp with time zone null,
  materials_received boolean not null default false,
  build_started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  completed_by uuid null,
  archived_at timestamp with time zone null,
  canceled_at timestamp with time zone null,
  cancel_reason text null,
  cancel_notes text null,
  revision_number integer not null default 1,
  chain_root_takeoff_id uuid not null,
  superseded_by_takeoff_id uuid null,
  last_snapshot_json jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint build_requests_l_pkey primary key (id),
  constraint build_requests_l_job_id_fkey
    foreign key (job_id) references public.jobs_l (id) on delete cascade,
  constraint build_requests_l_takeoff_id_fkey
    foreign key (takeoff_id) references public.takeoffs_l (id) on delete cascade,
  constraint build_requests_l_work_order_id_fkey
    foreign key (work_order_id) references public.work_orders_l (id) on delete set null,
  constraint build_requests_l_chain_root_takeoff_id_fkey
    foreign key (chain_root_takeoff_id) references public.takeoffs_l (id) on delete cascade,
  constraint build_requests_l_superseded_by_takeoff_id_fkey
    foreign key (superseded_by_takeoff_id) references public.takeoffs_l (id) on delete set null,
  constraint build_requests_l_priority_check
    check (priority = any (array['low'::text, 'standard'::text, 'high'::text, 'urgent'::text])),
  constraint build_requests_l_status_check
    check (
      status = any (
        array[
          'new'::text,
          'under_review'::text,
          'awaiting_signs'::text,
          'materials_ready'::text,
          'build_queue'::text,
          'in_build'::text,
          'ready_for_pm'::text,
          'completed'::text,
          'rejected'::text,
          'superseded'::text
        ]
      )
    ),
  constraint build_requests_l_revision_number_check
    check (revision_number >= 1)
);

create index if not exists idx_build_requests_l_job_id
  on public.build_requests_l using btree (job_id);

create index if not exists idx_build_requests_l_takeoff_id
  on public.build_requests_l using btree (takeoff_id);

create index if not exists idx_build_requests_l_work_order_id
  on public.build_requests_l using btree (work_order_id);

create index if not exists idx_build_requests_l_status
  on public.build_requests_l using btree (status);

create index if not exists idx_build_requests_l_archived_at
  on public.build_requests_l using btree (archived_at);

create index if not exists idx_build_requests_l_branch
  on public.build_requests_l using btree (branch);

create unique index if not exists idx_build_requests_l_active_takeoff_unique
  on public.build_requests_l using btree (takeoff_id)
  where archived_at is null
    and status <> all (array['rejected'::text, 'superseded'::text]);

drop trigger if exists trig_build_requests_l_updated_at on public.build_requests_l;
create trigger trig_build_requests_l_updated_at
before update on public.build_requests_l
for each row
execute function public.set_build_requests_l_updated_at();

alter table public.build_requests_l enable row level security;

create policy "Users can view build requests l" on public.build_requests_l
  for select using (auth.uid() is not null);

create policy "Users can insert build requests l" on public.build_requests_l
  for insert with check (auth.uid() is not null);

create policy "Users can update build requests l" on public.build_requests_l
  for update using (auth.uid() is not null);

create policy "Users can delete build requests l" on public.build_requests_l
  for delete using (auth.uid() is not null);
