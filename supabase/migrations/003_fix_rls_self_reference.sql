-- Fix self-referential RLS on members table
-- The old policies caused infinite recursion (members SELECT policy queried members)

-- Helper function that bypasses RLS to find the current user's household
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID AS $$
  SELECT household_id FROM members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policies
DROP POLICY IF EXISTS "Members can view their household" ON households;
DROP POLICY IF EXISTS "Members can view household members" ON members;
DROP POLICY IF EXISTS "Members can update own profile" ON members;
DROP POLICY IF EXISTS "Members can view household tasks" ON tasks;
DROP POLICY IF EXISTS "Members can create household tasks" ON tasks;
DROP POLICY IF EXISTS "Members can update household tasks" ON tasks;

-- Recreate policies using the helper function (no self-reference)
CREATE POLICY "Members can view their household" ON households FOR SELECT
  USING (id = get_my_household_id());

CREATE POLICY "Members can view household members" ON members FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY "Members can update own profile" ON members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Members can view household tasks" ON tasks FOR SELECT
  USING (household_id = get_my_household_id());

CREATE POLICY "Members can create household tasks" ON tasks FOR INSERT
  WITH CHECK (household_id = get_my_household_id());

CREATE POLICY "Members can update household tasks" ON tasks FOR UPDATE
  USING (household_id = get_my_household_id());
