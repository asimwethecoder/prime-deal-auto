'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getSearchFacets,
  getModelsForMake,
  getVariantsForModel,
} from '@/lib/api/search';

const DROPDOWN_STYLE = {
  width: 231,
  borderRadius: 24,
  boxShadow: '0px 10px 40px rgba(0,0,0,0.05)',
};

interface CarSelectDropdownProps {
  value?: { make?: string; model?: string; variant?: string };
  onChange?: (value: { make?: string; model?: string; variant?: string }) => void;
  className?: string;
  'aria-label'?: string;
}

export function CarSelectDropdown({
  value = {},
  onChange,
  className = '',
  'aria-label': ariaLabel = 'Select car',
}: CarSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [make, setMake] = useState(value.make ?? '');
  const [model, setModel] = useState(value.model ?? '');
  const [variant, setVariant] = useState(value.variant ?? '');

  const { data: facets } = useQuery({
    queryKey: ['search-facets'],
    queryFn: () => getSearchFacets(),
  });

  const { data: models } = useQuery({
    queryKey: ['models', make],
    queryFn: () => getModelsForMake(make),
    enabled: !!make,
  });

  const { data: variants } = useQuery({
    queryKey: ['variants', make, model],
    queryFn: () => getVariantsForModel(make, model),
    enabled: !!make && !!model,
  });

  const makes = facets?.make ?? [];
  const modelOptions = models ?? [];
  const variantOptions = variants ?? [];

  const displayLabel =
    variant
      ? `${make} ${model} ${variant}`
      : model
        ? `${make} ${model}`
        : make
          ? make
          : 'Select Cars';

  const handleMakeChange = (v: string) => {
    setMake(v);
    setModel('');
    setVariant('');
    onChange?.({ make: v || undefined });
  };

  const handleModelChange = (v: string) => {
    setModel(v);
    setVariant('');
    onChange?.({ make: make || undefined, model: v || undefined });
  };

  const handleVariantChange = (v: string) => {
    setVariant(v);
    onChange?.({ make: make || undefined, model: model || undefined, variant: v || undefined });
    setOpen(false);
  };

  return (
    <div className="relative" style={{ width: DROPDOWN_STYLE.width }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between gap-2 h-10 rounded-3xl border border-[#E1E1E1] bg-white px-4 text-[15px]
          text-[#050B20] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30 ${className}
        `}
        style={{ boxShadow: DROPDOWN_STYLE.boxShadow }}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={displayLabel === 'Select Cars' ? 'text-[#818181]' : ''}>
          {displayLabel}
        </span>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M2 4L5 7L8 4" stroke="#050B20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute top-full left-0 mt-1 z-20 rounded-2xl border border-[#E1E1E1] bg-white py-2 shadow-lg min-w-[231px] max-h-[320px] overflow-auto"
            style={{ boxShadow: DROPDOWN_STYLE.boxShadow }}
            role="listbox"
          >
            {/* Make */}
            <div className="px-3 py-1">
              <p className="text-[11px] font-medium text-[#818181] uppercase tracking-wide mb-1">Make</p>
              <select
                className="w-full rounded-xl border border-[#E1E1E1] bg-white px-3 py-2 text-[15px] text-[#050B20] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                value={make}
                onChange={(e) => handleMakeChange(e.target.value)}
                aria-label="Make"
              >
                <option value="">Select make</option>
                {makes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.value} ({m.count})
                  </option>
                ))}
              </select>
            </div>
            {/* Model */}
            {make && (
              <div className="px-3 py-1">
                <p className="text-[11px] font-medium text-[#818181] uppercase tracking-wide mb-1">Model</p>
                <select
                  className="w-full rounded-xl border border-[#E1E1E1] bg-white px-3 py-2 text-[15px] text-[#050B20] focus:outline-none focus:ring-2 focus:ring-[#405FF2]/30"
                  value={model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  aria-label="Model"
                >
                  <option value="">Select model</option>
                  {modelOptions.map((m) => (
                    <option key={m.text} value={m.text}>
                      {m.text} ({m.count})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Variant */}
            {make && model && (
              <div className="px-3 py-1">
                <p className="text-[11px] font-medium text-[#818181] uppercase tracking-wide mb-1">Variant</p>
                <div className="max-h-40 overflow-auto">
                  {variantOptions.length === 0 ? (
                    <p className="px-3 py-2 text-[15px] text-[#818181]">No variants</p>
                  ) : (
                    variantOptions.map((v) => (
                      <button
                        key={v.text}
                        type="button"
                        onClick={() => handleVariantChange(v.text)}
                        className={`w-full text-left px-3 py-2 text-[15px] rounded-lg hover:bg-[#E9F2FF] ${variant === v.text ? 'bg-[#E9F2FF] text-[#405FF2]' : 'text-[#050B20]'}`}
                        role="option"
                        aria-selected={variant === v.text}
                      >
                        {v.text} ({v.count})
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
