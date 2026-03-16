'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type {
  LeadWithCar,
  LeadStatus,
  LeadNote,
  LeadStatusHistory,
} from '@/lib/api/leads';
import { useLeadNotes, useLeadHistory, useAddLeadNote } from '@/hooks/use-leads';
import { generateWhatsAppLink } from '@/lib/whatsapp';
import { formatPrice } from '@/lib/utils/format';

// SVG Icon components
const CloseIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/close-square-svgrepo-com.svg" alt="" width={20} height={20} className={className} />
);

const UserIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/user-svgrepo-com.svg" alt="" width={20} height={20} className={className} />
);

const MailIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/email-1573-svgrepo-com.svg" alt="" width={20} height={20} className={className} />
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/phone-svgrepo-com.svg" alt="" width={20} height={20} className={className} />
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/whatsapp-svgrepo-com.svg" alt="" width={20} height={20} className={className} />
);

const ClockIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/clock-svgrepo-com.svg" alt="" width={12} height={12} className={className} />
);

const SendIcon = ({ className }: { className?: string }) => (
  <Image src="/icons/send-svgrepo-com.svg" alt="" width={16} height={16} className={className} />
);

interface LeadDetailPanelProps {
  lead: LeadWithCar | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: LeadStatus) => void;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: '#405FF2' },
  { value: 'contacted', label: 'Contacted', color: '#F59E0B' },
  { value: 'qualified', label: 'Qualified', color: '#9333EA' },
  { value: 'converted', label: 'Converted', color: '#16A34A' },
  { value: 'closed', label: 'Closed', color: '#6B7280' },
];


function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusHistoryItem({ item }: { item: LeadStatusHistory }) {
  const fromStatus = item.old_status
    ? STATUS_OPTIONS.find((s) => s.value === item.old_status)?.label ?? item.old_status
    : 'Created';
  const toStatus =
    STATUS_OPTIONS.find((s) => s.value === item.new_status)?.label ?? item.new_status;

  return (
    <div className="flex items-start gap-3 text-[14px]">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E9F2FF] shrink-0 mt-0.5">
        <ClockIcon />
      </div>
      <div>
        <p className="text-[#050B20]">
          {item.old_status ? (
            <>
              Status changed from <span className="font-medium">{fromStatus}</span> to{' '}
              <span className="font-medium">{toStatus}</span>
            </>
          ) : (
            <>
              Lead created with status <span className="font-medium">{toStatus}</span>
            </>
          )}
        </p>
        <p className="text-[#818181] text-[13px]">
          {formatDateTime(item.changed_at)}
          {item.changed_by_name && ` by ${item.changed_by_name}`}
        </p>
      </div>
    </div>
  );
}

function NoteItem({ note }: { note: LeadNote }) {
  return (
    <div className="rounded-xl border border-[#E1E1E1] bg-[#F9FBFC] p-3">
      <p className="text-[14px] text-[#050B20] whitespace-pre-wrap">{note.note}</p>
      <p className="text-[12px] text-[#818181] mt-2">
        {formatDateTime(note.created_at)}
        {note.created_by_name && ` — ${note.created_by_name}`}
      </p>
    </div>
  );
}


