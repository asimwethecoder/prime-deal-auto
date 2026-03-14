'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCars, deleteCar } from '@/lib/api/cars';
import type { CarWithImages } from '@/lib/api/types';
import { Pagination } from '@/components/ui/Pagination';
import { Icon } from '@/components/ui/Icon';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { cn } from '@/lib/utils/cn';

const LIMIT = 30;

const STATUS_TABS = [
  { value: 'all', label: 'All Listings' },
  { value: 'active', label: 'Published' },
  { value: 'pending', label: 'Drafts' },
  { value: 'sold', label: 'Sold' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest', sortBy: 'created_at' as const, sortOrder: 'desc' as const },
  { value: 'oldest', label: 'Oldest', sortBy: 'created_at' as const, sortOrder: 'asc' as const },
  { value: 'price-asc', label: 'Price low–high', sortBy: 'price' as const, sortOrder: 'asc' as const },
  { value: 'price-desc', label: 'Price high–low', sortBy: 'price' as const, sortOrder: 'desc' as const },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: CarWithImages['status'] }) {
  const config = {
    active: { label: 'Published', className: 'bg-[#E9F2FF] text-[#405FF2]' },
    pending: { label: 'Pending', className: 'bg-[#FFE9F3] text-[#405FF2]' },
    sold: { label: 'Sold', className: 'bg-[#EEF1FB] text-[#050B20]' },
    deleted: { label: 'Deleted', className: 'bg-[#F9FBFC] text-[#818181] border border-[#E1E1E1]' },
  };
  const { label, className } = config[status] ?? config.active;
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-medium', className)}>
      {label}
    </span>
  );
}

