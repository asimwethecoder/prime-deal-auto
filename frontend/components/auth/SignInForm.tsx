'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { signIn } from 'aws-amplify/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { isAmplifyConfigured } from '@/lib/amplify-config';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormState = z.infer<typeof signInSchema>;

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

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      parsed.error.errors.forEach((err) => {
        const path = err.path[0];
        if (path === 'email' && err.message) fieldErrors.email = err.message;
        if (path === 'password' && err.message) fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await signIn({
        username: parsed.data.email.trim(),
        password: parsed.data.password,
      });
      router.push('/dashboard');
      router.refresh();
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
          Sign-in is not configured. Please set NEXT_PUBLIC_COGNITO_USER_POOL_ID and
          NEXT_PUBLIC_COGNITO_CLIENT_ID in your environment.
        </p>
        <Link href="/" className="mt-4 inline-block text-secondary font-medium hover:underline">
          Back to home
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
          placeholder="••••••••"
          error={errors.password}
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
          Sign in
        </Button>
        <p className="text-[14px] leading-[24px] text-primary/80 text-center">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-secondary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </Card>
  );
}
