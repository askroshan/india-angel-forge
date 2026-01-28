import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Event } from "./useEvents";

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
      
      return await apiClient.get<WaitlistEntry | null>(
        `/api/events/${eventId}/waitlist/position`
      );
    },
    enabled: !!user && !!eventId,
  });
}

export function useWaitlistCount(eventId: string) {
  return useQuery({
    queryKey: ['waitlist-count', eventId],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>(
        `/api/events/${eventId}/waitlist/count`
      );
      return response?.count || 0;
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

      const response = await apiClient.post<WaitlistEntry>(`/api/events/${eventId}/waitlist`, {
        full_name: fullName,
        email,
        phone: phone || null,
        company: company || null,
      });

      if (response.error) {
        if (response.error.message?.includes('already on the waitlist')) {
          throw new Error('You are already on the waitlist for this event');
        }
        throw new Error(response.error.message || 'Failed to join waitlist');
      }

      return response.data;
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
      await apiClient.delete('event_waitlist', waitlistId);
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
      return await apiClient.get<(WaitlistEntry & { events: Event })[]>(
        '/api/events/my-waitlist'
      );
    },
    enabled: !!user,
  });
}
