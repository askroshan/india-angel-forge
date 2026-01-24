import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: 'monthly_forum' | 'sector_summit' | 'angel_education' | 'portfolio_gathering' | 'annual_summit';
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  venue_name: string | null;
  venue_address: string | null;
  max_attendees: number | null;
  is_featured: boolean;
  is_members_only: boolean;
  registration_deadline: string | null;
  image_url: string | null;
  agenda: { time: string; title: string }[] | null;
  speakers: { name: string; role: string; topic: string }[] | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  dietary_requirements: string | null;
  notes: string | null;
  status: 'registered' | 'attended' | 'cancelled' | 'no_show';
  registered_at: string;
}

export const EVENT_TYPE_LABELS: Record<Event['event_type'], string> = {
  monthly_forum: 'Monthly Forum',
  sector_summit: 'Sector Summit',
  angel_education: 'Angel Education',
  portfolio_gathering: 'Portfolio Gathering',
  annual_summit: 'Annual Summit',
};

export function useEvents(filter?: 'upcoming' | 'past' | 'all') {
  return useQuery({
    queryKey: ['events', filter],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: filter !== 'past' });

      if (filter === 'upcoming') {
        query = query.in('status', ['upcoming', 'ongoing']);
      } else if (filter === 'past') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as Event | null;
    },
    enabled: !!slug,
  });
}

export function useEventRegistrations(eventId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['event-registrations', eventId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('event_registrations')
        .select('*');

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EventRegistration[];
    },
    enabled: !!user,
  });
}

export function useMyRegistrations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events:event_id (*)
        `)
        .eq('user_id', user!.id)
        .neq('status', 'cancelled');

      if (error) throw error;
      return data as (EventRegistration & { events: Event })[];
    },
    enabled: !!user,
  });
}

export function useRegisterForEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      eventId,
      fullName,
      email,
      phone,
      company,
      dietaryRequirements,
      notes,
    }: {
      eventId: string;
      fullName: string;
      email: string;
      phone?: string;
      company?: string;
      dietaryRequirements?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to register');

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
          full_name: fullName,
          email,
          phone: phone || null,
          company: company || null,
          dietary_requirements: dietaryRequirements || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already registered for this event');
        }
        throw error;
      }

      // Send confirmation email
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await supabase.functions.invoke('send-event-confirmation', {
            body: { registrationId: data.id },
          });
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the registration if email fails
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('Successfully registered! Check your email for confirmation.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to register');
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('id', registrationId);

      if (error) throw error;

      // Send cancellation email
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          await supabase.functions.invoke('send-event-cancellation', {
            body: { registrationId },
          });
        }
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
        // Don't fail the cancellation if email fails
      }

      return registrationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('Registration cancelled. Check your email for confirmation.');
    },
    onError: () => {
      toast.error('Failed to cancel registration');
    },
  });
}

export function useRegistrationCount(eventId: string) {
  return useQuery({
    queryKey: ['registration-count', eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'registered');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });
}
