import { redirect } from "next/navigation";

export const metadata = {
  title: "Environmental Projects",
};

export default async function EnvironmentalProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const focus = typeof params.focus === "string" ? params.focus : null;
  const nextParams = new URLSearchParams();
  nextParams.set("view", "globe");
  nextParams.set("type", "environmental");
  if (focus) {
    nextParams.set("focus", focus);
  }
  redirect(`/find-projects?${nextParams.toString()}`);
}
