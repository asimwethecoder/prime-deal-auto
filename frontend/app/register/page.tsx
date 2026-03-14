import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Staff registration for Prime Deal Auto.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-primary text-white">
        <div className="max-w-[1700px] mx-auto px-[13.54%] py-8">
          <nav aria-label="Breadcrumb" className="mb-2">
            <Link
              href="/"
              className="text-[15px] leading-[26px] text-[#405FF2] hover:underline"
            >
              Home
            </Link>
            <span className="text-white/70 mx-2">/</span>
            <span className="text-[15px] leading-[26px] text-white">Register</span>
          </nav>
          <h1 className="text-[40px] leading-[45px] font-bold font-['DM_Sans',sans-serif]">
            Register
          </h1>
        </div>
        <div className="h-5 bg-white rounded-t-[80px]" aria-hidden />
      </section>

      <div className="max-w-[500px] mx-auto px-[13.54%] sm:px-8 py-12 sm:py-16 w-full">
        <div
          className="bg-white border border-[#E1E1E1] rounded-[16px] p-8 shadow-[0px_6px_24px_rgba(0,0,0,0.05)]"
          style={{ maxWidth: 448 }}
        >
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
