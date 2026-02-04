import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import type { Event, EventRegistration } from "./useEvents";

export interface CreateEventInput {
  title: string;
  slug: string;
  description: string;
  event_type: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  venue_name?: string;
  venue_address?: string;
  max_attendees?: number;
  is_featured?: boolean;
  is_members_only?: boolean;
  registration_deadline?: string;
  image_url?: string;
  agenda?: { time: string; title: string }[];
  speakers?: { name: string; role: string; topic: string }[];
  status?: string;
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      return await apiClient.get<Event[]>('/api/admin/events');
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const response = await apiClient.post<Event>('/api/admin/events', {
        ...input,
        status: input.status || 'upcoming',
      });
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CreateEventInput & { id: string }) => {
      const response = await apiClient.update<Event>('admin/events', id, input as Partial<Event>);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      await apiClient.delete('admin/events', eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    },
  });
}

export function useEventRegistrationsList(eventId?: string) {
  return useQuery({
    queryKey: ['admin-event-registrations', eventId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventId) params.append('event_id', eventId);
      
      return await apiClient.get<EventRegistration[]>(
        `/api/admin/event-registrations?${params.toString()}`
      );
    },
    enabled: !!eventId,
  });
}
