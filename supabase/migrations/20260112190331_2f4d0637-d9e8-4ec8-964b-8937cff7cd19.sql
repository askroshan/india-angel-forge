-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('monthly_forum', 'sector_summit', 'angel_education', 'portfolio_gathering', 'annual_summit')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  venue_name TEXT,
  venue_address TEXT,
  max_attendees INTEGER,
  is_featured BOOLEAN DEFAULT false,
  is_members_only BOOLEAN DEFAULT true,
  registration_deadline DATE,
  image_url TEXT,
  agenda JSONB,
  speakers JSONB,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  dietary_requirements TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show')),
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Events policies - public read for upcoming events
CREATE POLICY "Anyone can view published events"
ON public.events
FOR SELECT
USING (status IN ('upcoming', 'ongoing', 'completed'));

-- Admins can manage events
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Event registrations policies
CREATE POLICY "Users can view own registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can register for events"
ON public.event_registrations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel own registration"
ON public.event_registrations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all registrations"
ON public.event_registrations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for events
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;

-- Insert sample events
INSERT INTO public.events (title, slug, description, event_type, date, start_time, end_time, location, venue_name, max_attendees, is_featured, is_members_only, registration_deadline, agenda, speakers, status) VALUES
(
  'March Forum - Mumbai',
  'march-forum-mumbai-2025',
  'Monthly pitch forum featuring 6 pre-vetted startups across AI, fintech, and healthcare sectors. Join us for an afternoon of innovative pitches and networking with fellow angels.',
  'monthly_forum',
  '2025-03-15',
  '14:00',
  '18:00',
  'Mumbai, Maharashtra',
  'Taj Lands End, Bandra',
  80,
  false,
  true,
  '2025-03-12',
  '[{"time": "14:00", "title": "Registration & Welcome Coffee"}, {"time": "14:30", "title": "Opening Remarks"}, {"time": "14:45", "title": "Startup Pitches (3 companies)"}, {"time": "16:00", "title": "Networking Break"}, {"time": "16:30", "title": "Startup Pitches (3 companies)"}, {"time": "17:45", "title": "Angel Discussion & Wrap-up"}]',
  NULL,
  'upcoming'
),
(
  'AI & Deep Tech Summit',
  'ai-deep-tech-summit-2025',
  'Full-day summit focused on AI, ML, and deep tech opportunities. Featuring keynotes from industry leaders, panel discussions on emerging trends, and exclusive networking with founders building the future.',
  'sector_summit',
  '2025-03-28',
  '10:00',
  '17:00',
  'Bangalore, Karnataka',
  'ITC Gardenia',
  200,
  true,
  false,
  '2025-03-25',
  '[{"time": "10:00", "title": "Registration & Breakfast"}, {"time": "10:30", "title": "Keynote: The Future of AI in India"}, {"time": "11:15", "title": "Panel: Investing in Deep Tech"}, {"time": "12:30", "title": "Networking Lunch"}, {"time": "14:00", "title": "Startup Showcase (8 companies)"}, {"time": "16:00", "title": "Fireside Chat with Top AI Founders"}, {"time": "17:00", "title": "Closing & Networking"}]',
  '[{"name": "Dr. Anand Sharma", "role": "Chief AI Officer, TechCorp", "topic": "Keynote Speaker"}, {"name": "Priya Menon", "role": "Partner, Sequoia India", "topic": "Panel Moderator"}, {"name": "Raj Patel", "role": "Founder, AIStartup", "topic": "Fireside Chat"}]',
  'upcoming'
),
(
  'April Forum - Bangalore',
  'april-forum-bangalore-2025',
  'Monthly pitch forum with focus on SaaS and B2B tech companies. Expect high-quality deal flow and structured discussions.',
  'monthly_forum',
  '2025-04-12',
  '14:00',
  '18:00',
  'Bangalore, Karnataka',
  'WeWork Embassy Golf Links',
  90,
  false,
  true,
  '2025-04-09',
  '[{"time": "14:00", "title": "Registration & Welcome"}, {"time": "14:30", "title": "Market Overview: B2B SaaS in 2025"}, {"time": "15:00", "title": "Startup Pitches (4 companies)"}, {"time": "16:15", "title": "Coffee Break"}, {"time": "16:45", "title": "Startup Pitches (4 companies)"}, {"time": "18:00", "title": "Networking"}]',
  NULL,
  'upcoming'
),
(
  'Fintech & Payments Summit',
  'fintech-payments-summit-2025',
  'Exploring the future of digital payments, neobanking, and financial inclusion in India. Deep-dive sessions with industry experts and exclusive access to emerging fintech startups.',
  'sector_summit',
  '2025-04-20',
  '10:00',
  '17:00',
  'Delhi NCR',
  'The Leela Palace, New Delhi',
  150,
  false,
  false,
  '2025-04-17',
  '[{"time": "10:00", "title": "Registration"}, {"time": "10:30", "title": "Keynote: The State of Fintech 2025"}, {"time": "11:30", "title": "Panel: UPI and Beyond"}, {"time": "12:30", "title": "Lunch"}, {"time": "14:00", "title": "Fintech Startup Pitches"}, {"time": "16:00", "title": "Regulatory Roundtable"}, {"time": "17:00", "title": "Networking"}]',
  '[{"name": "Vikram Sharma", "role": "CEO, PayTech", "topic": "Keynote"}, {"name": "Neha Gupta", "role": "RBI Innovation Hub", "topic": "Regulatory Panel"}]',
  'upcoming'
),
(
  'May Forum - Delhi NCR',
  'may-forum-delhi-2025',
  'Monthly forum featuring climate tech, consumer brands, and healthtech startups. A diverse mix of opportunities for our member angels.',
  'monthly_forum',
  '2025-05-10',
  '14:00',
  '18:00',
  'Gurugram, Haryana',
  'Oberoi Gurugram',
  75,
  false,
  true,
  '2025-05-07',
  '[{"time": "14:00", "title": "Registration"}, {"time": "14:30", "title": "Welcome & Market Update"}, {"time": "15:00", "title": "Startup Pitches"}, {"time": "16:30", "title": "Break"}, {"time": "17:00", "title": "Angel Discussion"}, {"time": "17:45", "title": "Networking"}]',
  NULL,
  'upcoming'
),
(
  'India Angel Summit 2025',
  'india-angel-summit-2025',
  'Our flagship annual event bringing together the entire angel ecosystem. Three tracks covering early-stage investing, portfolio management, and ecosystem building. Keynotes from top founders, VCs, and policymakers. The must-attend event for serious angels.',
  'annual_summit',
  '2025-06-15',
  '09:00',
  '19:00',
  'Mumbai, Maharashtra',
  'Jio World Convention Centre',
  500,
  true,
  false,
  '2025-06-10',
  '[{"time": "09:00", "title": "Registration & Networking Breakfast"}, {"time": "10:00", "title": "Opening Keynote"}, {"time": "11:00", "title": "State of Angel Investing Panel"}, {"time": "12:00", "title": "Breakout Sessions (3 tracks)"}, {"time": "13:00", "title": "Networking Lunch"}, {"time": "14:30", "title": "Founder Stories"}, {"time": "15:30", "title": "Investment Workshops"}, {"time": "17:00", "title": "Unicorn Founders Panel"}, {"time": "18:00", "title": "Awards Ceremony"}, {"time": "19:00", "title": "Gala Dinner"}]',
  '[{"name": "Kunal Shah", "role": "Founder, CRED", "topic": "Opening Keynote"}, {"name": "Nithin Kamath", "role": "Founder, Zerodha", "topic": "Founder Stories"}, {"name": "Padmaja Ruparel", "role": "Co-Founder, IAN", "topic": "State of Angel Investing"}]',
  'upcoming'
),
(
  'February Forum - Mumbai',
  'february-forum-mumbai-2025',
  'Monthly pitch forum featuring startups in edtech, D2C, and enterprise software. Great networking and deal flow.',
  'monthly_forum',
  '2025-02-15',
  '14:00',
  '18:00',
  'Mumbai, Maharashtra',
  'Sofitel BKC',
  70,
  false,
  true,
  '2025-02-12',
  '[{"time": "14:00", "title": "Registration"}, {"time": "14:30", "title": "Pitches"}, {"time": "16:30", "title": "Discussion"}, {"time": "17:30", "title": "Networking"}]',
  NULL,
  'completed'
),
(
  'Angel Investing 101 Workshop',
  'angel-investing-101-jan-2025',
  'Comprehensive workshop for new and aspiring angel investors. Learn due diligence, term sheets, valuation, and portfolio strategy.',
  'angel_education',
  '2025-01-25',
  '10:00',
  '16:00',
  'Bangalore, Karnataka',
  'IIM Bangalore Campus',
  50,
  false,
  true,
  '2025-01-22',
  '[{"time": "10:00", "title": "Introduction to Angel Investing"}, {"time": "11:30", "title": "Due Diligence Deep Dive"}, {"time": "13:00", "title": "Lunch"}, {"time": "14:00", "title": "Term Sheets & Valuations"}, {"time": "15:30", "title": "Q&A and Networking"}]',
  '[{"name": "Mohandas Pai", "role": "Chairman, Manipal Global", "topic": "Guest Lecturer"}]',
  'completed'
);