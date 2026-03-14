import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, DollarSign, ShieldCheck, Tag, Wrench } from 'lucide-react';
import { AboutFaq } from '@/components/about/AboutFaq';
import { AboutGallery } from '@/components/about/AboutGallery';
import { AboutBrandsCarousel } from '@/components/about/AboutBrandsCarousel';
import { AboutStats } from '@/components/about/AboutStats';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Prime Deal Auto – quality pre-owned vehicles from our Bramley, Johannesburg base. Transparency, affordability, and exceptional service across Southern Africa.',
};

const WHY_CHOOSE_ITEMS = [
  {
    title: 'Special Financing Offers',
    description:
      'Our stress-free finance department can find financial solutions to save you money.',
    icon: DollarSign,
  },
  {
    title: 'Trusted Car Dealership',
    description:
      'We partner with established automotive platforms and stand behind every vehicle with transparent history and quality checks.',
    icon: ShieldCheck,
  },
  {
    title: 'Transparent Pricing',
    description:
      'No hidden fees. We believe in affordability and clear pricing—a direct response to the skepticism that defines the used car market.',
    icon: Tag,
  },
  {
    title: 'Expert Car Service',
    description:
      'From advice to after-sale support, we are here to help you drive with confidence.',
    icon: Wrench,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white rounded-t-[80px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-[15px] leading-[26px]">
            <li>
              <Link href="/" className="text-secondary hover:underline">
                Home
              </Link>
            </li>
            <li className="text-primary"> / About Us</li>
          </ol>
        </nav>
        <h1 className="text-[40px] leading-[45px] font-bold text-primary mb-12 sm:mb-16">
          About Us
        </h1>

        {/* Section A – Brand Value and Introduction */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 sm:mb-20">
          <h2 className="text-[40px] leading-[55px] font-bold text-primary max-w-[478px]">
            We Value Our Clients And Want Them To Have A Nice Experience
          </h2>
          <div className="max-w-[686px]">
            <p className="text-[15px] leading-[26px] text-primary mb-4">
              Prime Deal Auto is a specialized dealership focused on the procurement and distribution
              of top-tier pre-owned vehicles. Our headquarters at 515 Louis Botha Avenue, Bramley,
              Johannesburg, places us at the heart of South Africa’s most active automotive corridor.
              We are a trusted source for a diverse range—from entry-level city cars to heavy-duty
              commercial bakkies—serving a footprint that encompasses Southern Africa.
            </p>
            <p className="text-[15px] leading-[26px] text-primary">
              Our identity is built on three pillars: transparency, affordability, and exceptional
              customer service. We formalize the buying process so you can buy with confidence,
              without the uncertainty that often comes with the used car market. Every listing is
              carefully selected and we are here to help you find the right match.
            </p>
          </div>
        </section>

        {/* Section B – Masonry About Gallery */}
        <AboutGallery />

        {/* Section C – Why Choose Us? */}
        <section className="mb-16 sm:mb-20">
          <h2 className="text-[40px] leading-[45px] font-bold text-primary mb-10">
            Why Choose Us?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_CHOOSE_ITEMS.map((item) => {
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

        {/* Statistics */}
        <AboutStats />

        {/* Explore Our Premium Brands */}
        <section className="mb-16 sm:mb-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-[40px] leading-[45px] font-bold text-primary">
              Explore Our Premium Brands
            </h2>
            <Link
              href="/cars"
              className="flex items-center gap-2 text-[15px] leading-[26px] font-medium text-primary hover:text-secondary transition-colors shrink-0"
            >
              Show All Brands
              <ArrowUpRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
          <AboutBrandsCarousel />
        </section>

        {/* FAQ */}
        <AboutFaq />
      </div>
    </div>
  );
}
