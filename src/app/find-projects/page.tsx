import { redirect } from "next/navigation";

export default async function FindProjectsAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
    else if (Array.isArray(value)) for (const v of value) qs.append(key, v);
  }

  const queryString = qs.toString();
  redirect(queryString ? `/projects?${queryString}` : "/projects");
}
