'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Does Prime Deal Auto own the cars I see online or are they owned by others?',
    answer:
      'Our listings include both our own stock and selected partner vehicles. Each listing clearly indicates the source. We formalize the process so you are never dealing with unregulated sellers—you can buy with confidence.',
  },
  {
    question: 'How do you choose the cars that you sell?',
    answer:
      'We use a formalized process and strict quality standards. Every vehicle is inspected for quality and history; only cars that meet our standards are listed.',
  },
  {
    question: 'Can I save my favorite cars to a list I can view later?',
    answer:
      'Yes. Sign in to your account to save favourites and compare vehicles in one place.',
  },
  {
    question: 'Can I be notified when cars I like are added to your inventory?',
    answer:
      'We are working on alerts for saved searches. For now, check back or contact us for specific makes and models.',
  },
  {
    question: 'What tools do you have to help me find the right car for me and my budget?',
    answer:
      'Use our search and filters by price, year, make, model, and body type. You can sort by price or year to find options within your budget.',
  },
];

export function AboutFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mb-16 sm:mb-20">
      <h2 className="text-[40px] leading-[45px] font-bold text-primary mb-8 text-center">
        Frequently Asked Questions
      </h2>
      <div className="max-w-4xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-[16px] overflow-hidden transition-colors ${
                isOpen ? 'bg-bg-1' : 'bg-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full flex items-center justify-between gap-4 py-4 px-5 text-left rounded-[16px] hover:bg-bg-1/50 transition-colors min-h-[44px]"
                aria-expanded={isOpen}
              >
                <span className="text-[20px] leading-[26px] font-medium text-primary flex-1">
                  {item.question}
                </span>
                <span className="shrink-0 w-10 h-10 flex items-center justify-center text-primary">
                  {isOpen ? (
                    <Minus className="w-5 h-5" aria-hidden />
                  ) : (
                    <Plus className="w-5 h-5" aria-hidden />
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-0">
                  <p className="text-[15px] leading-[26px] text-primary">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
