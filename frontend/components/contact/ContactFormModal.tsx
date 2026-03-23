'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { createLead } from '@/lib/api/leads';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

// SVG Icon components
const CalendarIcon = () => (
  <Image src="/icons/calendar-svgrepo-com.svg" alt="" width={20} height={20} />
);

const MailIcon = () => (
  <Image src="/icons/email-1573-svgrepo-com.svg" alt="" width={20} height={20} />
);

const CloseIcon = () => (
  <Image src="/icons/close-square-svgrepo-com.svg" alt="" width={20} height={20} />
);

interface CarInfo {
  id: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
}

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  car?: CarInfo;
  formType: 'enquiry' | 'test_drive';
}

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  surname: z.string().min(1, 'Surname is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(50),
  whatsAppNumber: z.string().min(1, 'WhatsApp number is required').max(50),
  preferredDate: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(2000),
});

type ContactFormValues = z.infer<typeof contactSchema>;


function generateSubject(car: CarInfo | undefined, formType: 'enquiry' | 'test_drive'): string {
  if (!car) return '';
  const carName = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ''}`;
  return formType === 'test_drive' ? `Test Drive Request: ${carName}` : carName;
}

function generateMessage(car: CarInfo | undefined): string {
  if (!car) return '';
  return `Hi, I'm interested in the ${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ''} listed at ${formatPrice(car.price)}. Please contact me with more information.`;
}

export function ContactFormModal({ isOpen, onClose, car, formType }: ContactFormModalProps) {
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      email: '',
      phone: '',
      whatsAppNumber: '',
      preferredDate: '',
      message: generateMessage(car),
    },
  });

  const phone = watch('phone');
  const whatsAppNumber = watch('whatsAppNumber');

  // Reset form when modal opens with new car
  useEffect(() => {
    if (isOpen) {
      reset({
        firstName: '',
        surname: '',
        email: '',
        phone: '',
        whatsAppNumber: '',
        preferredDate: '',
        message: generateMessage(car),
      });
      setSuccess(false);
      setSubmitError(null);
    }
  }, [isOpen, car, reset]);

  const onSubmit = async (data: ContactFormValues) => {
    setSubmitError(null);
    try {
      await createLead({
        firstName: data.firstName.trim(),
        lastName: data.surname.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || undefined,
        whatsAppNumber: data.whatsAppNumber?.trim() || undefined,
        subject: generateSubject(car, formType),
        enquiry: data.message.trim(),
        carId: car?.id,
        enquiryType: formType === 'test_drive' ? 'test_drive' : 'car_enquiry',
        source: 'vdp',
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(message);
    }
  };

  const title = formType === 'test_drive' ? 'Schedule Test Drive' : 'Message Dealer';
  const Icon = formType === 'test_drive' ? CalendarIcon : MailIcon;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F2FF]">
                  <Icon />
                </div>
                <DialogTitle className="text-[20px] leading-[30px] font-medium text-primary">
                  {title}
                </DialogTitle>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-gray-100 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {car && (
              <div className="mb-6 p-4 rounded-xl bg-[#F9FBFC] border border-[#E1E1E1]">
                <p className="text-[15px] leading-[26px] font-medium text-primary">
                  {car.year} {car.make} {car.model} {car.variant}
                </p>
                <p className="text-[18px] leading-[32px] font-bold text-third">
                  {formatPrice(car.price)}
                </p>
              </div>
            )}


            {success ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9F2FF]">
                  <Icon />
                </div>
                <p className="text-[18px] leading-[32px] font-medium text-primary mb-2">
                  {formType === 'test_drive' ? 'Test Drive Requested!' : 'Message Sent!'}
                </p>
                <p className="text-[15px] leading-[26px] text-primary/80">
                  We'll get back to you as soon as possible.
                </p>
                <Button variant="primary" className="mt-6" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[14px]">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="John" error={errors.firstName?.message} {...register('firstName')} />
                  <Input label="Surname" placeholder="Doe" error={errors.surname?.message} {...register('surname')} />
                </div>
                <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
                <div>
                  <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">Cell Number</label>
                  <PhoneInput
                    international
                    defaultCountry="ZA"
                    value={phone}
                    onChange={(v: string | undefined) => setValue('phone', v || '', { shouldValidate: true })}
                    className={cn(
                      'flex rounded-[12px] border border-[#E1E1E1] bg-white overflow-hidden',
                      'focus-within:border-[#405FF2] transition-colors',
                      errors.phone && 'border-red-500'
                    )}
                    numberInputProps={{ className: 'w-full px-4 py-3 text-[15px] text-primary placeholder:text-gray-500 min-h-[48px] outline-none' }}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">WhatsApp Number</label>
                  <PhoneInput
                    international
                    defaultCountry="ZA"
                    value={whatsAppNumber}
                    onChange={(v: string | undefined) => setValue('whatsAppNumber', v || '', { shouldValidate: true })}
                    className={cn(
                      'flex rounded-[12px] border border-[#E1E1E1] bg-white overflow-hidden',
                      'focus-within:border-[#405FF2] transition-colors',
                      errors.whatsAppNumber && 'border-red-500'
                    )}
                    numberInputProps={{ className: 'w-full px-4 py-3 text-[15px] text-primary placeholder:text-gray-500 min-h-[48px] outline-none' }}
                  />
                  {errors.whatsAppNumber && <p className="mt-1 text-sm text-red-600">{errors.whatsAppNumber.message}</p>}
                </div>
                {formType === 'test_drive' && (
                  <Input label="Preferred Date" type="date" {...register('preferredDate')} />
                )}
                <div>
                  <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">Message</label>
                  <textarea
                    rows={4}
                    className={cn(
                      'w-full px-4 py-3 text-[15px] resize-y min-h-[100px]',
                      'border border-[#E1E1E1] rounded-[12px] bg-white text-primary',
                      'focus:outline-none focus:border-[#405FF2] transition-colors',
                      errors.message && 'border-red-500'
                    )}
                    {...register('message')}
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
                </div>
                <Button type="submit" variant="primary" fullWidth loading={isSubmitting} disabled={isSubmitting} className="min-h-[54px]">
                  {formType === 'test_drive' ? 'Request Test Drive' : 'Send Message'}
                </Button>
              </form>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
