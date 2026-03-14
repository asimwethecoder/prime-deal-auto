'use client';

import { useEffect, useRef, useState } from 'react';
import CountUp from 'react-countup';

const STATS = [
  { end: 300, suffix: '+', label: 'VEHICLES IN STOCK', static: false },
  { end: 1200, suffix: '+', label: 'HAPPY CUSTOMERS', static: false },
  { end: 15, suffix: '+', label: 'YEARS OF EXCELLENCE', static: false },
  { staticValue: '10–20', label: 'CERTIFIED TECHNICIANS', static: true },
] as const;

const DURATION = 2.5;

export function AboutStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !hasBeenInView) {
          setHasBeenInView(true);
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasBeenInView]);

  return (
    <section ref={sectionRef} className="mb-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-[38px] leading-[49px] font-bold text-primary">
              {stat.static ? (
                stat.staticValue
              ) : hasBeenInView ? (
                <CountUp
                  start={0}
                  end={stat.end}
                  duration={DURATION}
                  suffix={stat.suffix}
                  enableScrollSpy={false}
                />
              ) : (
                `0${stat.suffix}`
              )}
            </p>
            <p className="text-[15px] leading-[28px] text-primary mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="h-px bg-[#E1E1E1] w-full mt-10" aria-hidden />
    </section>
  );
}
