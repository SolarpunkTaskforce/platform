"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import MultiSelect, { type Option } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FUNDING_TYPE_OPTIONS: Option[] = [
  { value: "grant", label: "Grant" },
  { value: "prize", label: "Prize" },
  { value: "fellowship", label: "Fellowship" },
  { value: "loan", label: "Loan" },
  { value: "equity", label: "Equity" },
  { value: "in-kind", label: "In-kind" },
  { value: "other", label: "Other" },
];

const PROJECT_TYPE_OPTIONS: Option[] = [
  { value: "environmental", label: "Environmental" },
  { value: "humanitarian", label: "Humanitarian" },
  { value: "both", label: "Both / cross-cutting" },
];

const SDG_OPTIONS: Option[] = Array.from({ length: 17 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `SDG ${value}` };
});

const COUNTRY_OPTIONS: Option[] = [
  { value: "AR", label: "Argentina" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgium" },
  { value: "BR", label: "Brazil" },
  { value: "CA", label: "Canada" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "DK", label: "Denmark" },
  { value: "EG", label: "Egypt" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JP", label: "Japan" },
  { value: "KE", label: "Kenya" },
  { value: "MX", label: "Mexico" },
  { value: "NL", label: "Netherlands" },
  { value: "NG", label: "Nigeria" },
  { value: "NO", label: "Norway" },
  { value: "NZ", label: "New Zealand" },
  { value: "PK", label: "Pakistan" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "RO", label: "Romania" },
  { value: "ZA", label: "South Africa" },
  { value: "KR", label: "South Korea" },
  { value: "ES", label: "Spain" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "TR", label: "Turkey" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "VN", label: "Vietnam" },
];

const CURRENCY_CODES = [
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "AUD",
  "CAD",
  "NZD",
  "JPY",
  "CNY",
  "INR",
  "SEK",
  "NOK",
  "DKK",
  "BRL",
  "MXN",
  "ZAR",
  "KES",
  "NGN",
  "GHS",
  "IDR",
  "SGD",
  "HKD",
  "KRW",
  "TRY",
  "PLN",
  "CZK",
  "HUF",
  "ILS",
  "SAR",
];

const optionalNumber = z.preprocess(
  value => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().nonnegative().optional(),
);

const formSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    summary: z
      .string()
      .trim()
      .max(280, "Keep summaries under 280 characters")
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.trim() : undefined)),
    description: z
      .string()
      .trim()
      .max(4000, "Keep descriptions under 4000 characters")
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.trim() : undefined)),
    project_type: z.enum(["environmental", "humanitarian", "both"] as const, {
      message: "Select a project type",
    }),
    funding_type: z.enum(["grant", "prize", "fellowship", "loan", "equity", "in-kind", "other"] as const, {
      message: "Select a funding type",
    }),
    application_url: z.string().trim().url("Enter a valid application URL"),
    funder_name: z
      .string()
      .trim()
      .max(200, "Keep funder names under 200 characters")
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.trim() : undefined)),
    funder_website: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.trim() : undefined))
      .refine(value => !value || /^https?:\/\//i.test(value), "Enter a valid URL"),
    contact_email: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.trim() : undefined))
      .refine(value => !value || /.+@.+\..+/.test(value), "Enter a valid email"),
    currency: z
      .string()
      .trim()
      .length(3, "Use a three-letter currency code")
      .transform(value => value.toUpperCase()),
    amount_min: optionalNumber,
    amount_max: optionalNumber,
    open_date: z.string().optional(),
    deadline: z.string().optional(),
    decision_date: z.string().optional(),
    start_date: z.string().optional(),
    eligible_countries: z.array(z.string()).default([]),
    remote_ok: z.boolean().default(true),
    location_name: z
      .string()
      .trim()
      .max(255, "Location name should be concise")
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.trim() : undefined)),
    latitude: optionalNumber,
    longitude: optionalNumber,
    themes: z.string().optional(),
    sdgs: z.array(z.string()).default([]),
    keywords: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (
      typeof values.amount_min === "number" &&
      typeof values.amount_max === "number" &&
      values.amount_min > values.amount_max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount_max"],
        message: "Maximum amount must be greater than minimum amount",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const createDefaultValues = (): FormValues => ({
  title: "",
  summary: undefined,
  description: undefined,
  project_type: "environmental",
  funding_type: "grant",
  application_url: "",
  funder_name: undefined,
  funder_website: undefined,
  contact_email: undefined,
  currency: "EUR",
  amount_min: undefined,
  amount_max: undefined,
  open_date: "",
  deadline: "",
  decision_date: "",
  start_date: "",
  eligible_countries: [],
  remote_ok: true,
  location_name: undefined,
  latitude: undefined,
  longitude: undefined,
  themes: "",
  sdgs: [],
  keywords: "",
});

const parseCommaList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

export default function GrantForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: createDefaultValues(),
  });

  const { control, handleSubmit, reset } = form;

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/grants/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          summary: values.summary ?? null,
          description: values.description ?? null,
          project_type: values.project_type,
          funding_type: values.funding_type,
          application_url: values.application_url,
          funder_name: values.funder_name ?? null,
          funder_website: values.funder_website ?? null,
          contact_email: values.contact_email ?? null,
          currency: values.currency,
          amount_min: values.amount_min ?? null,
          amount_max: values.amount_max ?? null,
          open_date: values.open_date || null,
          deadline: values.deadline || null,
          decision_date: values.decision_date || null,
          start_date: values.start_date || null,
          eligible_countries: values.eligible_countries,
          remote_ok: values.remote_ok,
          location_name: values.location_name ?? null,
          latitude: values.latitude ?? null,
          longitude: values.longitude ?? null,
          themes: parseCommaList(values.themes),
          sdgs: values.sdgs.map(item => Number(item)).filter(item => Number.isFinite(item)),
          keywords: parseCommaList(values.keywords),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : errorBody?.error?.message ?? "Unable to submit grant";
        throw new Error(message);
      }

      const returned = (await response.json()) as { id: string; slug?: string };
      reset(createDefaultValues());
      router.push(`/grants/${encodeURIComponent(returned.slug ?? returned.id)}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Grant overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Share the essentials so funders and project teams can understand this opportunity.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Grant or funding opportunity name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="A short summary for the directory" />
                  </FormControl>
                  <FormDescription>Keep it short and focused (max 280 characters).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={6} placeholder="Provide the full grant details." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Funding details</h2>
            <p className="mt-1 text-sm text-slate-600">Specify funding type, amounts, and key dates.</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FormField
              control={control}
              name="project_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="funding_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select funding type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FUNDING_TYPE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="application_url"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Application URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCY_CODES.map(code => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="amount_min"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount min</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={event => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="amount_max"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount max</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value ?? ""}
                      onChange={event => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FormField
              control={control}
              name="open_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Open date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="decision_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Eligibility & reach</h2>
            <p className="mt-1 text-sm text-slate-600">Who can apply and where does this grant apply?</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FormField
              control={control}
              name="eligible_countries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligible countries</FormLabel>
                  <FormDescription>Select all countries that can apply.</FormDescription>
                  <MultiSelect
                    options={COUNTRY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search countries"
                    emptyMessage="No matching countries"
                    ariaLabel="Eligible countries"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={control}
                name="remote_ok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remote friendly</FormLabel>
                    <FormDescription>Toggle if teams can apply without a physical location.</FormDescription>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={event => field.onChange(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Remote or distributed applicants are welcome
                    </label>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="location_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Berlin, Kenya, Global" />
                    </FormControl>
                    <FormDescription>Visible in listings and the map popup.</FormDescription>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={event =>
                            field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={event =>
                            field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <p className="text-xs text-slate-500">
                Map markers appear only when latitude and longitude are provided.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Tags & themes</h2>
            <p className="mt-1 text-sm text-slate-600">Help teams find the right opportunities.</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FormField
              control={control}
              name="themes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Themes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. reforestation, WASH" />
                  </FormControl>
                  <FormDescription>Comma-separated themes used for filtering.</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="sdgs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SDGs</FormLabel>
                  <MultiSelect
                    options={SDG_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Search SDGs"
                    emptyMessage="No SDGs available"
                    ariaLabel="SDG selection"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="keywords"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Comma-separated keywords" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Funder contact</h2>
            <p className="mt-1 text-sm text-slate-600">Where should applicants go for more info?</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FormField
              control={control}
              name="funder_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funder name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Organisation or program" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="funder_website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funder website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="email@example.org" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit grant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
