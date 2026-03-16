'use client';

import Image from 'next/image';
import { Mail, Phone, MessageCircle, Calendar, Car, HelpCircle, Eye, Trash2 } from 'lucide-react';
import type { LeadWithCar, LeadStatus, EnquiryType } from '@/lib/api/leads';
import { cn } from '@/lib/utils/cn';

interface LeadTableProps {
  leads: LeadWithCar[];
  onViewDetails: (lead: LeadWithCar) => void;
  onMarkContacted: (lead: LeadWithCar) => void;
  onDelete: (lead: LeadWithCar) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-[#E9F2FF] text-[#405FF2]' },
  contacted: { label: 'Contacted', className: 'bg-[#FFF8E1] text-[#F59E0B]' },
  qualified: { label: 'Qualified', className: 'bg-[#F3E8FF] text-[#9333EA]' },
  converted: { label: 'Converted', className: 'bg-[#DCFCE7] text-[#16A34A]' },
  closed: { label: 'Closed', className: 'bg-[#F3F4F6] text-[#6B7280]' },
};

const ENQUIRY_TYPE_CONFIG: Record<EnquiryType, { label: string; icon: typeof Mail }> = {
  general: { label: 'General', icon: HelpCircle },
  test_drive: { label: 'Test Drive', icon: Calendar },
  car_enquiry: { label: 'Car Enquiry', icon: Car },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-medium', config.className)}>
      {config.label}
    </span>
  );
}

function EnquiryTypeBadge({ type }: { type: EnquiryType }) {
  const config = ENQUIRY_TYPE_CONFIG[type] ?? ENQUIRY_TYPE_CONFIG.general;
  const Icon = config.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] text-[#050B20]">
      <Icon className="h-4 w-4 text-[#818181]" />
      {config.label}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LeadTableRow({
  lead,
  onViewDetails,
  onMarkContacted,
  onDelete,
}: {
  lead: LeadWithCar;
  onViewDetails: () => void;
  onMarkContacted: () => void;
  onDelete: () => void;
}) {
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const carDisplay = lead.car
    ? `${lead.car.year} ${lead.car.make} ${lead.car.model}`
    : 'General Enquiry';

  return (
    <tr className="group border-b border-[#E1E1E1] hover:bg-[#F9FBFC] transition-colors">
      <td className="py-4 pl-6 pr-2">
        <StatusBadge status={lead.status} />
      </td>
      <td className="py-4 px-2">
        <p className="text-[15px] font-medium text-[#050B20]">{fullName}</p>
      </td>
      <td className="py-4 px-2">
        <div className="flex flex-col gap-1">
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-1.5 text-[14px] text-[#050B20] hover:text-[#405FF2] transition-colors"
          >
            <Mail className="h-3.5 w-3.5 text-[#818181]" />
            {lead.email}
          </a>
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 text-[14px] text-[#050B20] hover:text-[#405FF2] transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-[#818181]" />
              {lead.phone}
            </a>
          )}
        </div>
      </td>
      <td className="py-4 px-2">
        {lead.car ? (
          <div className="flex items-center gap-3">
            {lead.car.primary_image_url && (
              <div className="relative h-10 w-14 shrink-0 rounded-lg overflow-hidden bg-[#050B20]">
                <Image
                  src={lead.car.primary_image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            )}
            <span className="text-[14px] text-[#050B20]">{carDisplay}</span>
          </div>
        ) : (
          <span className="text-[14px] text-[#818181]">General Enquiry</span>
        )}
      </td>
      <td className="py-4 px-2">
        <EnquiryTypeBadge type={lead.enquiry_type} />
      </td>
      <td className="py-4 px-2 text-[14px] text-[#050B20] whitespace-nowrap">
        {formatDate(lead.created_at)}
      </td>
      <td className="py-4 pl-2 pr-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onViewDetails}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E1E1E1] bg-white text-[#050B20] hover:bg-[#E9F2FF] hover:border-[#405FF2] transition-colors"
            aria-label="View details"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {lead.status === 'new' && (
            <button
              type="button"
              onClick={onMarkContacted}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E1E1E1] bg-white text-[#050B20] hover:bg-[#FFF8E1] hover:border-[#F59E0B] transition-colors"
              aria-label="Mark as contacted"
              title="Mark as Contacted"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E1E1E1] bg-white text-[#050B20] hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
            aria-label="Delete lead"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function LeadCard({
  lead,
  onViewDetails,
  onMarkContacted,
  onDelete,
}: {
  lead: LeadWithCar;
  onViewDetails: () => void;
  onMarkContacted: () => void;
  onDelete: () => void;
}) {
  const fullName = `${lead.first_name} ${lead.last_name}`;
  const carDisplay = lead.car
    ? `${lead.car.year} ${lead.car.make} ${lead.car.model}`
    : 'General Enquiry';

  return (
    <div className="rounded-2xl border border-[#E1E1E1] bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[16px] font-medium text-[#050B20]">{fullName}</p>
          <p className="text-[14px] text-[#818181]">{formatDate(lead.created_at)}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <a
          href={`mailto:${lead.email}`}
          className="inline-flex items-center gap-1.5 text-[14px] text-[#050B20] hover:text-[#405FF2]"
        >
          <Mail className="h-3.5 w-3.5 text-[#818181]" />
          {lead.email}
        </a>
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="inline-flex items-center gap-1.5 text-[14px] text-[#050B20] hover:text-[#405FF2]"
          >
            <Phone className="h-3.5 w-3.5 text-[#818181]" />
            {lead.phone}
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E1E1E1]">
        <div className="flex items-center gap-3">
          <EnquiryTypeBadge type={lead.enquiry_type} />
          <span className="text-[13px] text-[#818181]">•</span>
          <span className="text-[13px] text-[#818181]">{carDisplay}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-[#405FF2] bg-white text-[#405FF2] text-[14px] font-medium hover:bg-[#E9F2FF] transition-colors"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
        {lead.status === 'new' && (
          <button
            type="button"
            onClick={onMarkContacted}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E1E1E1] bg-white text-[#050B20] hover:bg-[#FFF8E1] transition-colors"
            aria-label="Mark as contacted"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E1E1E1] bg-white text-[#050B20] hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function LeadTable({
  leads,
  onViewDetails,
  onMarkContacted,
  onDelete,
  isLoading,
}: LeadTableProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-[#050B20]">Loading leads…</div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center text-[#818181]">
        No leads found matching your filters.
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-[#E9F2FF]">
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 pl-6 pr-2">
                Status
              </th>
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 px-2">
                Client Name
              </th>
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 px-2">
                Contact
              </th>
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 px-2">
                Car Interested In
              </th>
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 px-2">
                Enquiry Type
              </th>
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 px-2">
                Date
              </th>
              <th className="text-left text-[14px] font-medium text-[#405FF2] py-3 pl-2 pr-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                onViewDetails={() => onViewDetails(lead)}
                onMarkContacted={() => onMarkContacted(lead)}
                onDelete={() => onDelete(lead)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4 p-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onViewDetails={() => onViewDetails(lead)}
            onMarkContacted={() => onMarkContacted(lead)}
            onDelete={() => onDelete(lead)}
          />
        ))}
      </div>
    </>
  );
}
