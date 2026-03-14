'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCar, updateCar, deleteCar } from '@/lib/api/cars';
import { ApiError } from '@/lib/api/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils/cn';

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
  { value: 'cvt', label: 'CVT' },
] as const;

const FUEL_OPTIONS = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Published' },
  { value: 'pending', label: 'Draft' },
  { value: 'sold', label: 'Sold' },
] as const;

const BODY_TYPE_OPTIONS = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'MPV', 'Bakkie', 'Other',
];

const FEATURE_OPTIONS = [
  'Air Conditioning', 'Cruise Control', 'Leather Seats', 'Bluetooth',
  'Park Distance Control', 'Sunroof', 'Navigation', 'Reverse Camera',
  'Keyless Entry', 'Heated Seats', 'Alloy Wheels', 'Tow Bar',
];

const editListingSchema = z.object({
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  variant: z.string().max(100),
  year: z.coerce.number().min(1900, 'Invalid year').max(2100),
  mileage: z.coerce.number().min(0, 'Mileage must be 0 or more'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  body_type: z.string().max(50),
  transmission: z.enum(['automatic', 'manual', 'cvt']),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  color: z.string().max(50),
  description: z.string().max(5000),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  features: z.array(z.string()),
  status: z.enum(['active', 'pending', 'sold']),
});

type EditListingFormValues = z.infer<typeof editListingSchema>;
type TabId = 'details' | 'price' | 'features' | 'status';

const TABS: { id: TabId; label: string }[] = [
  { id: 'details', label: 'Car Details' },
  { id: 'price', label: 'Price' },
  { id: 'features', label: 'Features' },
  { id: 'status', label: 'Status' },
];


export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: car, isLoading, isError, error } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => getCar(carId),
    enabled: !!carId,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditListingFormValues>({
    resolver: zodResolver(editListingSchema),
    defaultValues: {
      make: '', model: '', variant: '', year: new Date().getFullYear(),
      mileage: 0, condition: 'good', body_type: '', transmission: 'automatic',
      fuel_type: 'petrol', color: '', description: '', price: 0, features: [], status: 'active',
    },
  });

  // Populate form when car data loads
  useEffect(() => {
    if (car) {
      reset({
        make: car.make || '',
        model: car.model || '',
        variant: car.variant || '',
        year: car.year || new Date().getFullYear(),
        mileage: car.mileage || 0,
        condition: car.condition || 'good',
        body_type: car.body_type || '',
        transmission: car.transmission || 'automatic',
        fuel_type: car.fuel_type || 'petrol',
        color: car.color || '',
        description: car.description || '',
        price: Number(car.price) || 0,
        features: Array.isArray(car.features) ? car.features : [],
        status: car.status === 'deleted' ? 'pending' : (car.status || 'active'),
      });
    }
  }, [car, reset]);

  const features = watch('features') ?? [];

  const toggleFeature = useCallback((feature: string) => {
    const next = features.includes(feature)
      ? features.filter((f) => f !== feature)
      : [...features, feature];
    setValue('features', next, { shouldDirty: true });
  }, [features, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EditListingFormValues>) => updateCar(carId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car', carId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-listings'] });
      setSubmitError(null);
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Failed to update listing';
      setSubmitError(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCar(carId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-listings'] });
      router.push('/dashboard/listings');
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Failed to delete listing';
      setSubmitError(message);
      setShowDeleteModal(false);
    },
  });

  const onSubmit = useCallback(async (data: EditListingFormValues) => {
    setSubmitError(null);
    await updateMutation.mutateAsync({
      make: data.make.trim(),
      model: data.model.trim(),
      variant: data.variant?.trim() || undefined,
      year: data.year,
      price: data.price,
      mileage: data.mileage,
      condition: data.condition,
      body_type: data.body_type?.trim() || undefined,
      transmission: data.transmission,
      fuel_type: data.fuel_type,
      color: data.color?.trim() || undefined,
      description: data.description?.trim() || undefined,
      features: data.features?.length ? data.features : undefined,
      status: data.status,
    });
  }, [updateMutation]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto bg-[#F9FBFC]">
        <div className="mx-auto max-w-[1470px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-6 w-64 bg-gray-200 rounded mb-6" />
            <div className="rounded-2xl border border-[#E1E1E1] bg-white p-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 overflow-auto bg-[#F9FBFC]">
        <div className="mx-auto max-w-[1470px] px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-[32px] font-bold text-[#222222]">Edit Listing</h1>
          <div className="mt-6 p-6 rounded-2xl border border-red-200 bg-red-50 text-red-700">
            {error instanceof Error ? error.message : 'Failed to load listing'}
          </div>
          <Link href="/dashboard/listings" className="mt-4 inline-block text-[#405FF2] font-medium hover:underline">
            Back to My Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F9FBFC]">
      <div className="mx-auto max-w-[1470px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold leading-[42px] text-[#222222]">Edit Listing</h1>
            <p className="text-[15px] leading-[28px] text-[#222222] mt-1">
              {car?.make} {car?.model} {car?.variant && `- ${car.variant}`}
            </p>
          </div>
          <Link href="/dashboard/listings" className="text-[#405FF2] font-medium hover:underline">
            ← Back to Listings
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E1E1E1] bg-white overflow-hidden">
          <div className="border-b border-[#E1E1E1] flex flex-wrap gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-6 py-4 text-[15px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-[#405FF2] border-b-2 border-[#405FF2] bg-[#E9F2FF]/50'
                    : 'text-[#050B20]/70 hover:text-[#050B20] hover:bg-[#F9FBFC]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="p-6 sm:p-8" onSubmit={handleSubmit(onSubmit)}>
            {submitError && (
              <div className="mb-6 p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]" role="alert">
                {submitError}
              </div>
            )}
            {updateMutation.isSuccess && (
              <div className="mb-6 p-3 rounded-[12px] bg-green-50 border border-green-200 text-green-700 text-[14px]">
                Listing updated successfully!
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <Input label="Make" placeholder="e.g. Toyota" error={errors.make?.message} {...register('make')} />
                  <Input label="Model" placeholder="e.g. Corolla" error={errors.model?.message} {...register('model')} />
                  <Input label="Variant (optional)" placeholder="e.g. 1.8 XRS" error={errors.variant?.message} {...register('variant')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input label="Year" type="number" error={errors.year?.message} {...register('year', { valueAsNumber: true })} />
                  <Input label="Mileage (km)" type="number" error={errors.mileage?.message} {...register('mileage', { valueAsNumber: true })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Condition</label>
                    <select className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]" {...register('condition')}>
                      {CONDITION_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Body type</label>
                    <select className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]" {...register('body_type')}>
                      <option value="">Select</option>
                      {BODY_TYPE_OPTIONS.map((b) => (<option key={b} value={b}>{b}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Transmission</label>
                    <select className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]" {...register('transmission')}>
                      {TRANSMISSION_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Fuel type</label>
                    <select className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]" {...register('fuel_type')}>
                      {FUEL_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                  </div>
                </div>
                <Input label="Color (optional)" placeholder="e.g. Pearl White" {...register('color')} />
                <div className="w-full">
                  <label className="block text-sm font-medium text-primary mb-2">Description (optional)</label>
                  <textarea rows={4} placeholder="Describe the vehicle..." className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] resize-y" {...register('description')} />
                </div>
              </div>
            )}

            {activeTab === 'price' && (
              <div className="space-y-5 max-w-md">
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-medium text-[#050B20]">R</span>
                  <Input label="Price (ZAR)" type="number" placeholder="0" error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-3">
                <p className="text-[15px] text-[#050B20] mb-4">Select all features that apply to this vehicle.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURE_OPTIONS.map((feature) => (
                    <label key={feature} className="flex items-center gap-3 cursor-pointer p-3 rounded-[12px] border border-[#E1E1E1] hover:bg-[#F9FBFC]">
                      <Checkbox checked={features.includes(feature)} onChange={() => toggleFeature(feature)} />
                      <span className="text-[15px] text-[#050B20]">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="space-y-5 max-w-md">
                <div className="w-full">
                  <label className="block text-sm font-medium text-primary mb-2">Listing Status</label>
                  <select className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]" {...register('status')}>
                    {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                  </select>
                </div>
                <div className="pt-6 border-t border-[#E1E1E1]">
                  <h3 className="text-[16px] font-medium text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-[14px] text-[#818181] mb-4">Deleting this listing will remove it from public view. This action can be undone by an administrator.</p>
                  <Button type="button" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => setShowDeleteModal(true)}>
                    Delete Listing
                  </Button>
                </div>
              </div>
            )}

            <div className={cn('flex flex-col-reverse sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-[#E1E1E1]', 'sticky bottom-0 bg-white -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 sm:py-0 sm:relative sm:bg-transparent sm:border-t')}>
              <Button type="submit" variant="primary" loading={isSubmitting || updateMutation.isPending} disabled={isSubmitting || updateMutation.isPending || !isDirty}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
            <h2 className="text-[20px] font-bold text-[#050B20] mb-2">Delete Listing?</h2>
            <p className="text-[15px] text-[#818181] mb-6">
              Are you sure you want to delete "{car?.make} {car?.model}"? This will remove it from public listings.
            </p>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button type="button" variant="primary" className="bg-red-500 hover:bg-red-600" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
