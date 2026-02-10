import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ==================== TYPES ====================

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  linkedinUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventStartup {
  id: string;
  eventId: string;
  companyName: string;
  companyLogoUrl: string | null;
  founderName: string;
  founderPhotoUrl: string | null;
  founderLinkedin: string | null;
  pitchDescription: string | null;
  industry: string | null;
  fundingStage: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== TEAM MEMBERS ====================

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team-members');
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
  });
}

export function useAdminTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['admin-team-members'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/team-members', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/team-members', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create team member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      toast.success('Team member created successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/team-members/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update team member');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      toast.success('Team member updated successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/team-members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-members'] });
      toast.success('Team member deleted successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== PARTNERS ====================

export function usePartners() {
  return useQuery<Partner[]>({
    queryKey: ['partners'],
    queryFn: async () => {
      const response = await fetch('/api/partners');
      if (!response.ok) throw new Error('Failed to fetch partners');
      return response.json();
    },
  });
}

export function useAdminPartners() {
  return useQuery<Partner[]>({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/partners', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch partners');
      return response.json();
    },
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create partner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success('Partner created successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update partner');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success('Partner updated successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete partner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      toast.success('Partner deleted successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== EVENT STARTUPS ====================

export function useEventStartups(eventId: string) {
  return useQuery<EventStartup[]>({
    queryKey: ['event-startups', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/startups`);
      if (!response.ok) throw new Error('Failed to fetch event startups');
      return response.json();
    },
    enabled: !!eventId,
  });
}

export function useCreateEventStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, formData }: { eventId: string; formData: FormData }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/events/${eventId}/startups`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create event startup');
      }
      return response.json();
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-startups', eventId] });
      toast.success('Event startup added successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteEventStartup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, startupId }: { eventId: string; startupId: string }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/events/${eventId}/startups/${startupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete event startup');
      return response.json();
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-startups', eventId] });
      toast.success('Event startup removed successfully');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