export function LeadDetailPanel({
  lead,
  isOpen,
  onClose,
  onStatusChange,
}: LeadDetailPanelProps) {
  const [newNote, setNewNote] = useState('');

  const { data: notes = [], isLoading: notesLoading } = useLeadNotes(lead?.id ?? null);
  const { data: history = [], isLoading: historyLoading } = useLeadHistory(lead?.id ?? null);
  const addNoteMutation = useAddLeadNote();

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;
    await addNoteMutation.mutateAsync({ leadId: lead.id, note: newNote.trim() });
    setNewNote('');
  };

  const whatsappLink = lead?.car
    ? generateWhatsAppLink({
        year: lead.car.year,
        make: lead.car.make,
        model: lead.car.model,
        variant: lead.car.variant,
        price: lead.car.price,
      })
    : 'https://wa.me/27732144072';

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity duration-300 data-[closed]:opacity-0"
        aria-hidden="true"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <DialogPanel
              transition
              className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out data-[closed]:translate-x-full"
            >
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E1E1E1] px-6 py-4">
                  <DialogTitle className="text-[20px] font-medium text-[#050B20]">
                    Lead Details
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                {lead && (
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                      {/* Contact Info */}
                      <section>
                        <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                          Contact Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF]">
                              <UserIcon />
                            </div>
                            <div>
                              <p className="text-[15px] font-medium text-[#050B20]">
                                {lead.first_name} {lead.last_name}
                              </p>
                            </div>
                          </div>

                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF] group-hover:bg-[#405FF2] transition-colors">
                              <MailIcon />
                            </div>
                            <span className="text-[15px] text-[#050B20] group-hover:text-[#405FF2] transition-colors">
                              {lead.email}
                            </span>
                          </a>

                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-3 group"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF] group-hover:bg-[#405FF2] transition-colors">
                                <PhoneIcon />
                              </div>
                              <span className="text-[15px] text-[#050B20] group-hover:text-[#405FF2] transition-colors">
                                {lead.phone}
                              </span>
                            </a>
                          )}

                          {lead.whatsapp_number && (
                            <a
                              href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 group"
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F5E9] group-hover:bg-[#60C961] transition-colors">
                                <WhatsAppIcon />
                              </div>
                              <span className="text-[15px] text-[#050B20] group-hover:text-[#60C961] transition-colors">
                                {lead.whatsapp_number}
                              </span>
                            </a>
                          )}
                        </div>
                      </section>


                      {/* Message */}
                      <section>
                        <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                          Message
                        </h3>
                        <div className="rounded-xl border border-[#E1E1E1] bg-[#F9FBFC] p-4">
                          {lead.subject && (
                            <p className="text-[14px] font-medium text-[#050B20] mb-2">
                              {lead.subject}
                            </p>
                          )}
                          <p className="text-[14px] text-[#050B20] whitespace-pre-wrap">
                            {lead.enquiry}
                          </p>
                        </div>
                      </section>

                      {/* Car Summary */}
                      {lead.car && (
                        <section>
                          <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                            Car Interested In
                          </h3>
                          <div className="rounded-xl border border-[#E1E1E1] bg-white p-4 flex gap-4">
                            {lead.car.primary_image_url && (
                              <div className="relative h-20 w-28 shrink-0 rounded-lg overflow-hidden bg-[#050B20]">
                                <Image
                                  src={lead.car.primary_image_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="112px"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-[15px] font-medium text-[#050B20]">
                                {lead.car.year} {lead.car.make} {lead.car.model}
                              </p>
                              {lead.car.variant && (
                                <p className="text-[13px] text-[#818181]">{lead.car.variant}</p>
                              )}
                              <p className="text-[18px] font-bold text-[#3D923A] mt-1">
                                {formatPrice(lead.car.price)}
                              </p>
                            </div>
                          </div>
                        </section>
                      )}

                      {/* Enquiry Details */}
                      <section>
                        <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                          Enquiry Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-[14px]">
                          <div>
                            <p className="text-[#818181]">Source</p>
                            <p className="text-[#050B20] font-medium capitalize">
                              {lead.source?.replace('_', ' ') || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#818181]">Type</p>
                            <p className="text-[#050B20] font-medium capitalize">
                              {lead.enquiry_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#818181]">Submitted</p>
                            <p className="text-[#050B20] font-medium">
                              {formatDateTime(lead.created_at)}
                            </p>
                          </div>
                        </div>
                      </section>


                      {/* Status */}
                      <section>
                        <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                          Status
                        </h3>
                        <select
                          value={lead.status}
                          onChange={(e) => onStatusChange(e.target.value as LeadStatus)}
                          className="w-full rounded-xl border border-[#E1E1E1] bg-white px-4 py-3 text-[15px] text-[#050B20] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {/* Status History */}
                        {!historyLoading && history.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <p className="text-[13px] font-medium text-[#818181] uppercase tracking-wide">
                              History
                            </p>
                            <div className="space-y-3">
                              {history.map((item) => (
                                <StatusHistoryItem key={item.id} item={item} />
                              ))}
                            </div>
                          </div>
                        )}
                      </section>

                      {/* Notes */}
                      <section>
                        <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                          Notes
                        </h3>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Add a note..."
                              rows={2}
                              className="flex-1 rounded-xl border border-[#E1E1E1] bg-white px-4 py-3 text-[14px] text-[#050B20] placeholder:text-[#818181] resize-none focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                            />
                            <button
                              type="button"
                              onClick={handleAddNote}
                              disabled={!newNote.trim() || addNoteMutation.isPending}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#405FF2] text-white hover:bg-[#405FF2]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                            >
                              <SendIcon />
                            </button>
                          </div>

                          {notesLoading ? (
                            <p className="text-[14px] text-[#818181]">Loading notes...</p>
                          ) : notes.length > 0 ? (
                            <div className="space-y-2">
                              {notes.map((note) => (
                                <NoteItem key={note.id} note={note} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-[14px] text-[#818181]">No notes yet.</p>
                          )}
                        </div>
                      </section>


                      {/* Quick Actions */}
                      <section>
                        <h3 className="text-[16px] font-medium text-[#050B20] mb-3">
                          Quick Actions
                        </h3>
                        <div className="flex gap-3">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#405FF2] bg-white px-4 py-3 text-[14px] font-medium text-[#405FF2] hover:bg-[#E9F2FF] transition-colors"
                          >
                            <MailIcon className="h-4 w-4" />
                            Reply via Email
                          </a>
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#60C961] bg-white px-4 py-3 text-[14px] font-medium text-[#60C961] hover:bg-[#E8F5E9] transition-colors"
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                            Reply via WhatsApp
                          </a>
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
