'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeads,
  getLeadStats,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  getLeadNotes,
  addLeadNote,
  getLeadHistory,
  createLead,
  type LeadFilters,
  type LeadStatus,
  type CreateLeadPayload,
} from '@/lib/api/leads';

// Query keys for cache management
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: LeadFilters) => [...leadKeys.lists(), filters] as const,
  stats: () => [...leadKeys.all, 'stats'] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  notes: (id: string) => [...leadKeys.detail(id), 'notes'] as const,
  history: (id: string) => [...leadKeys.detail(id), 'history'] as const,
};

/**
 * Hook to fetch paginated leads with filters
 */
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: leadKeys.list(filters ?? {}),
    queryFn: () => getLeads(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch lead statistics for dashboard
 */
export function useLeadStats() {
  return useQuery({
    queryKey: leadKeys.stats(),
    queryFn: getLeadStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch a single lead by ID
 */
export function useLead(id: string | null) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? ''),
    queryFn: () => getLeadById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch notes for a lead
 */
export function useLeadNotes(leadId: string | null) {
  return useQuery({
    queryKey: leadKeys.notes(leadId ?? ''),
    queryFn: () => getLeadNotes(leadId!),
    enabled: !!leadId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch status history for a lead
 */
export function useLeadHistory(leadId: string | null) {
  return useQuery({
    queryKey: leadKeys.history(leadId ?? ''),
    queryFn: () => getLeadHistory(leadId!),
    enabled: !!leadId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to update lead status
 */
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onSuccess: (data, { id }) => {
      // Update the specific lead in cache
      queryClient.setQueryData(leadKeys.detail(id), data);
      // Invalidate lists and stats to refresh counts
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
      queryClient.invalidateQueries({ queryKey: leadKeys.history(id) });
    },
  });
}

/**
 * Hook to delete a lead
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: leadKeys.detail(id) });
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
    },
  });
}

/**
 * Hook to add a note to a lead
 */
export function useAddLeadNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, note }: { leadId: string; note: string }) =>
      addLeadNote(leadId, note),
    onSuccess: (_, { leadId }) => {
      // Invalidate notes for this lead
      queryClient.invalidateQueries({ queryKey: leadKeys.notes(leadId) });
    },
  });
}

/**
 * Hook to create a new lead (public form submission)
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
    onSuccess: () => {
      // Invalidate lists and stats in case admin is viewing
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.stats() });
    },
  });
}
