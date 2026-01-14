"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import MultiSelect from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FILTER_KEYS = [
  "q",
  "sdgs",
  "global_challenges",
  "demographics",
  "country",
  "region",
  "urgency_min",
  "urgency_max",
  "date_from",
  "date_to",
  "sort",
  "dir",
  "page",
  "view",
] as const;

const getParamValue = (searchParams: URLSearchParams, key: string) => searchParams.get(key) ?? "";

const parseListParam = (value: string | null) =>
  value ? value.split(",").map(item => item.trim()).filter(Boolean) : [];

type Option = { value: string; label: string };

type WatchdogFiltersProps = {
  options: {
    countries: Option[];
    regions: Option[];
    demographics: Option[];
    sdgs: Option[];
    globalChallenges: Option[];
  };
  basePath?: string;
  showSorting?: boolean;
  variant?: "panel" | "inline";
};

export default function WatchdogFilters({
  options,
  basePath = "/watchdog",
  showSorting = true,
  variant = "panel",
}: WatchdogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.set("page", "1");
      const query = params.toString();
      router.push(query ? `${basePath}?${query}` : basePath);
    },
    [basePath, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach(key => params.delete(key));
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }, [basePath, router, searchParams]);

  const qValue = getParamValue(searchParams, "q");
  const sdgsValue = parseListParam(searchParams.get("sdgs"));
  const challengesValue = parseListParam(searchParams.get("global_challenges"));
  const demographicValue = parseListParam(searchParams.get("demographics"));
  const countryValue = parseListParam(searchParams.get("country"));
  const regionValue = parseListParam(searchParams.get("region"));
  const urgencyMinValue = getParamValue(searchParams, "urgency_min");
  const urgencyMaxValue = getParamValue(searchParams, "urgency_max");
  const dateFromValue = getParamValue(searchParams, "date_from");
  const dateToValue = getParamValue(searchParams, "date_to");
  const sortValue = getParamValue(searchParams, "sort") || "created_at";
  const dirValue = getParamValue(searchParams, "dir") || "desc";

  const [searchValue, setSearchValue] = useState(qValue);

  useEffect(() => {
    setSearchValue(qValue);
  }, [qValue]);

  useEffect(() => {
    if (searchValue === qValue) return;
    const timeout = setTimeout(() => {
      updateParams({ q: searchValue });
    }, 400);

    return () => clearTimeout(timeout);
  }, [qValue, searchValue, updateParams]);

  const updateListParam = (key: string, values: string[]) => {
    updateParams({ [key]: values.length ? values.join(",") : "" });
  };

  const selectedSort = useMemo(() => `${sortValue}.${dirValue}`, [dirValue, sortValue]);

  const containerClassName =
    variant === "panel"
      ? "space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      : "space-y-4";

  return (
    <section className={containerClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <p className="text-sm text-slate-500">
            Filter Watchdog reports by topic, demographics, and location.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Search</span>
          <Input
            value={searchValue}
            placeholder="Title or description"
            onChange={event => setSearchValue(event.target.value)}
          />
        </label>

        <div className="space-y-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Countries</span>
          <MultiSelect
            options={options.countries}
            value={countryValue}
            onChange={value => updateListParam("country", value)}
            placeholder="Search countries"
            emptyMessage="No countries"
            ariaLabel="Countries"
          />
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Regions</span>
          <MultiSelect
            options={options.regions}
            value={regionValue}
            onChange={value => updateListParam("region", value)}
            placeholder="Search regions"
            emptyMessage="No regions"
            ariaLabel="Regions"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">UN SDGs</span>
          <MultiSelect
            options={options.sdgs}
            value={sdgsValue}
            onChange={value => updateListParam("sdgs", value)}
            placeholder="Select SDGs"
            emptyMessage="No SDGs"
            ariaLabel="SDG tags"
          />
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">IFRC Global Challenges</span>
          <MultiSelect
            options={options.globalChallenges}
            value={challengesValue}
            onChange={value => updateListParam("global_challenges", value)}
            placeholder="Select challenges"
            emptyMessage="No challenges"
            ariaLabel="IFRC challenges"
          />
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Affected demographics</span>
          <MultiSelect
            options={options.demographics}
            value={demographicValue}
            onChange={value => updateListParam("demographics", value)}
            placeholder="Select demographics"
            emptyMessage="No demographics"
            ariaLabel="Affected demographics"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Urgency min</span>
          <Input
            type="number"
            min={1}
            max={5}
            value={urgencyMinValue}
            onChange={event => updateParams({ urgency_min: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Urgency max</span>
          <Input
            type="number"
            min={1}
            max={5}
            value={urgencyMaxValue}
            onChange={event => updateParams({ urgency_max: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Observed after</span>
          <Input
            type="date"
            value={dateFromValue}
            onChange={event => updateParams({ date_from: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Observed before</span>
          <Input
            type="date"
            value={dateToValue}
            onChange={event => updateParams({ date_to: event.target.value })}
          />
        </label>

        {showSorting ? (
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Sort by</span>
            <Select
              value={selectedSort}
              onValueChange={value => {
                const [sort, dir] = value.split(".");
                updateParams({ sort, dir });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at.desc">Newest first</SelectItem>
                <SelectItem value="created_at.asc">Oldest first</SelectItem>
                <SelectItem value="urgency.desc">Urgency (high to low)</SelectItem>
                <SelectItem value="urgency.asc">Urgency (low to high)</SelectItem>
                <SelectItem value="title.asc">Alphabetical (A–Z)</SelectItem>
                <SelectItem value="title.desc">Alphabetical (Z–A)</SelectItem>
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </div>
    </section>
  );
}
