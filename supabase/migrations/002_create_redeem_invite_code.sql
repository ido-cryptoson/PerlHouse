-- ================================================
-- Bayit — Redeem Invite Code Function
-- Allows a new member to join a household via invite code
-- ================================================

CREATE OR REPLACE FUNCTION redeem_invite_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find household by invite code
  SELECT id INTO v_household_id
  FROM households
  WHERE invite_code = code;

  IF v_household_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user is already a member of any household
  IF EXISTS (SELECT 1 FROM members WHERE user_id = v_user_id) THEN
    RETURN FALSE;
  END IF;

  -- Add user as member (trigger enforces max 2 members)
  INSERT INTO members (user_id, household_id, name, email)
  VALUES (
    v_user_id,
    v_household_id,
    COALESCE((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = v_user_id), 'חבר/ה'),
    (SELECT email FROM auth.users WHERE id = v_user_id)
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