function ListingTableRow({ car, onDelete }: { car: CarWithImages; onDelete?: (id: string) => void }) {
  const thumb = (car as { primary_image_url?: string }).primary_image_url ?? car.images?.[0]?.cloudfront_url;
  const priceZar = `R${Number(car.price).toLocaleString('en-ZA')}`;

  return (
    <tr className="group border-b border-[#E1E1E1] hover:bg-[#EEF1FB] transition-colors">
      <td className="py-4 pr-4 align-top">
        <div className="flex items-start gap-4">
          <div className="relative h-[105px] w-[130px] shrink-0 rounded-2xl overflow-hidden bg-[#050B20]">
            {thumb ? (
              <Image src={thumb} alt="" fill className="object-cover" sizes="130px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">No image</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-medium leading-8 text-[#050B20]">
              {car.make}, {car.model}
            </p>
            <p className="text-[14px] leading-6 text-[#050B20] line-clamp-2">
              {car.variant || car.description?.slice(0, 80) || '—'}
            </p>
            <p className="text-[20px] font-bold leading-[30px] text-[#050B20] mt-1">{priceZar}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-2 text-[15px] leading-[26px] text-[#050B20] whitespace-nowrap">
        {formatDate(car.created_at)}
      </td>
      <td className="py-4 px-2 text-[15px] leading-[26px] text-[#050B20]">
        {car.views_count != null ? car.views_count.toLocaleString('en-ZA') : '—'}
      </td>
      <td className="py-4 px-2 text-[15px] leading-[26px] text-[#050B20]">{car.year}</td>
      <td className="py-4 px-2 text-[15px] leading-[26px] text-[#050B20] capitalize">{car.transmission}</td>
      <td className="py-4 px-2 text-[15px] leading-[26px] text-[#050B20] capitalize">{car.fuel_type}</td>
      <td className="py-4 px-2">
        <StatusBadge status={car.status} />
      </td>
      <td className="py-4 pl-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete?.(car.id)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E1E1E1] bg-[#F9FBFC] text-[#050B20] hover:opacity-80 transition-opacity"
            aria-label="Delete listing"
          >
            <DynamicIcon name="trash-2" width={18} height={18} />
          </button>
          <Link
            href={`/dashboard/listings/${car.id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E1E1E1] bg-white text-[#050B20] hover:opacity-80 transition-opacity"
            aria-label="Edit listing"
          >
            <DynamicIcon name="pencil" width={18} height={18} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function ListingCard({ car, onDelete }: { car: CarWithImages; onDelete?: (id: string) => void }) {
  const thumb = (car as { primary_image_url?: string }).primary_image_url ?? car.images?.[0]?.cloudfront_url;
  const priceZar = `R${Number(car.price).toLocaleString('en-ZA')}`;

  return (
    <div className="rounded-2xl border border-[#E1E1E1] bg-white p-4 flex flex-col gap-3">
      <div className="flex gap-4">
        <div className="relative h-24 w-32 shrink-0 rounded-xl overflow-hidden bg-[#050B20]">
          {thumb ? (
            <Image src={thumb} alt="" fill className="object-cover" sizes="128px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">No image</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-medium leading-8 text-[#050B20]">
            {car.make}, {car.model}
          </p>
          <p className="text-[14px] leading-6 text-[#050B20] line-clamp-2">
            {car.variant || car.description?.slice(0, 80) || '—'}
          </p>
          <p className="text-[20px] font-bold leading-[30px] text-[#050B20]">{priceZar}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-[15px] text-[#050B20]">
        <span>{car.year}</span>
        <span>·</span>
        <span className="capitalize">{car.transmission}</span>
        <span>·</span>
        <span className="capitalize">{car.fuel_type}</span>
        <span>·</span>
        <span>{formatDate(car.created_at)}</span>
        {car.views_count != null && (
          <>
            <span>·</span>
            <span>{car.views_count.toLocaleString('en-ZA')} views</span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#E1E1E1]">
        <StatusBadge status={car.status} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDelete?.(car.id)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E1E1E1] bg-[#F9FBFC] text-[#050B20]"
            aria-label="Delete"
          >
            <DynamicIcon name="trash-2" width={18} height={18} />
          </button>
          <Link
            href={`/dashboard/listings/${car.id}/edit`}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#E1E1E1] bg-white text-[#050B20]"
            aria-label="Edit"
          >
            <DynamicIcon name="pencil" width={18} height={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const q = searchParams.get('q') ?? '';
  const sortValue = searchParams.get('sort') ?? 'newest';
  const statusFilter = searchParams.get('status') ?? 'all';

  const [searchInput, setSearchInput] = useState(q);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const router = useRouter();
  const queryClient = useQueryClient();
  const sortConfig = SORT_OPTIONS.find((o) => o.value === sortValue) ?? SORT_OPTIONS[0];
  const params = {
    limit: LIMIT,
    offset: (page - 1) * LIMIT,
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
    ...(q.trim() && { model: q.trim() }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard-listings', page, q, sortValue, statusFilter],
    queryFn: async () => {
      const res = await getCars(params);
      return res;
    },
  });

  const cars = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const next = new URLSearchParams(searchParams.toString());
      next.set('q', searchInput.trim());
      next.delete('page');
      router.push(`?${next.toString()}`);
    },
    [searchInput, searchParams, router]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set('sort', e.target.value);
      next.delete('page');
      router.push(`?${next.toString()}`);
    },
    [searchParams, router]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set('status', status);
      next.delete('page');
      router.push(`?${next.toString()}`);
    },
    [searchParams, router]
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-listings'] });
      setDeleteId(null);
    },
  });

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  }, [deleteId, deleteMutation]);

  return (
    <div className="flex-1 overflow-auto bg-[#F9FBFC]">
      <div className="mx-auto max-w-[1470px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-[32px] font-bold leading-[42px] text-[#222222]">My Listings</h1>
          <p className="text-[15px] leading-[28px] text-[#222222] mt-1">
            Lorem ipsum dolor sit amet, consectetur.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E1E1] bg-white overflow-hidden">
          {/* Status Filter Tabs */}
          <div className="flex border-b border-[#E1E1E1]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  'px-6 py-3 text-[15px] font-medium transition-colors',
                  statusFilter === tab.value
                    ? 'text-[#405FF2] border-b-2 border-[#405FF2] bg-[#E9F2FF]/50'
                    : 'text-[#050B20]/70 hover:text-[#050B20] hover:bg-[#F9FBFC]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 border-b border-[#E1E1E1]">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
              <Icon src="search-alt-2-svgrepo-com.svg" width={16} height={16} className="shrink-0 text-[#050B20]" aria-hidden />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search Cars eg. Audi Q7"
                className="flex-1 min-w-0 text-[15px] leading-[26px] text-[#050B20] placeholder:text-[#818181] border-0 bg-transparent focus:outline-none focus:ring-0"
                aria-label="Search listings"
              />
            </form>
            <div className="flex items-center gap-2">
              <span className="text-[15px] leading-5 text-[#818181]">Sort By</span>
              <select
                value={sortValue}
                onChange={handleSortChange}
                className="text-[15px] leading-5 text-[#050B20] border border-[#E1E1E1] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="p-12 text-center text-[#050B20]">Loading listings…</div>
          )}
          {isError && (
            <div className="p-12 text-center text-red-600">
              {error instanceof Error ? error.message : 'Failed to load listings'}
            </div>
          )}

          {!isLoading && !isError && (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[900px]" cellPadding={0} cellSpacing={0}>
                  <thead>
                    <tr className="bg-[#E9F2FF]">
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 pl-6 pr-2 rounded-tl-2xl">
                        Car Detail
                      </th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 px-2">Date Listed</th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 px-2">Views</th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 px-2">Year</th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 px-2">Transmission</th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 px-2">FuelType</th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 px-2">Status</th>
                      <th className="text-left text-[16px] font-medium text-[#405FF2] py-4 pr-6 pl-2 rounded-tr-2xl">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[#050B20]">
                          No listings found.
                        </td>
                      </tr>
                    ) : (
                      cars.map((car) => (
                        <ListingTableRow key={car.id} car={car} onDelete={handleDeleteClick} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden flex flex-col gap-4 p-4">
                {cars.length === 0 ? (
                  <p className="py-8 text-center text-[#050B20]">No listings found.</p>
                ) : (
                  cars.map((car) => (
                    <ListingCard key={car.id} car={car} onDelete={handleDeleteClick} />
                  ))
                )}
              </div>

              {cars.length > 0 && (
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
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h2 className="text-[20px] font-bold text-[#050B20] mb-2">Delete Listing?</h2>
            <p className="text-[15px] text-[#818181] mb-6">
              Are you sure you want to delete this listing? This will remove it from public view.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
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
