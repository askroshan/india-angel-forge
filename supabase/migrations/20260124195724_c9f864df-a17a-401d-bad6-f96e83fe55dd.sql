-- Create event waitlist table
CREATE TABLE public.event_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'registered', 'expired')),
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own waitlist entries"
ON public.event_waitlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can join waitlist"
ON public.event_waitlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own waitlist entries"
ON public.event_waitlist FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from waitlist"
ON public.event_waitlist FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_event_waitlist_updated_at
BEFORE UPDATE ON public.event_waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate waitlist position
CREATE OR REPLACE FUNCTION public.get_waitlist_position(p_event_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  position INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO position
  FROM public.event_waitlist
  WHERE event_id = p_event_id
    AND status = 'waiting'
    AND created_at < (
      SELECT created_at FROM public.event_waitlist
      WHERE event_id = p_event_id AND user_id = p_user_id
    );
  RETURN position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add reminder_sent column to track which registrations got reminders
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;