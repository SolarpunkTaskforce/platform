"use client";

import { useId, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  ariaLabel?: string;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyMessage = "No matches found",
  ariaLabel,
}: MultiSelectProps) {
  const [query, setQuery] = useState("");
  const searchInputId = useId();

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(lower));
  }, [options, query]);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(item => item !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const clearSelection = () => onChange([]);

  return (
    <div className="rounded-3xl border border-soltas-glacial/30 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        {value.length === 0 && (
          <Badge variant="outline" className="text-soltas-muted">
            Nothing selected
          </Badge>
        )}
        {value.map(selected => {
          const option = options.find(item => item.value === selected);
          if (!option) return null;
          return (
            <Badge key={selected} variant="ocean" className="flex items-center gap-2">
              {option.label}
              <button
                type="button"
                onClick={() => toggle(selected)}
                className="inline-flex items-center rounded-full p-0.5 text-soltas-ocean hover:bg-soltas-glacial/30"
                aria-label={`Remove ${option.label}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </Badge>
          );
        })}
        {value.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection} className="text-xs">
            Clear all
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <label htmlFor={searchInputId} className="sr-only">
          {ariaLabel ?? placeholder}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soltas-muted"
            aria-hidden
          />
          <Input
            id={searchInputId}
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>

        <div className="max-h-56 space-y-1 overflow-y-auto" role="listbox" aria-label={ariaLabel ?? placeholder}>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-soltas-glacial/30 px-3 py-2 text-sm text-soltas-muted">
              {emptyMessage}
            </p>
          ) : (
            filtered.map(option => {
              const selected = value.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition",
                    selected
                      ? "border-soltas-ocean/30 bg-soltas-glacial/15 text-soltas-ocean"
                      : "border-transparent hover:border-soltas-glacial/30 hover:bg-soltas-light",
                  )}
                  role="option"
                  aria-selected={selected}
                >
                  <span>{option.label}</span>
                  {selected ? <Check className="h-4 w-4 text-soltas-ocean" aria-hidden /> : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
