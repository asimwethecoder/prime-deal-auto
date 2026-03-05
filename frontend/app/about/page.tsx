import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Prime Deal Auto – quality used and new vehicles in South Africa.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-1">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-6">
          About Prime Deal Auto
        </h1>
        <p className="text-[16px] leading-[28px] text-primary/90 max-w-3xl">
          Prime Deal Auto is your trusted partner for finding quality used and new vehicles in South Africa.
          We are committed to transparency, fair pricing, and helping you find the perfect car.
        </p>
      </div>
    </div>
  );
}
