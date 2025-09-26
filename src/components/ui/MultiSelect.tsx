"use client";

import { useId, useMemo, useState } from "react";

export type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
};

export default function MultiSelect({ options, value, onChange, placeholder = "Search...", emptyMessage = "No results" }: MultiSelectProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(lower));
  }, [options, query]);

  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter(item => item !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
      <div className="flex flex-wrap gap-2">
        {value.map(selected => {
          const option = options.find(item => item.value === selected);
          if (!option) return null;
          return (
            <button
              key={selected}
              type="button"
              onClick={() => toggle(selected)}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              {option.label}
              <span className="rounded-full bg-emerald-200 px-1 text-[10px] uppercase tracking-wide text-emerald-800 group-hover:bg-emerald-300">
                Remove
              </span>
            </button>
          );
        })}
        {!value.length && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Nothing selected</span>}
      </div>

      <div className="mt-4">
        <label className="sr-only" htmlFor={inputId}>
          {placeholder}
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          filteredOptions.map(option => {
            const checked = value.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <span>{option.label}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
