create table bid_notes (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid references bid_estimates(id) on delete cascade,
  text text not null,
  created_at timestamp default now()
);