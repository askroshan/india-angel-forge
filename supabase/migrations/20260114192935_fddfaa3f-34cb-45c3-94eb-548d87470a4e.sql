-- Fix 1: Add RLS policies to rate_limits table
-- Service role bypasses RLS, so these policies ensure regular users can't tamper with rate limits
-- while allowing edge functions (using service_role) to continue working

-- Deny all direct access to rate_limits for regular users
-- This prevents client-side manipulation of rate limiting data
CREATE POLICY "No direct access to rate_limits"
ON public.rate_limits FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Fix 2: Restrict member-only events visibility
-- First, drop the existing public SELECT policy on events
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
DROP POLICY IF EXISTS "Public can view events" ON public.events;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

-- Create new policy: public events visible to all, member-only events require authentication
CREATE POLICY "Public events visible to all, member events to authenticated only"
ON public.events FOR SELECT
USING (
  -- Show all events that are NOT members-only
  (is_members_only = false OR is_members_only IS NULL)
  OR
  -- Show members-only events only to authenticated users
  (is_members_only = true AND auth.uid() IS NOT NULL)
);

-- Admins can manage all events
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage all events"
ON public.events FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));