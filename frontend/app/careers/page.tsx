import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, Users, Heart, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join the Prime Deal Auto team. Explore career opportunities at one of Johannesburg\'s leading used car dealerships.',
  alternates: { canonical: '/careers' },
};

const VALUES = [
  {
    title: 'Customer First',
    description: 'Every decision we make starts with the customer. We build trust through transparency and service.',
    icon: Heart,
  },
  {
    title: 'Growth Mindset',
    description: 'We invest in our people. From sales training to tech skills, we help you grow your career.',
    icon: TrendingUp,
  },
  {
    title: 'Team Spirit',
    description: 'We win together. Our culture is built on collaboration, respect, and shared goals.',
    icon: Users,
  },
  {
    title: 'Entrepreneurial Drive',
    description: 'We move fast and think big. If you have ideas, we want to hear them.',
    icon: Briefcase,
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white rounded-t-[80px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-[15px] leading-[26px]">
            <li>
              <Link href="/" className="text-secondary hover:underline">Home</Link>
            </li>
            <li className="text-primary"> / Careers</li>
          </ol>
        </nav>
        <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-12 sm:mb-16">
          Careers
        </h1>

        {/* Intro */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 sm:mb-20">
          <h2 className="text-[40px] leading-[55px] font-bold text-primary max-w-[478px]">
            Build Your Career With Prime Deal Auto
          </h2>
          <div className="max-w-[686px]">
            <p className="text-[15px] leading-[26px] text-primary mb-4">
              Prime Deal Auto is more than a dealership — we're a team of passionate people
              who believe in making car buying simple, transparent, and enjoyable. Based at
              515 Louis Botha Avenue in Bramley, Johannesburg, we serve customers across
              Southern Africa.
            </p>
            <p className="text-[15px] leading-[26px] text-primary">
              Whether it's sales, operations, marketing, or technology, every role at Prime Deal Auto
              contributes to delivering an exceptional customer experience. We look for people who
              are driven, honest, and ready to grow with us.
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-[40px] leading-[45px] font-bold text-primary mb-10">
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <div className="w-[60px] h-[60px] rounded-[16px] bg-[#EEF1FB] border-[3px] border-secondary flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" aria-hidden />
                  </div>
                  <h3 className="text-[20px] leading-[26px] font-medium text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[15px] leading-[26px] text-primary">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* No Vacancies Notice */}
        <section className="mb-16 sm:mb-20">
          <div className="max-w-3xl mx-auto text-center bg-[#F9FBFC] rounded-[16px] border border-[#E1E1E1] p-8 sm:p-12">
            <div className="w-[60px] h-[60px] rounded-[16px] bg-[#EEF1FB] border-[3px] border-secondary flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-7 h-7 text-primary" aria-hidden />
            </div>
            <h2 className="text-[30px] leading-[45px] font-bold text-primary mb-4">
              No Open Positions Right Now
            </h2>
            <p className="text-[15px] leading-[26px] text-primary mb-6">
              We don't have any vacancies at the moment, but we're always on the lookout for
              talented individuals. If you're passionate about the automotive industry and want
              to be considered for future opportunities, send us your CV.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-secondary text-white px-8 py-4 rounded-[12px] text-[15px] leading-[26px] font-medium hover:bg-secondary/90 transition-colors"
            >
              Send Us Your CV
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
