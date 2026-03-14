'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { ArrowUpRight } from 'lucide-react';
import { createLead } from '@/lib/api/leads';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  surname: z.string().min(1, 'Surname is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address').max(255),
  cellNumber: z.string().max(50).optional(),
  whatsAppNumber: z.string().max(50).optional(),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const DEFAULT_COUNTRY = 'ZA';

export function ContactForm() {
  const [defaultCountry, setDefaultCountry] = useState<typeof DEFAULT_COUNTRY>(DEFAULT_COUNTRY);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data?.country_code && typeof data.country_code === 'string') {
          setDefaultCountry(data.country_code.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      surname: '',
      email: '',
      cellNumber: '',
      whatsAppNumber: '',
      subject: '',
      message: '',
    },
  });

  const cellNumber = watch('cellNumber');
  const whatsAppNumber = watch('whatsAppNumber');

  const onSubmit = async (data: ContactFormValues) => {
    setSubmitError(null);
    try {
      await createLead({
        firstName: data.firstName.trim(),
        lastName: data.surname.trim(),
        email: data.email.trim(),
        phone: data.cellNumber?.trim() || undefined,
        whatsAppNumber: data.whatsAppNumber?.trim() || undefined,
        subject: data.subject.trim(),
        enquiry: data.message.trim(),
      });
      setSuccess(true);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as Error).message)
          : 'Something went wrong. Please try again.';
      setSubmitError(message);
    }
  };

  if (success) {
    return (
      <Card className="p-8 text-center" padding="lg">
        <p className="text-[18px] leading-[32px] font-medium text-primary mb-2">
          Thank you for getting in touch
        </p>
        <p className="text-[16px] leading-[28px] text-primary/90">
          We have received your enquiry and will get back to you as soon as we can.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8" padding="none">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {submitError && (
          <div
            className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]"
            role="alert"
          >
            {submitError}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input
            label="First Name"
            placeholder="Your first name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Surname"
            placeholder="Your surname"
            error={errors.surname?.message}
            {...register('surname')}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="w-full">
          <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">
            Cell Number
          </label>
          <PhoneInput
            international
            defaultCountry={defaultCountry as any}
            value={cellNumber}
            onChange={(v: string | undefined) => setValue('cellNumber', v || '')}
            className={cn(
              'flex rounded-[12px] border border-[#E1E1E1] bg-white overflow-hidden',
              'focus-within:border-[#405FF2] transition-colors duration-200',
              errors.cellNumber && 'border-red-500'
            )}
            numberInputProps={{
              className: 'w-full px-4 py-3 text-[15px] text-primary placeholder:text-gray-500 min-h-[48px] outline-none',
            }}
          />
          {errors.cellNumber && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.cellNumber.message}
            </p>
          )}
        </div>
        <div className="w-full">
          <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">
            WhatsApp Number
          </label>
          <PhoneInput
            international
            defaultCountry={defaultCountry as any}
            value={whatsAppNumber}
            onChange={(v: string | undefined) => setValue('whatsAppNumber', v || '')}
            className={cn(
              'flex rounded-[12px] border border-[#E1E1E1] bg-white overflow-hidden',
              'focus-within:border-[#405FF2] transition-colors duration-200',
              errors.whatsAppNumber && 'border-red-500'
            )}
            numberInputProps={{
              className: 'w-full px-4 py-3 text-[15px] text-primary placeholder:text-gray-500 min-h-[48px] outline-none',
            }}
          />
          {errors.whatsAppNumber && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.whatsAppNumber.message}
            </p>
          )}
        </div>
        <Input
          label="Subject"
          placeholder="What is this regarding?"
          error={errors.subject?.message}
          {...register('subject')}
        />
        <div className="w-full">
          <label className="block text-[13px] leading-[17px] text-[#818181] mb-2">
            Message
          </label>
          <textarea
            rows={5}
            placeholder="How can we help?"
            className={cn(
              'w-full px-4 py-3 text-[15px] font-normal resize-y min-h-[120px]',
              'border border-[#E1E1E1] rounded-[12px]',
              'bg-white text-primary placeholder:text-gray-500',
              'focus:outline-none focus:ring-0 focus:border-[#405FF2] transition-colors duration-200',
              'disabled:bg-gray-50 disabled:text-gray-400',
              errors.message && 'border-red-500 focus:border-red-500'
            )}
            {...register('message')}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {errors.message.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
          className="min-h-[54px] rounded-[12px] px-6 py-[18px] gap-2"
        >
          Send Message
          <ArrowUpRight className="w-[14px] h-[14px] shrink-0" aria-hidden />
        </Button>
      </form>
    </Card>
  );
}
