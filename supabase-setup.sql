-- ================================================
-- OFFICE ATTENDANCE APP - COMPLETE SUPABASE SETUP
-- ================================================
-- This file contains all SQL commands needed for the OfficeAttendanceApp
-- Execute these commands in your Supabase SQL Editor

-- ================================================
-- 1. ENABLE EXTENSIONS
-- ================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable Row Level Security (if not already enabled)
-- RLS is typically enabled by default on Supabase

-- ================================================
-- 2. CREATE TABLES
-- ================================================

-- -----------------------
-- EMPLOYEES TABLE
-- -----------------------
-- Stores employee information and face embeddings for recognition
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  -- Face embedding stored as JSONB (array of numbers from face recognition)
  face_embedding JSONB,
  office_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster office_id lookups
CREATE INDEX IF NOT EXISTS employees_office_id_idx 
  ON public.employees(office_id);

-- -----------------------
-- ATTENDANCE LOGS TABLE
-- -----------------------
-- Stores all attendance check-in records
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  office_id TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'rejected')),
  -- Timestamp of the attendance log
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS attendance_logs_user_id_idx
  ON public.attendance_logs(user_id);

CREATE INDEX IF NOT EXISTS attendance_logs_user_id_timestamp_idx
  ON public.attendance_logs(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS attendance_logs_office_id_timestamp_idx
  ON public.attendance_logs(office_id, timestamp DESC);

-- ================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- -----------------------
-- EMPLOYEES TABLE RLS
-- -----------------------
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own employee record
CREATE POLICY "employees_select_own"
ON public.employees
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to insert their own employee record (signup)
CREATE POLICY "employees_insert_own"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own employee record (face embedding, name)
CREATE POLICY "employees_update_own"
ON public.employees
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- -----------------------
-- ATTENDANCE LOGS TABLE RLS
-- -----------------------
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own attendance logs
CREATE POLICY "attendance_logs_select_own"
ON public.attendance_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own attendance logs
CREATE POLICY "attendance_logs_insert_own"
ON public.attendance_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 4. FUNCTIONS AND TRIGGERS (Optional)
-- ================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on employees table
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 5. USEFUL QUERIES FOR DEVELOPMENT/TESTING
-- ================================================

-- View all employees
-- SELECT * FROM public.employees;

-- View all attendance logs
-- SELECT * FROM public.attendance_logs ORDER BY timestamp DESC;

-- Get attendance logs for a specific user
-- SELECT * FROM public.attendance_logs 
-- WHERE user_id = 'YOUR_USER_UUID' 
-- ORDER BY timestamp DESC;

-- Get today's attendance for an office
-- SELECT al.*, e.full_name
-- FROM public.attendance_logs al
-- JOIN public.employees e ON al.user_id = e.id
-- WHERE al.office_id = 'OFFICE_MOCK_01'
-- AND al.timestamp >= CURRENT_DATE
-- ORDER BY al.timestamp DESC;

-- Count attendance by day
-- SELECT DATE(timestamp) as date, COUNT(*) as count
-- FROM public.attendance_logs
-- WHERE office_id = 'OFFICE_MOCK_01'
-- GROUP BY DATE(timestamp)
-- ORDER BY date DESC;

-- ================================================
-- 6. AUTHENTICATION SETUP NOTES
-- ================================================

-- Email/Password authentication is enabled by default in Supabase
-- No additional SQL needed for auth.users table (managed by Supabase Auth)

-- To test signup:
-- Use the app's signup form OR test in Supabase Auth dashboard

-- To manually create a test user (use Supabase Dashboard > Authentication > Users)
-- Or use the Supabase client in your app

-- ================================================
-- SETUP COMPLETE
-- ================================================
-- After running these commands:
-- 1. Verify tables are created in Supabase Table Editor
-- 2. Check RLS policies in Supabase > Authentication > Policies
-- 3. Test signup/login from your app
-- 4. Verify face embeddings can be stored in employees.face_embedding
