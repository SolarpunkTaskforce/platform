import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabaseServer";

const linkSchema = z.object({ url: z.string().url(), label: z.string().optional() });
const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  lead_org_id: z.string().uuid().optional(),
  links: z.array(linkSchema).optional(),
  partner_org_ids: z.array(z.string().uuid()).optional(),
  sdg_ids: z.array(z.number()).optional(),
  ifrc_ids: z.array(z.number()).optional(),
  type_of_intervention: z.array(z.string()).optional(),
  thematic_area: z.array(z.string()).optional(),
  target_demographic: z.string().optional(),
  lives_improved: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  donations_received: z.number().optional(),
  amount_needed: z.number().optional(),
  currency: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number(), place_name: z.string() })
}).refine(d => d.description || (d.links && d.links.length > 0), {
  message: "Description or at least one link required",
  path: ["description"],
});

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const { location, links = [], partner_org_ids = [], sdg_ids = [], ifrc_ids = [], type_of_intervention = [], thematic_area = [], ...rest } = data;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      ...rest,
      lat: location.lat,
      lng: location.lng,
      place_name: location.place_name,
      type_of_intervention,
      thematic_area,
      status: "pending",
      created_by: user.id,
    })
    .select("id,status")
    .single();
  if (error || !project) {
    return NextResponse.json({ error: error?.message }, { status: 400 });
  }
  const projectId = project.id;

  const linkRows = links.map(l => ({ project_id: projectId, url: l.url, label: l.label }));
  if (linkRows.length) {
    const { error: linkErr } = await supabase.from("project_links").insert(linkRows);
    if (linkErr) {
      await supabase.from("projects").delete().eq("id", projectId);
      return NextResponse.json({ error: linkErr.message }, { status: 400 });
    }
  }
  if (partner_org_ids.length) {
    const { error: partnerErr } = await supabase.from("project_partners").insert(partner_org_ids.map(id => ({ project_id: projectId, organisation_id: id })));
    if (partnerErr) {
      await supabase.from("projects").delete().eq("id", projectId);
      return NextResponse.json({ error: partnerErr.message }, { status: 400 });
    }
  }
  if (sdg_ids.length) {
    const { error: sdgErr } = await supabase.from("project_sdgs").insert(sdg_ids.map(id => ({ project_id: projectId, sdg_id: id })));
    if (sdgErr) {
      await supabase.from("projects").delete().eq("id", projectId);
      return NextResponse.json({ error: sdgErr.message }, { status: 400 });
    }
  }
  if (ifrc_ids.length) {
    const { error: ifrcErr } = await supabase.from("project_ifrc_challenges").insert(ifrc_ids.map(id => ({ project_id: projectId, challenge_id: id })));
    if (ifrcErr) {
      await supabase.from("projects").delete().eq("id", projectId);
      return NextResponse.json({ error: ifrcErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id: projectId, status: project.status });
}
