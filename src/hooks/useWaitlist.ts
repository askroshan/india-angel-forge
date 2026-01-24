import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WaitlistEntry {
  id: string;
  event_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: number;
  status: 'waiting' | 'notified' | 'registered' | 'expired';
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useWaitlistPosition(eventId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['waitlist-position', eventId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('event_waitlist')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;

      // Calculate position
      const { count } = await supabase
        .from('event_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'waiting')
        .lt('created_at', data.created_at);

      return {
        ...data,
        position: (count || 0) + 1
      } as WaitlistEntry;
    },
    enabled: !!user && !!eventId,
  });
}

export function useWaitlistCount(eventId: string) {
  return useQuery({
    queryKey: ['waitlist-count', eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'waiting');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      eventId,
      fullName,
      email,
      phone,
      company,
    }: {
      eventId: string;
      fullName: string;
      email: string;
      phone?: string;
      company?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to join waitlist');

      const { data, error } = await supabase
        .from('event_waitlist')
        .insert({
          event_id: eventId,
          user_id: user.id,
          full_name: fullName,
          email,
          phone: phone || null,
          company: company || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('You are already on the waitlist for this event');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-position'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-count'] });
      toast.success('Added to waitlist! We\'ll notify you when a spot opens up.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to join waitlist');
    },
  });
}

export function useLeaveWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (waitlistId: string) => {
      const { error } = await supabase
        .from('event_waitlist')
        .delete()
        .eq('id', waitlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-position'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist-count'] });
      toast.success('Removed from waitlist');
    },
    onError: () => {
      toast.error('Failed to leave waitlist');
    },
  });
}

export function useMyWaitlistEntries() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-waitlist', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_waitlist')
        .select(`
          *,
          events:event_id (*)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'waiting');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
