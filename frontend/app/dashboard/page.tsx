'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Eye, Car, Download, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api/client';

interface AnalyticsStats {
  totalPageViews: number;
  totalCarViews: number;
  totalPwaInstalls: number;
  topCars: { car_id: string; make: string; model: string; year: number; views: number; primary_image_url?: string }[];
  regionBreakdown: { country: string; city: string; count: number }[];
  viewsByDay: { date: string; views: number }[];
}

function useAnalyticsStats(days: number) {
  return useQuery<AnalyticsStats>({
    queryKey: ['analytics-stats', days],
    queryFn: () => get<AnalyticsStats>('/admin/analytics/stats', { days }),
    refetchInterval: 60_000,
  });
}

// ─── Chart ───────────────────────────────────────────────────────────────────

const CHART_HEIGHT = 220;
const CHART_WIDTH = 560;

function ViewsChart({ data }: { data: { date: string; views: number }[] }) {
  if (!data.length) {
    return <p className="text-[15px] text-[#818181] py-10 text-center">No view data yet</p>;
  }

  const padding = { top: 10, right: 10, bottom: 28, left: 36 };
  const innerWidth = CHART_WIDTH - padding.left - padding.right;
  const innerHeight = CHART_HEIGHT - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map((d) => d.views), 1);
  const ceilMax = Math.ceil(maxVal / 10) * 10 || 10;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - (d.views / ceilMax) * innerHeight;
    return { x, y, v: d.views, label: new Date(d.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  // Show ~6 evenly spaced x-axis labels
  const step = Math.max(1, Math.floor(points.length / 6));
  const ySteps = 5;

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[13px] text-[#050B20]">
        {Array.from({ length: ySteps + 1 }, (_, i) => (
          <span key={i}>{Math.round(ceilMax - (ceilMax / ySteps) * i)}</span>
        ))}
      </div>
      <svg width={CHART_WIDTH} height={CHART_HEIGHT} className="overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#E9F2FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#E9F2FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: ySteps }, (_, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + ((i + 1) / (ySteps + 1)) * innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + ((i + 1) / (ySteps + 1)) * innerHeight}
            stroke="#D7DBDE"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        ))}
        <path d={areaD} fill="url(#chartGradient)" />
        <path d={pathD} fill="none" stroke="#405FF2" strokeWidth={3} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="white" stroke="#405FF2" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-9 text-[13px] text-[#050B20]">
        {points.filter((_, i) => i % step === 0 || i === points.length - 1).map((p, i) => (
          <span key={i}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data: stats, isLoading } = useAnalyticsStats(days);

  return (
    <div className="flex-1 overflow-auto bg-[#F9FBFC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Page head */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold leading-[42px] text-[#222222]">Dashboard</h1>
            <p className="text-[15px] leading-[28px] text-[#222222] mt-1">Analytics overview</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-10 rounded-2xl border border-[#E1E1E1] bg-white px-4 text-[15px] text-[#050B20] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
            aria-label="Date range"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <StatCard icon={<Eye className="h-6 w-6 text-[#405FF2]" />} label="Car Views" value={stats?.totalCarViews} loading={isLoading} bg="bg-[#E9F2FF]" />
          <StatCard icon={<Car className="h-6 w-6 text-[#405FF2]" />} label="Page Views" value={stats?.totalPageViews} loading={isLoading} bg="bg-[#EEF1FB]" />
          <StatCard icon={<Download className="h-6 w-6 text-[#405FF2]" />} label="PWA Installs" value={stats?.totalPwaInstalls} loading={isLoading} bg="bg-[#FFE9F3]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Views chart */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E1E1E1] bg-white p-5">
            <h2 className="text-[18px] font-medium leading-[32px] text-[#050B20] mb-4">Daily Views</h2>
            <div className="min-h-[280px]">
              {isLoading ? <Skeleton h="220px" /> : <ViewsChart data={stats?.viewsByDay ?? []} />}
            </div>
          </div>

          {/* Region breakdown */}
          <div className="rounded-2xl border border-[#E1E1E1] bg-white p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-[#405FF2]" />
              <h2 className="text-[18px] font-medium leading-[32px] text-[#050B20]">Visitor Regions</h2>
            </div>
            {isLoading ? (
              <Skeleton h="200px" />
            ) : !stats?.regionBreakdown?.length ? (
              <p className="text-[15px] text-[#818181] py-6 text-center flex-1">No region data yet</p>
            ) : (
              <ul className="flex-1 space-y-3 min-h-0 overflow-auto">
                {stats.regionBreakdown.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="text-[15px] text-[#050B20]">
                      {r.city !== 'Unknown' ? `${r.city}, ` : ''}{r.country}
                    </span>
                    <span className="text-[15px] font-medium text-[#405FF2]">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Top viewed cars */}
        <div className="mt-6 rounded-2xl border border-[#E1E1E1] bg-white p-5">
          <h2 className="text-[18px] font-medium leading-[32px] text-[#050B20] mb-4">Most Viewed Cars</h2>
          {isLoading ? (
            <Skeleton h="120px" />
          ) : !stats?.topCars?.length ? (
            <p className="text-[15px] text-[#818181] py-6 text-center">No car view data yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.topCars.map((car) => (
                <Link
                  key={car.car_id}
                  href={`/cars/${car.car_id}`}
                  className="group rounded-xl border border-[#E1E1E1] overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-[#F0F0F0] relative">
                    {car.primary_image_url ? (
                      <img src={car.primary_image_url} alt={`${car.year} ${car.make} ${car.model}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#818181]">
                        <Car className="h-8 w-8" />
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-0.5 text-[12px] font-medium text-[#405FF2] flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {car.views}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[14px] font-medium text-[#050B20] truncate group-hover:text-[#405FF2] transition-colors">
                      {car.year} {car.make} {car.model}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, loading, bg }: { icon: React.ReactNode; label: string; value?: number; loading: boolean; bg: string }) {
  return (
    <div className="rounded-2xl border border-[#E1E1E1] bg-white p-5 flex items-center justify-between">
      <div>
        <p className="text-[15px] leading-[26px] text-[#050B20]">{label}</p>
        <p className="text-[30px] font-bold leading-[45px] text-[#050B20]">
          {loading ? '—' : (value ?? 0).toLocaleString('en-ZA')}
        </p>
      </div>
      <div className={`h-[70px] w-[70px] rounded-full ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
    </div>
  );
}

function Skeleton({ h }: { h: string }) {
  return <div className="animate-pulse rounded-xl bg-[#F0F0F0]" style={{ height: h }} />;
}
