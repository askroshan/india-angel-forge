import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
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
  reminder_sent?: boolean;
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
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      
      const data = await apiClient.get<Event[]>(`/api/events?${params.toString()}`);
      return data || [];
    },
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      try {
        return await apiClient.get<Event>(`/api/events/${slug}`);
      } catch (error: unknown) {
        const err = error as { response?: { status: number } };
        if (err.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!slug,
  });
}

export function useEventRegistrations(eventId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['event-registrations', eventId, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventId) params.append('event_id', eventId);
      
      const data = await apiClient.get<EventRegistration[]>(
        `/api/events/registrations?${params.toString()}`
      );
      return data || [];
    },
    enabled: !!user,
  });
}

export function useMyRegistrations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const data = await apiClient.get<(EventRegistration & { events: Event })[]>(
        '/api/events/my-registrations'
      );
      return data || [];
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

      const response = await apiClient.post('/api/events/register', {
        event_id: eventId,
        full_name: fullName,
        email,
        phone,
        company,
        dietary_requirements: dietaryRequirements,
        notes,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('Successfully registered! Check your email for confirmation.');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message = err.response?.data?.message || err.message || 'Failed to register';
      toast.error(message);
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      await apiClient.delete('event_registrations', registrationId);
      return registrationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-position'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-count'] });
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
      const data = await apiClient.get<{ count: number }>(
        `/api/events/${eventId}/registration-count`
      );
      return data?.count || 0;
    },
    enabled: !!eventId,
  });
}
