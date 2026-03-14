'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { createCar } from '@/lib/api/cars';
import { getMakes, getModels, getVariants, createMake, createModel, createVariant } from '@/lib/api/makes';
import { getImageUploadUrl, saveImageMetadata } from '@/lib/api/images';
import { ApiError } from '@/lib/api/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { SelectOrCreate, SelectOption } from '@/components/ui/SelectOrCreate';
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

const BODY_TYPE_OPTIONS = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'MPV', 'Bakkie', 'Other',
];

const FEATURE_OPTIONS = [
  'Air Conditioning', 'Cruise Control', 'Leather Seats', 'Bluetooth',
  'Park Distance Control', 'Sunroof', 'Navigation', 'Reverse Camera',
  'Keyless Entry', 'Heated Seats', 'Alloy Wheels', 'Tow Bar',
];

const MAX_IMAGES = 20;
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp';

// Schema with z.coerce for number fields
const addListingSchema = z.object({
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  variant: z.string().max(100).optional(),
  year: z.coerce.number().min(1900, 'Invalid year').max(2100),
  mileage: z.coerce.number().min(0, 'Mileage must be 0 or more'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  body_type: z.string().max(50).optional(),
  transmission: z.enum(['automatic', 'manual', 'cvt']),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
  color: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  features: z.array(z.string()).default([]),
});

// Use z.input for form input types (what the form fields receive)
// Use z.output for validated output types (what onSubmit receives)
type SchemaInput = z.input<typeof addListingSchema>;
type SchemaOutput = z.output<typeof addListingSchema>;

type TabId = 'details' | 'price' | 'features' | 'media';

const TABS: { id: TabId; label: string }[] = [
  { id: 'details', label: 'Car Details' },
  { id: 'price', label: 'Price' },
  { id: 'features', label: 'Features' },
  { id: 'media', label: 'Media' },
];

export default function AddListingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Selected entities for hierarchical dropdowns
  const [selectedMake, setSelectedMake] = useState<SelectOption | null>(null);
  const [selectedModel, setSelectedModel] = useState<SelectOption | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<SelectOption | null>(null);

  // Use z.input and z.output types for proper TypeScript compatibility with z.coerce
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchemaInput, unknown, SchemaOutput>({
    resolver: zodResolver(addListingSchema),
    defaultValues: {
      make: '',
      model: '',
      variant: '',
      year: new Date().getFullYear(),
      mileage: 0,
      condition: 'good',
      body_type: '',
      transmission: 'automatic',
      fuel_type: 'petrol',
      color: '',
      description: '',
      price: 0,
      features: [],
    },
  });

  // Fetch makes
  const { data: makes = [], isLoading: makesLoading } = useQuery({
    queryKey: ['makes'],
    queryFn: getMakes,
  });

  // Fetch models when make is selected
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['models', selectedMake?.id],
    queryFn: () => getModels(selectedMake!.id),
    enabled: !!selectedMake?.id,
  });

  // Fetch variants when model is selected
  const { data: variants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ['variants', selectedModel?.id],
    queryFn: () => getVariants(selectedModel!.id),
    enabled: !!selectedModel?.id,
  });

  const features = watch('features') ?? [];

  const toggleFeature = useCallback((feature: string) => {
    const current = features ?? [];
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    setValue('features', next);
  }, [features, setValue]);

  // Handle make selection
  const handleMakeChange = useCallback((option: SelectOption | null) => {
    setSelectedMake(option);
    setValue('make', option?.name || '');
    // Reset model and variant when make changes
    setSelectedModel(null);
    setSelectedVariant(null);
    setValue('model', '');
    setValue('variant', '');
  }, [setValue]);

  // Handle model selection
  const handleModelChange = useCallback((option: SelectOption | null) => {
    setSelectedModel(option);
    setValue('model', option?.name || '');
    // Reset variant when model changes
    setSelectedVariant(null);
    setValue('variant', '');
  }, [setValue]);

  // Handle variant selection
  const handleVariantChange = useCallback((option: SelectOption | null) => {
    setSelectedVariant(option);
    setValue('variant', option?.name || '');
  }, [setValue]);

  // Create new make
  const handleCreateMake = useCallback(async (name: string): Promise<SelectOption> => {
    const newMake = await createMake(name);
    return { id: newMake.id, name: newMake.name };
  }, []);

  // Create new model
  const handleCreateModel = useCallback(async (name: string): Promise<SelectOption> => {
    if (!selectedMake) throw new Error('Please select a make first');
    const newModel = await createModel(selectedMake.id, name);
    return { id: newModel.id, name: newModel.name };
  }, [selectedMake]);

  // Create new variant
  const handleCreateVariant = useCallback(async (name: string): Promise<SelectOption> => {
    if (!selectedModel) throw new Error('Please select a model first');
    const newVariant = await createVariant(selectedModel.id, name);
    return { id: newVariant.id, name: newVariant.name };
  }, [selectedModel]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImageFiles((prev) => {
      const combined = [...prev, ...files].filter(
        (f) => ACCEPT_IMAGES.split(',').some((t) => t.trim() === f.type)
      );
      return combined.slice(0, MAX_IMAGES);
    });
    e.target.value = '';
  }, []);

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = useCallback(
    async (data: SchemaOutput, status: 'active' | 'pending') => {
      setSubmitError(null);
      try {
        const car = await createCar({
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
          status,
        });

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const contentType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';
          const filename = file.name || `image-${i + 1}.${contentType.split('/')[1] || 'jpg'}`;
          const { presignedUrl, s3Key } = await getImageUploadUrl(car.id, filename, contentType);
          await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': contentType },
          });
          await saveImageMetadata(car.id, s3Key, filename);
        }

        router.push(`/dashboard/listings/${car.id}/edit`);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.';
        setSubmitError(message);
      }
    },
    [imageFiles, router]
  );

  const handleSaveDraft = useCallback(() => {
    handleSubmit(
      (data) => onSubmit(data, 'pending'),
      () => setActiveTab('details')
    )();
  }, [handleSubmit, onSubmit]);

  const handlePublish = useCallback(() => {
    handleSubmit(
      (data) => onSubmit(data, 'active'),
      () => setActiveTab('details')
    )();
  }, [handleSubmit, onSubmit]);

  // Convert API data to SelectOption format
  const makeOptions: SelectOption[] = makes.map((m) => ({ id: m.id, name: m.name }));
  const modelOptions: SelectOption[] = models.map((m) => ({ id: m.id, name: m.name }));
  const variantOptions: SelectOption[] = variants.map((v) => ({ id: v.id, name: v.name }));


  return (
    <div className="flex-1 overflow-auto bg-[#F9FBFC]">
      <div className="mx-auto max-w-[1470px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-[32px] font-bold leading-[42px] text-[#222222]">Add Listing</h1>
          <p className="text-[15px] leading-[28px] text-[#222222] mt-1">
            Add a new car to your listings. Fill in the details below.
          </p>
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

          <form className="p-6 sm:p-8" onSubmit={(e) => e.preventDefault()}>
            {submitError && (
              <div
                className="mb-6 p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <SelectOrCreate
                    label="Make"
                    placeholder="Search or add make..."
                    options={makeOptions}
                    value={selectedMake}
                    onChange={handleMakeChange}
                    onCreateNew={handleCreateMake}
                    isLoading={makesLoading}
                    error={errors.make?.message}
                  />
                  <SelectOrCreate
                    label="Model"
                    placeholder={selectedMake ? 'Search or add model...' : 'Select make first'}
                    options={modelOptions}
                    value={selectedModel}
                    onChange={handleModelChange}
                    onCreateNew={handleCreateModel}
                    disabled={!selectedMake}
                    isLoading={modelsLoading}
                    error={errors.model?.message}
                  />
                  <SelectOrCreate
                    label="Variant (optional)"
                    placeholder={selectedModel ? 'Search or add variant...' : 'Select model first'}
                    options={variantOptions}
                    value={selectedVariant}
                    onChange={handleVariantChange}
                    onCreateNew={handleCreateVariant}
                    disabled={!selectedModel}
                    isLoading={variantsLoading}
                    error={errors.variant?.message}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Year"
                    type="number"
                    error={errors.year?.message}
                    {...register('year')}
                  />
                  <Input
                    label="Mileage (km)"
                    type="number"
                    error={errors.mileage?.message}
                    {...register('mileage')}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Condition</label>
                    <select
                      className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]"
                      {...register('condition')}
                    >
                      {CONDITION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Body type</label>
                    <select
                      className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]"
                      {...register('body_type')}
                    >
                      <option value="">Select</option>
                      {BODY_TYPE_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Transmission</label>
                    <select
                      className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]"
                      {...register('transmission')}
                    >
                      {TRANSMISSION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-primary mb-2">Fuel type</label>
                    <select
                      className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] min-h-[48px]"
                      {...register('fuel_type')}
                    >
                      {FUEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input label="Color (optional)" placeholder="e.g. Pearl White" {...register('color')} />
                <div className="w-full">
                  <label className="block text-sm font-medium text-primary mb-2">Description (optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the vehicle..."
                    className="w-full px-4 py-3 text-[15px] border border-[#E1E1E1] rounded-[12px] bg-white focus:outline-none focus:border-[#405FF2] resize-y"
                    {...register('description')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'price' && (
              <div className="space-y-5 max-w-md">
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-medium text-[#050B20]">R</span>
                  <Input
                    label="Price (ZAR)"
                    type="number"
                    placeholder="0"
                    error={errors.price?.message}
                    {...register('price')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-3">
                <p className="text-[15px] text-[#050B20] mb-4">
                  Select all features that apply to this vehicle.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURE_OPTIONS.map((feature) => (
                    <label
                      key={feature}
                      className="flex items-center gap-3 cursor-pointer p-3 rounded-[12px] border border-[#E1E1E1] hover:bg-[#F9FBFC]"
                    >
                      <Checkbox
                        checked={(features ?? []).includes(feature)}
                        onChange={() => toggleFeature(feature)}
                      />
                      <span className="text-[15px] text-[#050B20]">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-4">
                <p className="text-[15px] text-[#050B20]">
                  Upload up to {MAX_IMAGES} images (JPEG, PNG, or WebP). The first image will be the main listing photo.
                </p>
                <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-[#E1E1E1] rounded-2xl cursor-pointer hover:bg-[#F9FBFC] transition-colors">
                  <span className="text-[15px] text-[#405FF2] font-medium mt-2">Click to add images</span>
                  <input type="file" accept={ACCEPT_IMAGES} multiple className="hidden" onChange={onFileChange} />
                </label>
                {imageFiles.length > 0 && (
                  <ul className="flex flex-wrap gap-3">
                    {imageFiles.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#E1E1E1] border border-[#E1E1E1]">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-[#405FF2] text-white px-1.5 py-0.5 rounded">Main</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className={cn(
              'flex flex-col-reverse sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-[#E1E1E1]',
              'sticky bottom-0 bg-white -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 sm:py-0 sm:relative sm:bg-transparent sm:border-t'
            )}>
              <Button type="button" variant="outline" onClick={handleSaveDraft} loading={isSubmitting} disabled={isSubmitting}>
                Save as Draft
              </Button>
              <Button type="button" variant="primary" onClick={handlePublish} loading={isSubmitting} disabled={isSubmitting}>
                Publish
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
