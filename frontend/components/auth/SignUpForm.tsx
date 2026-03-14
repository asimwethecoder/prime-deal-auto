'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { signUp } from 'aws-amplify/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isAmplifyConfigured } from '@/lib/amplify-config';

const signUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

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

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const parsed = signUpSchema.safeParse({
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.errors.forEach((err) => {
        const path = err.path[0] as keyof typeof fieldErrors;
        if (path && err.message) fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await signUp({
        username: parsed.data.email.trim(),
        password: parsed.data.password,
        options: {
          userAttributes: {
            email: parsed.data.email.trim(),
          },
        },
      });
      const step = String(result.nextStep?.signUpStep ?? '');
      if (step === 'CONFIRM_SIGN_UP' || step === 'CONFIRM_SIGN_UP_WITH_CODE') {
        setNeedsConfirmation(true);
      } else {
        router.push('/signin');
        router.refresh();
      }
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAmplifyConfigured()) {
    return (
      <Card className="p-6 sm:p-8" padding="none">
        <p className="text-[16px] leading-[28px] text-primary/90">
          Sign-up is not configured. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and
          NEXT_PUBLIC_COGNITO_CLIENT_ID in your environment.
        </p>
        <Link href="/" className="mt-4 inline-block text-secondary font-medium hover:underline">
          Back to home
        </Link>
      </Card>
    );
  }

  if (needsConfirmation) {
    return (
      <Card className="p-6 sm:p-8" padding="none">
        <p className="text-[16px] leading-[28px] text-primary/90 mb-4">
          Check your email for a confirmation code. Once you have confirmed your account, you can
          sign in.
        </p>
        <Link
          href="/signin"
          className="inline-block bg-secondary text-white px-6 py-3 rounded-[12px] text-[15px] font-medium hover:bg-secondary/90 transition-colors"
        >
          Go to sign in
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8" padding="none">
      <form onSubmit={handleSubmit} className="space-y-5">
        {authError && (
          <div
            className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]"
            role="alert"
          >
            {authError}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          placeholder="you@example.com"
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          placeholder="At least 8 characters"
          error={errors.password}
        />
        <Input
          label="Confirm password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
          }}
          placeholder="••••••••"
          error={errors.confirmPassword}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={submitting}
          className="min-h-[48px]"
        >
          Create account
        </Button>
        <p className="text-[14px] leading-[24px] text-primary/80 text-center">
          Already have an account?{' '}
          <Link href="/signin" className="text-secondary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
