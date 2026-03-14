'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp } from 'aws-amplify/auth';
import { ArrowUpRight } from 'lucide-react';
import { FormInput } from '@/components/auth/FormInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { isAmplifyConfigured } from '@/lib/amplify-config';

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(100),
    staffIdEmail: z.string().min(1, 'Staff ID/Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptPrivacy: z.literal(true, { errorMap: () => ({ message: 'You must accept the privacy policy' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    const message = (err as { message?: string }).message;
    if (name === 'UsernameExistsException') return 'An account with this email already exists.';
    if (name === 'InvalidPasswordException') return 'Password does not meet requirements.';
    if (typeof message === 'string') return message;
  }
  return 'Something went wrong. Please try again.';
}

export function RegisterForm() {
  const router = useRouter();
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      staffIdEmail: '',
      password: '',
      confirmPassword: '',
      acceptPrivacy: false as unknown as true, // Type workaround: z.literal(true) requires true, but default must be false
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setAuthErr(null);
    try {
      const result = await signUp({
        username: data.staffIdEmail.trim(),
        password: data.password,
        options: {
          userAttributes: {
            email: data.staffIdEmail.trim(),
            name: data.fullName.trim(),
          },
        },
      });
      const step = String(result.nextStep?.signUpStep ?? '');
      if (step === 'CONFIRM_SIGN_UP' || step === 'CONFIRM_SIGN_UP_WITH_CODE') {
        setNeedsConfirmation(true);
      } else {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      setAuthErr(getAuthErrorMessage(err));
    }
  };

  if (!isAmplifyConfigured()) {
    return (
      <div className="p-8">
        <p className="text-[16px] leading-[28px] text-[#050B20]/90">
          Registration is not configured. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and
          NEXT_PUBLIC_COGNITO_CLIENT_ID in your environment.
        </p>
        <Link href="/" className="mt-4 inline-block text-[#405FF2] font-medium hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (needsConfirmation) {
    return (
      <div className="p-8">
        <p className="text-[16px] leading-[28px] text-[#050B20]/90 mb-4">
          Check your email for a confirmation code. Once you have confirmed your account, you can
          sign in.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#405FF2] text-white px-6 py-3 rounded-[12px] text-[15px] font-medium hover:bg-[#3651E0] transition-colors"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {authErr && (
        <div
          className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[13px]"
          role="alert"
        >
          {authErr}
        </div>
      )}
      <FormInput
        label="Full Name"
        placeholder="Your full name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <FormInput
        label="Staff ID/Email"
        type="email"
        placeholder="staff@example.com"
        autoComplete="email"
        error={errors.staffIdEmail?.message}
        {...register('staffIdEmail')}
      />
      <PasswordInput
        label="Password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordInput
        label="Confirm Password"
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="acceptPrivacy"
          className="h-5 w-5 rounded-[4px] border-2 border-[#E1E1E1] bg-white checked:bg-[#405FF2] checked:border-[#405FF2] focus:ring-2 focus:ring-[#405FF2] focus:ring-offset-2 mt-0.5"
          {...register('acceptPrivacy')}
        />
        <label htmlFor="acceptPrivacy" className="text-[15px] leading-[26px] text-[#050B20] cursor-pointer">
          I accept the{' '}
          <Link href="/privacy" className="text-[#405FF2] underline hover:no-underline">
            privacy policy
          </Link>
        </label>
      </div>
      {errors.acceptPrivacy?.message && (
        <p className="text-[13px] text-red-600" role="alert">
          {errors.acceptPrivacy.message}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        className="min-h-[54px] rounded-[12px] gap-2"
      >
        Register
        <ArrowUpRight className="w-[14px] h-[14px] shrink-0" aria-hidden />
      </Button>
      <p className="text-[14px] leading-[24px] text-[#050B20]/80 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-[#405FF2] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
