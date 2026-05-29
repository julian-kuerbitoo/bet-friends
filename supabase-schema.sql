-- BETS
create table bets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  prize_text text,
  prize_image_url text,
  end_date timestamptz not null,
  invite_code text not null unique,
  created_by text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- PARTICIPANTS
create table participants (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  nickname text not null,
  is_eliminated boolean not null default false,
  eliminated_at timestamptz,
  eliminated_by text,
  joined_at timestamptz not null default now(),
  unique(bet_id, nickname)
);

-- ELIMINATIONS LOG
create table eliminations (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null references bets(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  participant_nickname text not null,
  eliminated_by text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Enable realtime
alter publication supabase_realtime add table bets;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table eliminations;

-- Storage bucket for prize images
insert into storage.buckets (id, name, public) values ('bet-images', 'bet-images', true);

-- RLS: allow public read/write (no auth in this app)
alter table bets enable row level security;
alter table participants enable row level security;
alter table eliminations enable row level security;

create policy "Public bets" on bets for all using (true) with check (true);
create policy "Public participants" on participants for all using (true) with check (true);
create policy "Public eliminations" on eliminations for all using (true) with check (true);

-- Storage policy
create policy "Public images" on storage.objects for all using (bucket_id = 'bet-images') with check (bucket_id = 'bet-images');

-- APP CONFIG (for admin panel)
create table app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table app_config enable row level security;
create policy "Public config" on app_config for all using (true) with check (true);

-- Default values
insert into app_config (key, value) values
  ('app_name', 'BetFriends'),
  ('accent_1', '#f97316'),
  ('accent_2', '#ea580c'),
  ('bg_top', '#0b1e2d'),
  ('bg_bottom', '#0f0820'),
  ('splash_emoji', '🏆')
on conflict (key) do nothing;
