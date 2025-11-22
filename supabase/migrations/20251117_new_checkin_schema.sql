-- Drop old structures if exist
drop table if exists check_ins cascade;
drop function if exists get_consecutive_checkin_days(uuid);

-- New tables
create table if not exists checkin_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method text not null check (method in ('qr','gps','manual')),
  ts_client timestamptz not null,
  ts_server timestamptz not null default now(),
  tz_offset_minutes int not null,
  geo_lat numeric,
  geo_lng numeric,
  geo_accuracy_m numeric,
  device_fp text,
  qr_session_id uuid,
  risk_score int default 0,
  status text not null default 'pending' check (status in ('verified','pending','rejected')),
  meta jsonb default '{}'::jsonb
);

create index if not exists idx_checkins_user_ts on checkin_events (user_id, ts_server desc);
create index if not exists idx_checkins_status on checkin_events (status);
create index if not exists idx_checkins_qr_session on checkin_events (qr_session_id);

create table if not exists qr_sessions (
  id uuid primary key,
  issuer_id uuid not null,
  expires_at timestamptz not null,
  payload jsonb,
  revoked bool default false
);

create table if not exists device_fingerprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  fp_hash text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  score int default 0
);