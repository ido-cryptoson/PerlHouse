-- ================================================
-- Bayit — Database Schema Migration
-- Household task management for Hebrew-speaking couples
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Enum Types
CREATE TYPE task_status AS ENUM ('pending', 'active', 'done', 'rejected');
CREATE TYPE task_category AS ENUM ('בית', 'ילדים', 'כספים', 'בריאות', 'קניות', 'רכב', 'כללי');
CREATE TYPE source_type AS ENUM ('whatsapp_text', 'whatsapp_image', 'whatsapp_voice', 'gmail', 'manual');

-- Tables
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  google_refresh_token TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(household_id, email)
);

-- Household Member Limit (max 2)
CREATE OR REPLACE FUNCTION check_household_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM members WHERE household_id = NEW.household_id) >= 2 THEN
    RAISE EXCEPTION 'A household can have at most 2 members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_household_member_limit
  BEFORE INSERT ON members
  FOR EACH ROW EXECUTE FUNCTION check_household_member_limit();

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  status task_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES members(id) ON DELETE SET NULL,
  icon TEXT DEFAULT '📋',
  category task_category DEFAULT 'כללי',
  due_date DATE,
  due_time TIME,
  calendar_event_id TEXT,
  source_type source_type NOT NULL DEFAULT 'manual',
  source_raw TEXT,
  needs_calendar_event BOOLEAN DEFAULT false,
  ai_confidence FLOAT DEFAULT 1.0 CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
  reply_suggestion TEXT,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_tasks_household_status ON tasks(household_id, status);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE status = 'active';
CREATE INDEX idx_members_household ON members(household_id);
CREATE INDEX idx_members_user_id ON members(user_id);

-- Row Level Security
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their household" ON households FOR SELECT
  USING (id IN (SELECT household_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "Members can view household members" ON members FOR SELECT
  USING (household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "Members can update own profile" ON members FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Members can view household tasks" ON tasks FOR SELECT
  USING (household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "Members can create household tasks" ON tasks FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()));
CREATE POLICY "Members can update household tasks" ON tasks FOR UPDATE
  USING (household_id IN (SELECT household_id FROM members WHERE user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
