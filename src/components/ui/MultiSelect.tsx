"use client";
import React from "react";

export type Option = { value: string; label: string };

export default function MultiSelect({ options, value, onChange }: { options: Option[]; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(v: string) {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={value.includes(opt.value)} onChange={() => toggle(opt.value)} />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
