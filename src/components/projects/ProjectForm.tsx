"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import MapGeocoder from "@/components/MapGeocoder";
import MultiSelect, { type Option } from "@/components/ui/MultiSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  place_name: z.string().trim().min(1, "Location is required"),
});

const linkSchema = z.object({
  url: z.string().trim().min(1, "Link URL is required").url("Enter a valid URL"),
  label: z
    .string()
    .trim()
    .max(120, "Labels should be under 120 characters")
    .optional()
    .or(z.literal(""))
    .transform(v => (v ? v.trim() : undefined)),
});

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter a project name"),
    description: z
      .string()
      .trim()
      .max(4000, "Keep descriptions under 4000 characters")
      .optional()
      .or(z.literal(""))
      .transform(v => (v && v.trim().length ? v.trim() : undefined)),
    lead_org_id: z
      .string()
      .uuid({ message: "Organisation id must be a UUID" })
      .optional()
      .or(z.literal(""))
      .transform(v => (v ? v : undefined)),
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
      .transform(v => (v && v.trim().length ? v.trim() : undefined)),
    lives_improved: z.number().int("Enter a whole number").nonnegative("Cannot be negative").optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    donations_received: z.number().nonnegative("Cannot be negative").optional(),
    amount_needed: z.number().nonnegative("Cannot be negative").optional(),
    currency: z
      .string()
      .trim()
      .length(3, "Use a three-letter currency code")
      .optional()
      .or(z.literal(""))
      .transform(v => (v ? v.toUpperCase() : undefined)),
    location: locationSchema.nullable(),
  })
  .superRefine((values, ctx) => {
    const hasDescription = Boolean(values.description && values.description.trim().length);
    const meaningfulLinks = values.links.filter(link => link.url.trim().length > 0);
    if (!hasDescription && meaningfulLinks.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Add a description or at least one supporting link",
      });
    }
    if (!values.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Select a location",
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

const createDefaultValues = (): FormValues => ({
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
  location: null,
});

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
  const [showGeocoder, setShowGeocoder] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: createDefaultValues(),
    mode: "onBlur",
  });

  const { control, handleSubmit, reset, watch, setValue } = form;
  const linkArray = useFieldArray({ control, name: "links" });

  useEffect(() => {
    let isMounted = true;
    async function loadOptions() {
      const [orgRes, sdgRes, ifrcRes] = await Promise.all([
        supabase.from("organisations").select("id, name").order("name"),
        supabase.from("sdgs").select("id, name").order("id"),
        supabase.from("ifrc_challenges").select("id, name").order("name"),
      ]);
      if (!isMounted) return;
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
      isMounted = false;
    };
  }, []);

  const selectedInterventions = watch("type_of_intervention");
  const selectedThemes = watch("thematic_area");
  const startDate = watch("start_date");
  const partnerOptions = useMemo(() => orgOptions, [orgOptions]);

  const addIntervention = useCallback(() => {
    const trimmed = interventionDraft.trim();
    if (!trimmed || selectedInterventions.includes(trimmed)) return;
    const next = [...selectedInterventions, trimmed];
    setValue("type_of_intervention", next, { shouldDirty: true, shouldValidate: true });
    setInterventionDraft("");
  }, [interventionDraft, selectedInterventions, setValue]);

  const removeIntervention = useCallback(
    (tag: string) => {
      const next = selectedInterventions.filter(item => item !== tag);
      setValue("type_of_intervention", next, { shouldDirty: true, shouldValidate: true });
    },
    [selectedInterventions, setValue],
  );

  const addTheme = useCallback(() => {
    const trimmed = thematicDraft.trim();
    if (!trimmed || selectedThemes.includes(trimmed)) return;
    const next = [...selectedThemes, trimmed];
    setValue("thematic_area", next, { shouldDirty: true, shouldValidate: true });
    setThematicDraft("");
  }, [selectedThemes, setValue, thematicDraft]);

  const removeTheme = useCallback(
    (tag: string) => {
      const next = selectedThemes.filter(item => item !== tag);
      setValue("thematic_area", next, { shouldDirty: true, shouldValidate: true });
    },
    [selectedThemes, setValue],
  );

  const handleFileSelection = (fileList: FileList | null) => {
    setFiles(fileList ? Array.from(fileList) : []);
    setUploads([]);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (!values.location) throw new Error("Please pick a location using the search field");

      const linkPayload = values.links
        .filter(link => link.url.trim().length > 0)
        .map(link => ({ url: link.url.trim(), label: link.label }));

      const response = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          lead_org_id: values.lead_org_id,
          links: linkPayload,
          partner_org_ids: values.partner_org_ids,
          sdg_ids: values.sdg_ids,
          ifrc_ids: values.ifrc_ids,
          type_of_intervention: values.type_of_intervention,
          thematic_area: values.thematic_area,
          target_demographic: values.target_demographic,
          lives_improved: values.lives_improved,
          start_date: values.start_date ? format(values.start_date, "yyyy-MM-dd") : undefined,
          end_date: values.end_date ? format(values.end_date, "yyyy-MM-dd") : undefined,
          donations_received: values.donations_received,
          amount_needed: values.amount_needed,
          currency: values.currency ?? "USD",
          location: values.location,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : errorBody?.error?.message ?? "Unable to submit project";
        throw new Error(message);
      }

      const { id } = (await response.json()) as { id: string; status: string };

      if (files.length) {
        const initialUploads: UploadState[] = files.map(file => ({
          fileName: file.name,
          progress: 0,
          status: "pending",
        }));
        setUploads(initialUploads);

        let uploadFailed = false;

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const extension = file.name.split(".").pop() ?? "bin";
          const path = `${id}/${crypto.randomUUID()}.${extension}`;

          setUploads(curr => curr.map((e, i) => (i === index ? { ...e, status: "uploading", progress: 10 } : e)));

          const { error: uploadError } = await supabase.storage
            .from("project-media")
            .upload(path, file, { contentType: file.type || undefined, upsert: false });

          if (uploadError) {
            uploadFailed = true;
            setUploads(curr =>
              curr.map((e, i) => (i === index ? { ...e, status: "error", error: uploadError.message } : e)),
            );
            continue;
          }

          const { error: recordError } = await supabase
            .from("project_media")
            .insert({ project_id: id, path, mime_type: file.type || undefined, caption: file.name });

          if (recordError) {
            uploadFailed = true;
            setUploads(curr =>
              curr.map((e, i) => (i === index ? { ...e, status: "error", error: recordError.message } : e)),
            );
          } else {
            setUploads(curr => curr.map((e, i) => (i === index ? { ...e, status: "complete", progress: 100 } : e)));
          }
        }

        if (uploadFailed) {
          setSubmitError("Some media files could not be uploaded. Please review the errors below and try again.");
          setIsSubmitting(false);
          return;
        }
      }

      reset(createDefaultValues());
      setFiles([]);
      setUploads([]);
      setInterventionDraft("");
      setThematicDraft("");
      router.push("/projects/new/confirmation");
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Project overview</h2>
              <p className="mt-1 text-sm text-slate-600">Tell us the basics so our reviewers understand what you are proposing.</p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project name</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder="Give the project a clear name" {...field} />
                  </FormControl>
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
                  <FormDescription>
                    Share the story, goals, and current progress of this project. Include details that help reviewers understand impact.
                  </FormDescription>
                  <FormControl>
                    <Textarea rows={5} placeholder="Tell the story of this project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="lead_org_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead organisation</FormLabel>
                  <FormDescription>Select the organisation primarily responsible for the project.</FormDescription>
                  <Select
                    onValueChange={val => field.onChange(val === "__none__" ? undefined : val)}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an organisation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent align="start">
                      <SelectItem value="__none__">No lead organisation</SelectItem>
                      {orgOptions.map(option => (
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

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Supporting links</h3>
                  <p className="text-sm text-slate-500">Include press, documentation, or public updates that help validate the project.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => linkArray.append({ url: "", label: undefined })}>
                  <Plus className="mr-1 h-4 w-4" /> Add link
                </Button>
              </div>

              {linkArray.fields.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">No links added yet.</p>
              )}

              <div className="space-y-3">
                {linkArray.fields.map((fieldItem, index) => (
                  <div
                    key={fieldItem.id}
                    className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <FormField
                      control={control}
                      name={`links.${index}.url` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <LinkIcon className="h-4 w-4 text-slate-400" /> URL
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.org" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`links.${index}.label` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Label (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Document title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => linkArray.remove(index)}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={control}
              name="partner_org_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner organisations</FormLabel>
                  <FormDescription>Select organisations collaborating on delivery.</FormDescription>
                  <FormControl>
                    <MultiSelect
                      options={partnerOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search organisations..."
                      ariaLabel="Partner organisations"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="sdg_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sustainable Development Goals</FormLabel>
                  <FormDescription>Highlight the SDGs advanced by this project.</FormDescription>
                  <FormControl>
                    <MultiSelect
                      options={sdgOptions}
                      value={field.value.map(String)}
                      onChange={sel => field.onChange(sel.map(Number))}
                      placeholder="Search SDGs..."
                      ariaLabel="Sustainable Development Goals"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="ifrc_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFRC Global Challenges</FormLabel>
                  <FormDescription>Select the challenges your project responds to.</FormDescription>
                  <FormControl>
                    <MultiSelect
                      options={ifrcOptions}
                      value={field.value.map(String)}
                      onChange={sel => field.onChange(sel.map(Number))}
                      placeholder="Search challenges..."
                      ariaLabel="IFRC Global Challenges"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Location & beneficiaries</h2>
          <p className="mt-1 text-sm text-slate-600">Find the place where the project has the greatest impact.</p>

          <div className="mt-6 space-y-6">
            <FormField
              control={control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search for a location</FormLabel>
                  <FormDescription>Use the map search to pin the primary impact location.</FormDescription>
                  <div className="mt-2 space-y-3 rounded-2xl border border-slate-200 p-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowGeocoder(previous => !previous)}
                    >
                      {field.value ? "Change location" : "Add location"}
                    </Button>
                    {showGeocoder ? (
                      <MapGeocoder
                        onSelect={value => {
                          field.onChange(value);
                          setShowGeocoder(false);
                        }}
                      />
                    ) : null}
                    {field.value ? (
                      <Badge variant="emerald" className="inline-flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" /> {field.value.place_name}
                      </Badge>
                    ) : (
                      <p className="text-sm text-slate-500">No location selected yet.</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="target_demographic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target demographic</FormLabel>
                  <FormDescription>Who is the project designed to support?</FormDescription>
                  <FormControl>
                    <Input placeholder="e.g. Youth in coastal communities" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="lives_improved"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated lives improved</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="If unknown, leave blank"
                      value={field.value ?? ""}
                      onChange={e => {
                        const next = e.target.value;
                        field.onChange(next === "" ? undefined : Number(next));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Type of intervention</h3>
                  <p className="text-sm text-slate-500">Add tags that describe the intervention (e.g. Urban farming, Cooling, Renewable energy).</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedInterventions.length === 0 && (
                  <Badge variant="outline" className="text-slate-500">
                    No tags added
                  </Badge>
                )}
                {selectedInterventions.map(tag => (
                  <Badge key={tag} variant="emerald" className="flex items-center gap-2">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeIntervention(tag)}
                      className="rounded-full p-0.5 hover:bg-emerald-200"
                      aria-label={`Remove ${tag}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={interventionDraft}
                  onChange={e => setInterventionDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addIntervention();
                    }
                  }}
                  placeholder="Add a new intervention"
                />
                <Button type="button" onClick={addIntervention}>
                  <Plus className="mr-1 h-4 w-4" /> Add tag
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Thematic areas</h3>
                  <p className="text-sm text-slate-500">Capture themes that describe the work (e.g. Climate adaptation).</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedThemes.length === 0 && (
                  <Badge variant="outline" className="text-slate-500">
                    No thematic areas added
                  </Badge>
                )}
                {selectedThemes.map(tag => (
                  <Badge key={tag} variant="emerald" className="flex items-center gap-2">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTheme(tag)}
                      className="rounded-full p-0.5 hover:bg-emerald-200"
                      aria-label={`Remove ${tag}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={thematicDraft}
                  onChange={e => setThematicDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTheme();
                    }
                  }}
                  placeholder="Add a thematic area"
                />
                <Button type="button" onClick={addTheme}>
                  <Plus className="mr-1 h-4 w-4" /> Add tag
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Timeline & funding</h2>
          <p className="mt-1 text-sm text-slate-600">Share when the project runs and what support is still required.</p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <FormField
              control={control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("justify-start text-left font-normal", !field.value && "text-slate-500")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick a start date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("justify-start text-left font-normal", !field.value && "text-slate-500")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : "Pick an end date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={date => Boolean(startDate && date < startDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="donations_received"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Donations received</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={e => {
                        const next = e.target.value;
                        field.onChange(next === "" ? undefined : Number(next));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="amount_needed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding still needed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={e => {
                        const next = e.target.value;
                        field.onChange(next === "" ? undefined : Number(next));
                      }}
                    />
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
                  <FormControl>
                    <Input
                      maxLength={3}
                      placeholder="USD"
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Project media</h2>
          <p className="mt-1 text-sm text-slate-600">Upload images, video, or documents after submitting the form.</p>

          <div className="mt-4 space-y-4">
            <label
              htmlFor="project-media"
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <UploadCloud className="h-6 w-6" />
              <span className="text-sm font-semibold">Click to select files</span>
              <span className="text-xs text-slate-500">Images, video, and documents are welcome. 100MB max per file.</span>
              <input
                id="project-media"
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                multiple
                className="hidden"
                onChange={e => handleFileSelection(e.target.files)}
              />
            </label>

            {files.length > 0 && (
              <ul className="space-y-2 text-sm text-slate-600">
                {files.map(file => (
                  <li key={file.name} className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
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
                        className={cn("h-2 rounded-full", upload.status === "error" ? "bg-rose-400" : "bg-emerald-500")}
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

        {submitError && <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div>}

        <div className="sticky bottom-4 z-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:static sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none">
          <Button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSubmitting ? "Submitting" : "Submit project"}
          </Button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Submission goes to the Solarpunk Taskforce team for review. You can add more media after approval.
          </p>
        </div>
      </form>
    </Form>
  );
}
