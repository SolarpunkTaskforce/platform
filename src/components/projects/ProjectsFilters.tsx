"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FILTER_KEYS = [
  "q",
  "category",
  "country",
  "region",
  "currency",
  "thematic_area",
  "type_of_intervention",
  "target_demographic",
  "partner_org_ids",
  "min_needed",
  "max_needed",
  "min_received",
  "max_received",
  "min_lives",
  "max_lives",
  "start_from",
  "end_to",
  "sort",
  "dir",
  "page",
] as const;

const getParamValue = (searchParams: URLSearchParams, key: string) => searchParams.get(key) ?? "";

export default function ProjectsFilters() {
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
      router.push(query ? `/projects?${query}` : "/projects");
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach(key => params.delete(key));
    const query = params.toString();
    router.push(query ? `/projects?${query}` : "/projects");
  }, [router, searchParams]);

  const qValue = getParamValue(searchParams, "q");
  const categoryValue = getParamValue(searchParams, "category");
  const countryValue = getParamValue(searchParams, "country");
  const regionValue = getParamValue(searchParams, "region");
  const currencyValue = getParamValue(searchParams, "currency");
  const thematicValue = getParamValue(searchParams, "thematic_area");
  const interventionValue = getParamValue(searchParams, "type_of_intervention");
  const demographicValue = getParamValue(searchParams, "target_demographic");
  const partnerValue = getParamValue(searchParams, "partner_org_ids");
  const minNeededValue = getParamValue(searchParams, "min_needed");
  const maxNeededValue = getParamValue(searchParams, "max_needed");
  const minReceivedValue = getParamValue(searchParams, "min_received");
  const maxReceivedValue = getParamValue(searchParams, "max_received");
  const minLivesValue = getParamValue(searchParams, "min_lives");
  const maxLivesValue = getParamValue(searchParams, "max_lives");
  const startFromValue = getParamValue(searchParams, "start_from");
  const endToValue = getParamValue(searchParams, "end_to");
  const sortValue = getParamValue(searchParams, "sort") || "created_at";
  const dirValue = getParamValue(searchParams, "dir") || "desc";

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <p className="text-sm text-slate-500">Use these controls to refine the project list.</p>
        </div>
        <Button type="button" variant="ghost" onClick={clearFilters}>
          Clear filters
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Search</span>
          <Input
            value={qValue}
            placeholder="Project name or place"
            onChange={event => updateParams({ q: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Category</span>
          <Select
            value={categoryValue || "all"}
            onValueChange={value => updateParams({ category: value === "all" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="humanitarian">Humanitarian</SelectItem>
              <SelectItem value="environmental">Environmental</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Country</span>
          <Input
            value={countryValue}
            placeholder="US, CA"
            onChange={event => updateParams({ country: event.target.value })}
          />
        </label>

        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-900">Region</span>
          <Input
            value={regionValue}
            placeholder="Region names"
            onChange={event => updateParams({ region: event.target.value })}
          />
        </label>
      </div>

      <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">Advanced filters</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Thematic areas</span>
            <Input
              value={thematicValue}
              placeholder="comma-separated"
              onChange={event => updateParams({ thematic_area: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Intervention types</span>
            <Input
              value={interventionValue}
              placeholder="comma-separated"
              onChange={event => updateParams({ type_of_intervention: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Target demographics</span>
            <Input
              value={demographicValue}
              placeholder="comma-separated"
              onChange={event => updateParams({ target_demographic: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Partner org IDs</span>
            <Input
              value={partnerValue}
              placeholder="uuid, uuid"
              onChange={event => updateParams({ partner_org_ids: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Currency</span>
            <Input
              value={currencyValue}
              placeholder="USD, EUR"
              onChange={event => updateParams({ currency: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Min funding needed</span>
            <Input
              type="number"
              value={minNeededValue}
              onChange={event => updateParams({ min_needed: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Max funding needed</span>
            <Input
              type="number"
              value={maxNeededValue}
              onChange={event => updateParams({ max_needed: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Min funding received</span>
            <Input
              type="number"
              value={minReceivedValue}
              onChange={event => updateParams({ min_received: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Max funding received</span>
            <Input
              type="number"
              value={maxReceivedValue}
              onChange={event => updateParams({ max_received: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Min lives improved</span>
            <Input
              type="number"
              value={minLivesValue}
              onChange={event => updateParams({ min_lives: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Max lives improved</span>
            <Input
              type="number"
              value={maxLivesValue}
              onChange={event => updateParams({ max_lives: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Start date from</span>
            <Input
              type="date"
              value={startFromValue}
              onChange={event => updateParams({ start_from: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">End date to</span>
            <Input
              type="date"
              value={endToValue}
              onChange={event => updateParams({ end_to: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Sort by</span>
            <Select value={sortValue} onValueChange={value => updateParams({ sort: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="amount_needed">Amount needed</SelectItem>
                <SelectItem value="donations_received">Donations received</SelectItem>
                <SelectItem value="start_date">Start date</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Sort direction</span>
            <Select value={dirValue} onValueChange={value => updateParams({ dir: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </details>
    </section>
  );
}
