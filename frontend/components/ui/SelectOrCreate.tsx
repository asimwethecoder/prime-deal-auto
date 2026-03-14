'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption {
  id: string;
  name: string;
}

interface SelectOrCreateProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  onCreateNew: (name: string) => Promise<SelectOption>;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
}

export function SelectOrCreate({
  label,
  placeholder = 'Search or type to add...',
  options,
  value,
  onChange,
  onCreateNew,
  disabled = false,
  isLoading = false,
  error,
}: SelectOrCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches any existing option exactly
  const exactMatch = options.some(
    (opt) => opt.name.toLowerCase() === search.toLowerCase()
  );

  // Show "Add" option if search has text and no exact match
  const showAddOption = search.trim().length > 0 && !exactMatch;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search to selected value name when closing
        if (value) {
          setSearch(value.name);
        } else {
          setSearch('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Update search when value changes externally
  useEffect(() => {
    if (value) {
      setSearch(value.name);
    } else {
      setSearch('');
    }
  }, [value]);

  const handleSelect = useCallback((option: SelectOption) => {
    onChange(option);
    setSearch(option.name);
    setIsOpen(false);
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    if (!search.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      const newOption = await onCreateNew(search.trim());
      onChange(newOption);
      setSearch(newOption.name);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setIsCreating(false);
    }
  }, [search, isCreating, onCreateNew, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
    // Clear selection if user is typing something different
    if (value && e.target.value.toLowerCase() !== value.name.toLowerCase()) {
      onChange(null);
    }
  }, [isOpen, value, onChange]);

  const handleInputFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      // Select all text on focus for easy replacement
      inputRef.current?.select();
    }
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showAddOption) {
        handleCreate();
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      if (value) {
        setSearch(value.name);
      }
    }
  }, [showAddOption, handleCreate, filteredOptions, handleSelect, value]);

  return (
    <div className="w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-primary mb-2">{label}</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={cn(
            'w-full px-4 py-3 text-[15px] border rounded-[12px] bg-white',
            'focus:outline-none focus:border-[#405FF2] min-h-[48px]',
            'disabled:bg-[#F9FBFC] disabled:text-[#818181] disabled:cursor-not-allowed',
            error ? 'border-red-500' : 'border-[#E1E1E1]'
          )}
        />
        
        {/* Dropdown arrow / loading indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading || isCreating ? (
            <svg className="animate-spin h-5 w-5 text-[#405FF2]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className={cn('h-5 w-5 text-[#818181] transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-[#E1E1E1] rounded-[12px] shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length === 0 && !showAddOption && (
              <div className="px-4 py-3 text-[15px] text-[#818181]">
                {isLoading ? 'Loading...' : 'No options found'}
              </div>
            )}
            
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full px-4 py-3 text-left text-[15px] hover:bg-[#E9F2FF] transition-colors',
                  value?.id === option.id && 'bg-[#E9F2FF] text-[#405FF2] font-medium'
                )}
              >
                {option.name}
              </button>
            ))}
            
            {showAddOption && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full px-4 py-3 text-left text-[15px] text-[#405FF2] font-medium hover:bg-[#E9F2FF] transition-colors border-t border-[#E1E1E1] flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add "{search.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
