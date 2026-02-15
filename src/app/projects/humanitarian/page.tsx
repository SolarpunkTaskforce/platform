import { redirect } from "next/navigation";

export const metadata = {
  title: "Humanitarian Projects",
};

export default async function HumanitarianProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const focus = typeof params.focus === "string" ? params.focus : null;
  const nextParams = new URLSearchParams();
  nextParams.set("view", "globe");
  nextParams.set("type", "humanitarian");
  if (focus) {
    nextParams.set("focus", focus);
  }
  redirect(`/projects?${nextParams.toString()}`);
}
