'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CarSelectDropdown } from '@/components/dashboard/CarSelectDropdown';

// Mock stats - replace with API when available
const MOCK_LISTINGS_COUNT = 43279;
const MOCK_MESSAGES_COUNT = 15;

const MOCK_ACTIVITIES = [
  { id: '1', text: 'Your listing Audi Q3 3.5 Sportpack has been approved', bg: 'bg-[#E9F2FF]', icon: 'car' },
  { id: '2', text: 'Ali Tufan left a message on Volvo xc40 Recharge 1.5T', bg: 'bg-[#FFE9F3]', icon: 'message' },
  { id: '3', text: 'Someone favorites your Mercedes Benz E-Series listing', bg: 'bg-[#EEF1FB]', icon: 'heart' },
  { id: '4', text: 'Someone favorites your BMW X5 25d xDrive 4x4 Premium Package', bg: 'bg-[#EEF1FB]', icon: 'heart' },
  { id: '5', text: 'Your listing Audi Q3 3.5 Sportpack has been approved', bg: 'bg-[#E9F2FF]', icon: 'car' },
  { id: '6', text: 'Ali Tufan left a message on Volvo xc40 Recharge 1.5T', bg: 'bg-[#FFE9F3]', icon: 'message' },
];

// Mock chart data: 12 months, values ~50–250
const CHART_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_VALUES = [80, 120, 95, 150, 180, 160, 180, 200, 170, 220, 190, 250];
const CHART_MAX = 300;
const CHART_HEIGHT = 220;
const CHART_WIDTH = 560;

function CarPageViewsChart() {
  const padding = { top: 10, right: 10, bottom: 28, left: 36 };
  const innerWidth = CHART_WIDTH - padding.left - padding.right;
  const innerHeight = CHART_HEIGHT - padding.top - padding.bottom;
  const points = CHART_VALUES.map((v, i) => {
    const x = padding.left + (i / (CHART_VALUES.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (v / CHART_MAX) * innerHeight;
    return { x, y, v };
  });
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[13px] text-[#050B20]">
        {[300, 250, 200, 150, 100, 50, 0].map((val) => (
          <span key={val}>{val}</span>
        ))}
      </div>
      <svg width={CHART_WIDTH} height={CHART_HEIGHT} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#E9F2FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#E9F2FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines (dashed) */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((t, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + (1 - t) * innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + (1 - t) * innerHeight}
            stroke="#D7DBDE"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="url(#chartGradient)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#405FF2" strokeWidth={3} />
        {/* Data point highlight (July = index 6) */}
        <line
          x1={points[6].x}
          y1={points[6].y}
          x2={points[6].x}
          y2={padding.top + innerHeight}
          stroke="#405FF2"
          strokeWidth={1}
          strokeDasharray="4 2"
        />
        <circle cx={points[6].x} cy={points[6].y} r={4} fill="white" stroke="#405FF2" strokeWidth={1.5} />
      </svg>
      {/* Tooltip above July point */}
      <div
        className="absolute bg-white rounded shadow-md px-2 py-1 text-[13px] font-bold text-[#405FF2] text-center"
        style={{
          left: points[6].x - 24,
          top: points[6].y - 36,
          boxShadow: '0px 0px 8px rgba(16, 30, 115, 0.12)',
        }}
      >
        180
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1 px-9 text-[13px] text-[#050B20]">
        {CHART_MONTHS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [carSelection, setCarSelection] = useState<{ make?: string; model?: string; variant?: string }>({});

  return (
    <div className="flex-1 overflow-auto bg-[#F9FBFC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Page head */}
        <div className="mb-6">
          <h1 className="text-[32px] font-bold leading-[42px] text-[#222222]">
            Dashboard
          </h1>
          <p className="text-[15px] leading-[28px] text-[#222222] mt-1">
            Lorem ipsum dolor sit amet, consectetur.
          </p>
        </div>

        {/* Stat cards - My Listings & Messages only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 mb-6">
          <div className="rounded-2xl border border-[#E1E1E1] bg-white p-5 flex items-center justify-between">
            <div>
              <p className="text-[15px] leading-[26px] text-[#050B20]">My Listings</p>
              <p className="text-[30px] font-bold leading-[45px] text-[#050B20]">
                {MOCK_LISTINGS_COUNT.toLocaleString('en-ZA')}
              </p>
            </div>
            <div className="h-[70px] w-[70px] rounded-full bg-[#E9F2FF] flex items-center justify-center shrink-0">
              <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#405FF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 17h14v-5H5v5zM5 9h14V7H5v2z" />
              </svg>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E1E1E1] bg-white p-5 flex items-center justify-between">
            <div>
              <p className="text-[15px] leading-[26px] text-[#050B20]">Messages</p>
              <p className="text-[30px] font-bold leading-[45px] text-[#050B20]">
                {MOCK_MESSAGES_COUNT}
              </p>
            </div>
            <div className="h-[70px] w-[70px] rounded-full bg-[#EEF1FB] flex items-center justify-center shrink-0">
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#405FF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Car Page Views */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E1E1E1] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-[18px] font-medium leading-[32px] text-[#050B20]">
                Car Page Views
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <CarSelectDropdown
                  value={carSelection}
                  onChange={setCarSelection}
                  aria-label="Select car"
                />
                <select
                  className="h-10 rounded-2xl border border-[#E1E1E1] bg-white px-4 text-[15px] text-[#050B20] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                  style={{ width: 140, boxShadow: '0px 10px 40px rgba(0,0,0,0.05)' }}
                  aria-label="Date range"
                >
                  <option>Date</option>
                  <option>15 days</option>
                </select>
              </div>
            </div>
            <div className="min-h-[280px]">
              <CarPageViewsChart />
            </div>
          </div>

          {/* Recent Activities */}
          <div className="rounded-2xl border border-[#E1E1E1] bg-white p-5 flex flex-col">
            <h2 className="text-[18px] font-medium leading-[32px] text-[#050B20] mb-4">
              Recent Activities
            </h2>
            <ul className="flex-1 space-y-4 min-h-0 overflow-auto">
              {MOCK_ACTIVITIES.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center ${a.bg}`}>
                    {a.icon === 'car' && (
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#405FF2" strokeWidth="2" aria-hidden>
                        <path d="M5 17h14v-5H5v5zM5 9h14V7H5v2z" />
                      </svg>
                    )}
                    {a.icon === 'message' && (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#405FF2" strokeWidth="2" aria-hidden>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                    {a.icon === 'heart' && (
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#405FF2" strokeWidth="2" aria-hidden>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[15px] leading-[20px] text-[#050B20]">{a.text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/activities"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#405FF2] bg-white py-3 px-5 text-[15px] font-medium text-[#405FF2] hover:bg-[#405FF2]/5 transition-colors"
            >
              View More
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
