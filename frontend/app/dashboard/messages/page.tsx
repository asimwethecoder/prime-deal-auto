'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, Users, UserCheck, Trophy, XCircle, Search } from 'lucide-react';
import {
  useLeads,
  useLeadStats,
  useUpdateLeadStatus,
  useDeleteLead,
} from '@/hooks/use-leads';
import type { LeadWithCar, LeadStatus, EnquiryType } from '@/lib/api/leads';
import { LeadTable } from '@/components/dashboard/LeadTable';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils/cn';

const LIMIT = 20;

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
] as const;

const ENQUIRY_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'test_drive', label: 'Test Drive' },
  { value: 'car_enquiry', label: 'Car Enquiry' },
] as const;

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
}

function StatCard({ label, value, icon: Icon, bgColor, iconColor }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#E1E1E1] bg-white p-5 flex items-center justify-between">
      <div>
        <p className="text-[15px] leading-[26px] text-[#050B20]">{label}</p>
        <p className="text-[30px] font-bold leading-[45px] text-[#050B20]">
          {value.toLocaleString('en-ZA')}
        </p>
      </div>
      <div
        className={cn(
          'h-[70px] w-[70px] rounded-full flex items-center justify-center shrink-0',
          bgColor
        )}
      >
        <Icon className={cn('h-8 w-8', iconColor)} />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const statusFilter = (searchParams.get('status') ?? 'all') as LeadStatus | 'all';
  const enquiryTypeFilter = (searchParams.get('type') ?? 'all') as EnquiryType | 'all';
  const searchQuery = searchParams.get('q') ?? '';

  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedLead, setSelectedLead] = useState<LeadWithCar | null>(null);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<LeadWithCar | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading } = useLeadStats();
  const { data: leadsData, isLoading: leadsLoading, isError, error } = useLeads({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    enquiryType: enquiryTypeFilter !== 'all' ? enquiryTypeFilter : undefined,
    search: searchQuery || undefined,
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
  });

  // Mutations
  const updateStatusMutation = useUpdateLeadStatus();
  const deleteMutation = useDeleteLead();

  const leads = leadsData?.data ?? [];
  const total = leadsData?.total ?? 0;
  const hasMore = leadsData?.hasMore ?? false;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // URL update helpers
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === 'all' || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      // Reset to page 1 when filters change
      if (!updates.page) {
        next.delete('page');
      }
      router.push(`?${next.toString()}`);
    },
    [searchParams, router]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateUrl({ q: searchInput.trim() || null });
    },
    [searchInput, updateUrl]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
      updateUrl({ status: status === 'all' ? null : status });
    },
    [updateUrl]
  );

  const handleEnquiryTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateUrl({ type: e.target.value === 'all' ? null : e.target.value });
    },
    [updateUrl]
  );

  const handleViewDetails = useCallback((lead: LeadWithCar) => {
    setSelectedLead(lead);
  }, []);

  const handleMarkContacted = useCallback(
    (lead: LeadWithCar) => {
      updateStatusMutation.mutate({ id: lead.id, status: 'contacted' });
    },
    [updateStatusMutation]
  );

  const handleDeleteClick = useCallback((lead: LeadWithCar) => {
    setDeleteConfirmLead(lead);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmLead) {
      deleteMutation.mutate(deleteConfirmLead.id, {
        onSuccess: () => {
          setDeleteConfirmLead(null);
          if (selectedLead?.id === deleteConfirmLead.id) {
            setSelectedLead(null);
          }
        },
      });
    }
  }, [deleteConfirmLead, deleteMutation, selectedLead]);

  const handleStatusUpdate = useCallback(
    (status: LeadStatus) => {
      if (selectedLead) {
        updateStatusMutation.mutate(
          { id: selectedLead.id, status },
          {
            onSuccess: (updatedLead) => {
              setSelectedLead(updatedLead);
            },
          }
        );
      }
    },
    [selectedLead, updateStatusMutation]
  );

  return (
    <div className="flex-1 overflow-auto bg-[#F9FBFC]">
      <div className="mx-auto max-w-[1470px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-[32px] font-bold leading-[42px] text-[#222222]">Messages</h1>
          <p className="text-[15px] leading-[28px] text-[#222222] mt-1">
            Manage customer enquiries and leads
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            label="Total"
            value={stats?.total ?? 0}
            icon={MessageSquare}
            bgColor="bg-[#E9F2FF]"
            iconColor="text-[#405FF2]"
          />
          <StatCard
            label="New"
            value={stats?.new ?? 0}
            icon={Users}
            bgColor="bg-[#E9F2FF]"
            iconColor="text-[#405FF2]"
          />
          <StatCard
            label="Contacted"
            value={stats?.contacted ?? 0}
            icon={UserCheck}
            bgColor="bg-[#FFF8E1]"
            iconColor="text-[#F59E0B]"
          />
          <StatCard
            label="Converted"
            value={stats?.converted ?? 0}
            icon={Trophy}
            bgColor="bg-[#DCFCE7]"
            iconColor="text-[#16A34A]"
          />
          <StatCard
            label="Closed"
            value={stats?.closed ?? 0}
            icon={XCircle}
            bgColor="bg-[#F3F4F6]"
            iconColor="text-[#6B7280]"
          />
        </div>

        {/* Main Content Card */}
        <div className="rounded-2xl border border-[#E1E1E1] bg-white overflow-hidden">
          {/* Status Filter Tabs */}
          <div className="flex overflow-x-auto border-b border-[#E1E1E1]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  'px-5 py-3 text-[15px] font-medium whitespace-nowrap transition-colors',
                  statusFilter === tab.value
                    ? 'text-[#405FF2] border-b-2 border-[#405FF2] bg-[#E9F2FF]/50'
                    : 'text-[#050B20]/70 hover:text-[#050B20] hover:bg-[#F9FBFC]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 border-b border-[#E1E1E1]">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="h-4 w-4 shrink-0 text-[#818181]" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="flex-1 min-w-0 text-[15px] leading-[26px] text-[#050B20] placeholder:text-[#818181] border-0 bg-transparent focus:outline-none focus:ring-0"
                aria-label="Search leads"
              />
            </form>
            <div className="flex items-center gap-3">
              <select
                value={enquiryTypeFilter}
                onChange={handleEnquiryTypeChange}
                className="text-[15px] leading-5 text-[#050B20] border border-[#E1E1E1] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                aria-label="Filter by enquiry type"
              >
                {ENQUIRY_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {total > 0 && (
                <span className="text-[14px] text-[#818181] whitespace-nowrap">
                  {total} result{total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Error State */}
          {isError && (
            <div className="p-12 text-center text-red-600">
              {error instanceof Error ? error.message : 'Failed to load leads'}
            </div>
          )}

          {/* Lead Table */}
          {!isError && (
            <LeadTable
              leads={leads}
              onViewDetails={handleViewDetails}
              onMarkContacted={handleMarkContacted}
              onDelete={handleDeleteClick}
              isLoading={leadsLoading}
            />
          )}

          {/* Pagination */}
          {!isError && leads.length > 0 && (
            <div className="border-t border-[#E1E1E1] py-6 px-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                hasMore={hasMore}
                total={total}
                limit={LIMIT}
              />
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={handleStatusUpdate}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h2 className="text-[20px] font-bold text-[#050B20] mb-2">Delete Lead?</h2>
            <p className="text-[15px] text-[#818181] mb-6">
              Are you sure you want to delete this lead from{' '}
              <span className="font-medium text-[#050B20]">
                {deleteConfirmLead.first_name} {deleteConfirmLead.last_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmLead(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-[15px] font-medium text-[#050B20] border border-[#E1E1E1] rounded-xl hover:bg-[#F9FBFC] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-[15px] font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
