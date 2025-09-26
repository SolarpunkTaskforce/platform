"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import MapGeocoder from "@/components/MapGeocoder";
import MultiSelect, { Option } from "@/components/ui/MultiSelect";
import { supabase } from "@/lib/supabase";

const linkSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Link URL is required")
    .url("Enter a valid URL"),
  label: z
    .string()
    .trim()
    .max(120, "Labels should be under 120 characters")
    .optional()
    .or(z.literal(""))
    .transform(value => value?.trim() ?? undefined),
});

const formSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Please enter a project name"),
    description: z
      .string()
      .trim()
      .max(4000, "Keep descriptions under 4000 characters")
      .optional()
      .or(z.literal(""))
      .transform(value => value?.trim() ?? undefined),
    lead_org_id: z
      .string()
      .uuid({ message: "Organisation id must be a UUID" })
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value : undefined)),
    links: z.array(linkSchema).default([]),
    partner_org_ids: z.array(z.string().uuid()).default([]),
    sdg_ids: z.array(z.number().int()).default([]),
    ifrc_ids: z.array(z.number().int()).default([]),
    type_of_intervention: z.array(z.string().min(1)).default([]),
    thematic_area: z.array(z.string().min(1)).default([]),
    target_demographic: z
      .string()
      .trim()
      .max(255, "Target demographic should be concise")
      .optional()
      .or(z.literal(""))
      .transform(value => value?.trim() ?? undefined),
    lives_improved: z
      .preprocess(value => {
        if (value === "" || value === null) return undefined;
        if (typeof value === "number" && Number.isNaN(value)) return undefined;
        return value;
      }, z.number().int("Enter a whole number").nonnegative("Cannot be negative"))
      .optional(),
    start_date: z
      .preprocess(value => (value === null || value === "" ? undefined : value), z.date())
      .optional(),
    end_date: z
      .preprocess(value => (value === null || value === "" ? undefined : value), z.date())
      .optional(),
    donations_received: z
      .preprocess(value => {
        if (value === "" || value === null) return undefined;
        if (typeof value === "number" && Number.isNaN(value)) return undefined;
        return value;
      }, z.number().nonnegative("Cannot be negative"))
      .optional(),
    amount_needed: z
      .preprocess(value => {
        if (value === "" || value === null) return undefined;
        if (typeof value === "number" && Number.isNaN(value)) return undefined;
        return value;
      }, z.number().nonnegative("Cannot be negative"))
      .optional(),
    currency: z
      .string()
      .trim()
      .length(3, "Use a three-letter currency code")
      .optional()
      .or(z.literal(""))
      .transform(value => (value ? value.toUpperCase() : undefined)),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      place_name: z.string().trim().min(1, "Location is required"),
    }),
  })
  .superRefine((values, ctx) => {
    if (!values.description && values.links.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Add a description or at least one supporting link",
      });
    }
    if (values.start_date && values.end_date && values.start_date > values.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date must be after start date",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

type UploadState = {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
};

const defaultValues: FormValues = {
  name: "",
  description: undefined,
  lead_org_id: undefined,
  links: [],
  partner_org_ids: [],
  sdg_ids: [],
  ifrc_ids: [],
  type_of_intervention: [],
  thematic_area: [],
  target_demographic: undefined,
  lives_improved: undefined,
  start_date: undefined,
  end_date: undefined,
  donations_received: undefined,
  amount_needed: undefined,
  currency: "USD",
  location: { lat: 0, lng: 0, place_name: "" },
};

export default function ProjectForm() {
  const router = useRouter();
  const [orgOptions, setOrgOptions] = useState<Option[]>([]);
  const [sdgOptions, setSdgOptions] = useState<Option[]>([]);
  const [ifrcOptions, setIfrcOptions] = useState<Option[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interventionDraft, setInterventionDraft] = useState("");
  const [thematicDraft, setThematicDraft] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues,
    mode: "onBlur",
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
  } = form;

  const linkArray = useFieldArray({ control, name: "links" });

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const [orgRes, sdgRes, ifrcRes] = await Promise.all([
        supabase.from("organisations").select("id, name").order("name"),
        supabase.from("sdgs").select("id, name").order("id"),
        supabase.from("ifrc_challenges").select("id, name").order("name"),
      ]);

      if (cancelled) return;

      if (!orgRes.error && orgRes.data) {
        setOrgOptions(orgRes.data.map(org => ({ value: org.id, label: org.name })));
      }
      if (!sdgRes.error && sdgRes.data) {
        setSdgOptions(sdgRes.data.map(sdg => ({ value: String(sdg.id), label: `${sdg.id}. ${sdg.name}` })));
      }
      if (!ifrcRes.error && ifrcRes.data) {
        setIfrcOptions(ifrcRes.data.map(ch => ({ value: String(ch.id), label: ch.name })));
      }
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const partnerOrgIds = watch("partner_org_ids");
  const selectedInterventions = watch("type_of_intervention");
  const selectedThemes = watch("thematic_area");
  const sdgIds = watch("sdg_ids");
  const ifrcIds = watch("ifrc_ids");
  const location = watch("location");

  const partnerOptions = useMemo(() => orgOptions, [orgOptions]);

  const handleLocationSelect = useCallback(
    (selected: { lat: number; lng: number; place_name: string }) => {
      setValue("location", selected, { shouldDirty: true });
    },
    [setValue],
  );

  function addIntervention() {
    const trimmed = interventionDraft.trim();
    if (!trimmed) return;
    if (selectedInterventions.includes(trimmed)) {
      setInterventionDraft("");
      return;
    }
    setValue("type_of_intervention", [...selectedInterventions, trimmed], { shouldDirty: true });
    setInterventionDraft("");
  }

  function removeIntervention(tag: string) {
    setValue(
      "type_of_intervention",
      selectedInterventions.filter(item => item !== tag),
      { shouldDirty: true },
    );
  }

  function addTheme() {
    const trimmed = thematicDraft.trim();
    if (!trimmed) return;
    if (selectedThemes.includes(trimmed)) {
      setThematicDraft("");
      return;
    }
    setValue("thematic_area", [...selectedThemes, trimmed], { shouldDirty: true });
    setThematicDraft("");
  }

  function removeTheme(tag: string) {
    setValue(
      "thematic_area",
      selectedThemes.filter(item => item !== tag),
      { shouldDirty: true },
    );
  }

  async function onSubmit(values: FormValues) {
    if (!values.location.place_name) {
      setError("location", { type: "manual", message: "Please pick a location" });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      ...values,
      links: values.links.filter(link => link.url),
      partner_org_ids: values.partner_org_ids,
      sdg_ids: values.sdg_ids,
      ifrc_ids: values.ifrc_ids,
      type_of_intervention: values.type_of_intervention,
      thematic_area: values.thematic_area,
      start_date: values.start_date ? values.start_date.toISOString().slice(0, 10) : undefined,
      end_date: values.end_date ? values.end_date.toISOString().slice(0, 10) : undefined,
      donations_received: values.donations_received,
      amount_needed: values.amount_needed,
      lives_improved: values.lives_improved,
      currency: values.currency ?? "USD",
    };

    try {
      const response = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error?.message ?? errorBody?.error ?? "Unable to submit project";
        throw new Error(typeof message === "string" ? message : "Unable to submit project");
      }

      const { id } = (await response.json()) as { id: string };

      if (files.length) {
        const nextUploads: UploadState[] = files.map(file => ({
          fileName: file.name,
          progress: 0,
          status: "pending",
        }));
        setUploads(nextUploads);
        let uploadFailed = false;

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const ext = file.name.split(".").pop() ?? "bin";
          const path = `${id}/${crypto.randomUUID()}.${ext}`;

          setUploads(current =>
            current.map((entry, uploadIndex) =>
              uploadIndex === index ? { ...entry, status: "uploading", progress: 1 } : entry,
            ),
          );

          const { error: uploadError } = await supabase.storage
            .from("project-media")
            .upload(path, file, {
              contentType: file.type || undefined,
              upsert: false,
            });

          if (uploadError) {
            setUploads(current =>
              current.map((entry, uploadIndex) =>
                uploadIndex === index
                  ? {
                      ...entry,
                      status: "error",
                      error: uploadError.message,
                    }
                  : entry,
              ),
            );
            uploadFailed = true;
            continue;
          }

          const { error: recordError } = await supabase
            .from("project_media")
            .insert({ project_id: id, path, mime_type: file.type || undefined, caption: file.name });

          if (recordError) {
            setUploads(current =>
              current.map((entry, uploadIndex) =>
                uploadIndex === index
                  ? { ...entry, status: "error", error: recordError.message }
                  : entry,
              ),
            );
            uploadFailed = true;
          } else {
            setUploads(current =>
              current.map((entry, uploadIndex) =>
                uploadIndex === index ? { ...entry, status: "complete", progress: 100 } : entry,
              ),
            );
          }
        }

        if (uploadFailed) {
          setSubmitError("Some media files could not be uploaded. Please review the errors below and try again.");
          setIsSubmitting(false);
          return;
        }
      }

      reset(defaultValues);
      setFiles([]);
      setUploads([]);
      router.push("/projects/new/confirmation");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Project overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tell us the basics so our reviewers understand what you are proposing.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-slate-900">
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              autoComplete="off"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              {...form.register("name")}
            />
            {errors.name && <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium text-slate-900">
              Description
            </label>
            <textarea
              id="project-description"
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Share the story, goals, and current progress of this project"
              {...form.register("description")}
            />
            {errors.description && <p className="mt-1 text-sm text-rose-600">{errors.description.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-900">Supporting links</label>
              <button
                type="button"
                onClick={() => linkArray.append({ url: "", label: undefined })}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                <Plus className="h-4 w-4" /> Add link
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Include press, documentation, or public updates that help validate the project.
            </p>
            <div className="mt-3 space-y-3">
              {linkArray.fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-end sm:gap-4">
                  <div className="flex-1">
                    <label htmlFor={`link-url-${field.id}`} className="text-sm font-medium text-slate-900">
                      URL
                    </label>
                    <input
                      id={`link-url-${field.id}`}
                      type="url"
                      placeholder="https://"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      {...form.register(`links.${index}.url` as const)}
                    />
                    {errors.links?.[index]?.url && (
                      <p className="mt-1 text-sm text-rose-600">{errors.links[index]?.url?.message}</p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label htmlFor={`link-label-${field.id}`} className="text-sm font-medium text-slate-900">
                      Label (optional)
                    </label>
                    <input
                      id={`link-label-${field.id}`}
                      type="text"
                      placeholder="Community update, Media coverage..."
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      {...form.register(`links.${index}.label` as const)}
                    />
                    {errors.links?.[index]?.label && (
                      <p className="mt-1 text-sm text-rose-600">{errors.links[index]?.label?.message}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => linkArray.remove(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!linkArray.fields.length && (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  Add links to provide evidence or more context for the review team.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Organisations & partners</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect the project with the groups who are leading and collaborating on the work.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <label htmlFor="lead-organisation" className="block text-sm font-medium text-slate-900">
              Lead organisation
            </label>
            <select
              id="lead-organisation"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={form.watch("lead_org_id") ?? ""}
              onChange={event => setValue("lead_org_id", event.target.value || undefined, { shouldDirty: true })}
            >
              <option value="">Select an organisation</option>
              {orgOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.lead_org_id && <p className="mt-1 text-sm text-rose-600">{errors.lead_org_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Delivery partners</label>
            <p className="mt-1 text-sm text-slate-500">
              Search and select any organisations collaborating on this project.
            </p>
            <MultiSelect
              options={partnerOptions}
              value={partnerOrgIds}
              onChange={selection => setValue("partner_org_ids", selection, { shouldDirty: true })}
              placeholder="Search organisations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Sustainable Development Goals</label>
            <p className="mt-1 text-sm text-slate-500">Highlight the SDGs advanced by this project.</p>
            <MultiSelect
              options={sdgOptions}
              value={sdgIds.map(String)}
              onChange={selection => setValue("sdg_ids", selection.map(Number), { shouldDirty: true })}
              placeholder="Search SDGs..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">IFRC Global Challenges</label>
            <p className="mt-1 text-sm text-slate-500">Select the challenges your project responds to.</p>
            <MultiSelect
              options={ifrcOptions}
              value={ifrcIds.map(String)}
              onChange={selection => setValue("ifrc_ids", selection.map(Number), { shouldDirty: true })}
              placeholder="Search challenges..."
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Location & beneficiaries</h2>
        <p className="mt-1 text-sm text-slate-600">Find the place where the project has the greatest impact.</p>

        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900" htmlFor="project-location">
              Search for a location
            </label>
            <div className="mt-2 rounded-2xl border border-slate-200 p-3">
              <MapGeocoder onSelect={handleLocationSelect} />
              {location?.place_name ? (
                <p className="mt-3 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  {location.place_name}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No location selected yet.</p>
              )}
            </div>
            {errors.location && (
              <p className="mt-2 text-sm text-rose-600">{errors.location.message ?? "Please select a location"}</p>
            )}
          </div>

          <div>
            <label htmlFor="target-demographic" className="block text-sm font-medium text-slate-900">
              Target demographic
            </label>
            <input
              id="target-demographic"
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="e.g. Youth in coastal communities"
              {...form.register("target_demographic")}
            />
            {errors.target_demographic && (
              <p className="mt-1 text-sm text-rose-600">{errors.target_demographic.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lives-improved" className="block text-sm font-medium text-slate-900">
              Estimated lives improved
            </label>
            <input
              id="lives-improved"
              type="number"
              min={0}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="If unknown, leave blank"
              {...form.register("lives_improved", { valueAsNumber: true })}
            />
            {errors.lives_improved && <p className="mt-1 text-sm text-rose-600">{errors.lives_improved.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Type of intervention</label>
            <p className="mt-1 text-sm text-slate-500">
              Add tags that describe what kind of intervention this project delivers (e.g. Urban farming, Cooling, Renewable energy).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedInterventions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeIntervention(tag)}
                  className="group inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  {tag}
                  <span className="rounded-full bg-emerald-200 px-1 text-xs text-emerald-800 group-hover:bg-emerald-300">Remove</span>
                </button>
              ))}
              {!selectedInterventions.length && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">No tags added</span>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={interventionDraft}
                onChange={event => setInterventionDraft(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Add a new intervention"
              />
              <button
                type="button"
                onClick={addIntervention}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Thematic areas</label>
            <p className="mt-1 text-sm text-slate-500">
              Capture themes that describe the work (e.g. Climate adaptation, Community health, Disaster resilience).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedThemes.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTheme(tag)}
                  className="group inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                >
                  {tag}
                  <span className="rounded-full bg-sky-200 px-1 text-xs text-sky-800 group-hover:bg-sky-300">Remove</span>
                </button>
              ))}
              {!selectedThemes.length && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">No thematic areas added</span>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={thematicDraft}
                onChange={event => setThematicDraft(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Add a thematic area"
              />
              <button
                type="button"
                onClick={addTheme}
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Timeline & funding</h2>
        <p className="mt-1 text-sm text-slate-600">Share when the project runs and what support is still required.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-slate-900">
              Start date
            </label>
            <input
              id="start-date"
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              {...form.register("start_date", { valueAsDate: true })}
            />
            {errors.start_date && <p className="mt-1 text-sm text-rose-600">{errors.start_date.message as string}</p>}
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-slate-900">
              End date
            </label>
            <input
              id="end-date"
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              {...form.register("end_date", { valueAsDate: true })}
            />
            {errors.end_date && <p className="mt-1 text-sm text-rose-600">{errors.end_date.message as string}</p>}
          </div>

          <div>
            <label htmlFor="donations-received" className="block text-sm font-medium text-slate-900">
              Donations received
            </label>
            <input
              id="donations-received"
              type="number"
              step="0.01"
              min={0}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="0.00"
              {...form.register("donations_received", { valueAsNumber: true })}
            />
            {errors.donations_received && (
              <p className="mt-1 text-sm text-rose-600">{errors.donations_received.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="amount-needed" className="block text-sm font-medium text-slate-900">
              Funding still needed
            </label>
            <input
              id="amount-needed"
              type="number"
              step="0.01"
              min={0}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="0.00"
              {...form.register("amount_needed", { valueAsNumber: true })}
            />
            {errors.amount_needed && <p className="mt-1 text-sm text-rose-600">{errors.amount_needed.message}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-900">
              Currency
            </label>
            <input
              id="currency"
              type="text"
              maxLength={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base uppercase shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              {...form.register("currency")}
            />
            {errors.currency && <p className="mt-1 text-sm text-rose-600">{errors.currency.message}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Project media</h2>
        <p className="mt-1 text-sm text-slate-600">
          After submitting the project we will upload media to the shared library for review.
        </p>
        <div className="mt-4 space-y-4">
          <label
            htmlFor="project-media"
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <input
              id="project-media"
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              multiple
              className="hidden"
              onChange={event => setFiles(event.target.files ? Array.from(event.target.files) : [])}
            />
            <span className="text-sm font-semibold">Click to select files</span>
            <span className="text-xs text-slate-500">Images, video, and documents are welcome. 100MB max per file.</span>
          </label>

          {files.length > 0 && (
            <ul className="space-y-3">
              {files.map(file => (
                <li key={file.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  {file.name}
                </li>
              ))}
            </ul>
          )}

          {uploads.length > 0 && (
            <ul className="space-y-3">
              {uploads.map(upload => (
                <li
                  key={`${upload.fileName}-${upload.status}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{upload.fileName}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{upload.status}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${upload.status === "error" ? "bg-rose-400" : "bg-emerald-500"}`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                  {upload.error && <p className="mt-2 text-xs text-rose-600">{upload.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {submitError && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}

      <div className="sticky bottom-4 z-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:static sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isSubmitting ? "Submitting" : "Submit project"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Submission goes to the Solarpunk Taskforce team for review. You can add more media after approval.
        </p>
      </div>
    </form>
  );
}
