"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import MultiSelect, { Option } from "@/components/ui/MultiSelect";
import MapGeocoder from "@/components/MapGeocoder";

const linkSchema = z.object({ url: z.string().url(), label: z.string().optional() });
const formSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  lead_org_id: z.string().uuid().optional(),
  links: z.array(linkSchema).default([]),
  partner_org_ids: z.array(z.string().uuid()).default([]),
  sdg_ids: z.array(z.number()).default([]),
  ifrc_ids: z.array(z.number()).default([]),
  type_of_intervention: z.array(z.string()).default([]),
  thematic_area: z.array(z.string()).default([]),
  target_demographic: z.string().optional(),
  lives_improved: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  donations_received: z.number().optional(),
  amount_needed: z.number().optional(),
  currency: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number(), place_name: z.string() }),
}).refine(d => d.description || d.links.length > 0, {
  message: "Description or at least one link required",
  path: ["description"],
});

type FormValues = z.infer<typeof formSchema>;

export default function ProjectForm() {
  const router = useRouter();
  const [orgOptions, setOrgOptions] = useState<Option[]>([]);
  const [sdgOptions, setSdgOptions] = useState<Option[]>([]);
  const [ifrcOptions, setIfrcOptions] = useState<Option[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) as any, defaultValues: { links: [], partner_org_ids: [], sdg_ids: [], ifrc_ids: [], type_of_intervention: [], thematic_area: [], location: { lat: 0, lng: 0, place_name: "" } } as any });
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "links" });

  useEffect(() => {
    supabase.from("organisations").select("id,name").then(({ data }) => {
      setOrgOptions((data ?? []).map(o => ({ value: o.id, label: o.name })));
    });
    supabase.from("sdgs").select("id,name").then(({ data }) => {
      setSdgOptions((data ?? []).map(o => ({ value: String(o.id), label: o.name })));
    });
    supabase.from("ifrc_challenges").select("id,name").then(({ data }) => {
      setIfrcOptions((data ?? []).map(o => ({ value: String(o.id), label: o.name })));
    });
  }, []);

  async function onSubmit(values: FormValues) {
    const res = await fetch("/api/projects/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      console.error(await res.text());
      return;
    }
    const { id } = await res.json();
    if (files && files.length) {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("project-media").upload(path, file);
        if (!upErr) {
          await supabase.from("project_media").insert({ project_id: id, path, mime_type: file.type, caption: file.name });
        }
      }
    }
    router.push("/projects");
  }

  const location = watch("location");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input className="mt-1 w-full rounded border px-3 py-2" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea className="mt-1 w-full rounded border px-3 py-2" {...register("description")} />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Links</label>
        {fields.map((f, i) => (
          <div key={f.id} className="mb-2 flex gap-2">
            <input className="w-1/2 rounded border px-2 py-1" placeholder="URL" {...register(`links.${i}.url` as const)} />
            <input className="w-1/2 rounded border px-2 py-1" placeholder="Label" {...register(`links.${i}.label` as const)} />
            <button type="button" onClick={() => remove(i)} className="rounded border px-2">x</button>
          </div>
        ))}
        <button type="button" onClick={() => append({ url: "", label: "" })} className="rounded border px-3 py-1">Add Link</button>
      </div>
      <div>
        <label className="block text-sm font-medium">Lead Organisation</label>
        <select className="mt-1 w-full rounded border px-3 py-2" {...register("lead_org_id")}> 
          <option value="">Select...</option>
          {orgOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Partners</label>
        <MultiSelect options={orgOptions} value={watch("partner_org_ids")} onChange={v => setValue("partner_org_ids", v)} />
      </div>
      <div>
        <label className="block text-sm font-medium">SDGs</label>
        <MultiSelect options={sdgOptions} value={watch("sdg_ids").map(String)} onChange={v => setValue("sdg_ids", v.map(Number))} />
      </div>
      <div>
        <label className="block text-sm font-medium">IFRC Challenges</label>
        <MultiSelect options={ifrcOptions} value={watch("ifrc_ids").map(String)} onChange={v => setValue("ifrc_ids", v.map(Number))} />
      </div>
      <div>
        <label className="block text-sm font-medium">Location</label>
        <MapGeocoder onSelect={loc => setValue("location", loc)} />
        {location.place_name && <p className="mt-1 text-sm">{location.place_name}</p>}
        {errors.location && <p className="text-sm text-red-500">Location required</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Media</label>
        <input type="file" multiple onChange={e => setFiles(e.target.files)} />
      </div>
      <button type="submit" className="rounded border px-4 py-2">Submit</button>
    </form>
  );
}
