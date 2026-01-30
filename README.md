npx expo install expo-location expo-sensors expo-task-manager
npm install @supabase/supabase-js react-native-url-polyfill lottie-react-native crypto-js expo-camera
npm install -D @types/crypto-js
uvicorn main:app --host 0.0.0.0 --port $PORT
npx expo prebuild --clean 


-- Create a table to store employee face data
create table employees (
  id uuid references auth.users not null primary key,
  full_name text,
  -- Store the embedding as a JSONB array or a Vector
  face_embedding jsonb, 
  office_id text
);

-- Enable gen_random_uuid() if not already enabled (usually enabled on Supabase)
create extension if not exists "pgcrypto";

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  office_id text not null,

  confidence_score numeric not null,
  status text not null default 'present' check (status in ('present', 'rejected')),

  -- Your code inserts ISO string into "timestamp"
  "timestamp" timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create index if not exists attendance_logs_user_id_idx
  on public.attendance_logs (user_id);

create index if not exists attendance_logs_user_id_timestamp_idx
  on public.attendance_logs (user_id, "timestamp" desc);

create index if not exists attendance_logs_office_id_timestamp_idx
  on public.attendance_logs (office_id, "timestamp" desc);



alter table public.attendance_logs enable row level security;

create policy "attendance_logs_select_own"
on public.attendance_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "attendance_logs_insert_own"
on public.attendance_logs
for insert
to authenticated
with check (auth.uid() = user_id);