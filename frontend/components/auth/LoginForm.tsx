'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn, getCurrentUser, signOut } from 'aws-amplify/auth';
import { ArrowUpRight } from 'lucide-react';
import { FormInput } from '@/components/auth/FormInput';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { isAmplifyConfigured } from '@/lib/amplify-config';

const loginSchema = z.object({
  username: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getAuthErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name: string }).name;
    const message = (err as { message?: string }).message;
    if (name === 'UserNotFoundException') return 'No account found with this email.';
    if (name === 'NotAuthorizedException') return 'Incorrect email or password.';
    if (name === 'UserNotConfirmedException') return 'Please confirm your email before signing in.';
    if (name === 'PasswordResetRequiredException') return 'A password reset is required.';
    if (typeof message === 'string') return message;
  }
  return 'Something went wrong. Please try again.';
}

export function LoginForm() {
  const router = useRouter();
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', remember: false },
  });

  // Check if user is already signed in
  useEffect(() => {
    async function checkAuth() {
      try {
        await getCurrentUser();
        // User is already signed in, redirect to dashboard
        router.push('/dashboard');
      } catch {
        // Not signed in, show login form
        setCheckingSession(false);
      }
    }
    if (isAmplifyConfigured()) {
      checkAuth();
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  const onSubmit = async (data: LoginFormValues) => {
    setAuthErr(null);
    try {
      // Sign out any existing session first
      try {
        await signOut();
      } catch {
        // Ignore signOut errors
      }
      await signIn({
        username: data.username.trim(),
        password: data.password,
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setAuthErr(getAuthErrorMessage(err));
    }
  };

  if (!isAmplifyConfigured()) {
    return (
      <div className="p-8">
        <p className="text-[16px] leading-[28px] text-[#050B20]/90">
          Sign-in is not configured. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and
          NEXT_PUBLIC_COGNITO_CLIENT_ID in your environment.
        </p>
        <Link href="/" className="mt-4 inline-block text-[#405FF2] font-medium hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="p-8 text-center">
        <p className="text-[16px] leading-[28px] text-[#050B20]/70">Checking session...</p>
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
        label="Email or Username"
        placeholder="Enter your email or username"
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />
      <PasswordInput
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex items-center justify-between gap-4">
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="remember"
              label="Remember"
              className="shrink-0"
              checked={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <Link
          href="/forgot-password"
          className="text-[15px] leading-[26px] text-[#405FF2] underline hover:no-underline"
        >
          Forgotten password?
        </Link>
      </div>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        className="min-h-[54px] rounded-[12px] gap-2"
      >
        Login
        <ArrowUpRight className="w-[14px] h-[14px] shrink-0" aria-hidden />
      </Button>
      <p className="text-[14px] leading-[24px] text-[#050B20]/80 text-center">
        Staff registration required?{' '}
        <Link href="/register" className="text-[#405FF2] font-medium hover:underline">
          Register here
        </Link>
      </p>
    </form>
  );
}
