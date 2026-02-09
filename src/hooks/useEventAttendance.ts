/**
 * Event Attendance Hooks
 * 
 * React hooks for event RSVP and attendance management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EventAttendance {
  userId: string;
  eventId: string;
  rsvpStatus: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'NO_SHOW';
  attendanceStatus: 'ATTENDED' | 'PARTIAL' | 'ABSENT' | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}

/**
 * Get current user's RSVP status for an event
 */
export function useMyRSVP(eventId: string) {
  return useQuery<{ success: boolean; data: { attendance: EventAttendance | null } }>({
    queryKey: ['my-rsvp', eventId],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}/my-rsvp`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: { attendance: null } };
        }
        throw new Error('Failed to fetch RSVP status');
      }
      return response.json();
    },
    enabled: !!eventId,
  });
}

/**
 * RSVP to an event
 */
export function useRSVPToEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to RSVP');
      }

      return response.json();
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['my-rsvp', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Successfully RSVPed to event!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to RSVP to event');
    },
  });
}

/**
 * Cancel RSVP to an event
 */
export function useCancelRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel RSVP');
      }

      return response.json();
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['my-rsvp', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('RSVP cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel RSVP');
    },
  });
}
