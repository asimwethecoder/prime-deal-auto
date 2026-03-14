import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Prime Deal Auto account password.',
};

export default function ForgotPasswordPage() {
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
            <span className="text-[15px] leading-[26px] text-white">Forgot password</span>
          </nav>
          <h1 className="text-[40px] leading-[45px] font-bold font-['DM_Sans',sans-serif]">
            Forgot password
          </h1>
        </div>
        <div className="h-5 bg-white rounded-t-[80px]" aria-hidden />
      </section>

      <div className="max-w-[500px] mx-auto px-[13.54%] sm:px-8 py-12 sm:py-16 w-full">
        <div
          className="bg-white border border-[#E1E1E1] rounded-[16px] p-8 shadow-[0px_6px_24px_rgba(0,0,0,0.05)]"
          style={{ maxWidth: 448 }}
        >
          <p className="text-[16px] leading-[28px] text-[#050B20]/90 mb-6">
            To reset your password, please contact your administrator or use the link below to get
            in touch.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[#405FF2] text-white px-6 py-3 rounded-[12px] text-[15px] font-medium hover:bg-[#3651E0] transition-colors"
          >
            Contact us
          </Link>
          <p className="mt-6 text-[14px] leading-[24px] text-[#050B20]/80">
            <Link href="/login" className="text-[#405FF2] font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
