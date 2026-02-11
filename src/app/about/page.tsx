import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About | Solarpunk Taskforce",
  description:
    "What Solarpunk Taskforce is, why it exists, and how the platform connects people, projects, and organisations to improve global impact.",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
      {children}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
      <div className="text-sm leading-6 text-white/80">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="relative">
      {/* Gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_60%_at_30%_20%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(60%_60%_at_70%_40%,rgba(16,185,129,0.28),transparent_60%),linear-gradient(180deg,#0b1220,rgba(3,7,18,0.9))]"
      />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <div className="mb-4 flex flex-wrap gap-2">
            <Pill>Humanitarian</Pill>
            <Pill>Environmental</Pill>
            <Pill>Open Platform</Pill>
            <Pill>Global Community</Pill>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            About Solarpunk Taskforce
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
            A unifying force in the global humanitarian and environmental
            movement. We connect people, projects, and organisations and make
            impact visible, trustworthy, and actionable.
          </p>
        </header>

        {/* Intro banner */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-white/10">
          <div className="relative h-44 w-full sm:h-60">
            <Image
              src="/og/gradient-green-blue.png"
              alt=""
              fill
              className="object-cover opacity-70"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="max-w-3xl text-sm text-white/90 sm:text-base">
                The Solarpunk Taskforce platform is a living, transparent map
                and database of humanitarian and environmental efforts, paired
                with modern storytelling to bridge action and awareness.
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          <Card title="What ST Is">
            <p>
              Solarpunk Taskforce is an independent organisation and platform
              built to improve the efficiency, effectiveness, and visibility of
              global impact work. We surface real projects, share verifiable
              updates, and enable participation.
            </p>
          </Card>

          <Card title="The Platform">
            <ul className="list-disc pl-5">
              <li>Interactive world map of projects and issues.</li>
              <li>Open profiles for projects and organisations.</li>
              <li>Neutral, factual updates and creative media.</li>
              <li>Filters, search, subscriptions, and donations.</li>
              <li>Community input with verification pathways.</li>
            </ul>
          </Card>

          <Card title="Mission">
            <ol className="list-decimal pl-5">
              <li className="mb-2">
                For organisations: provide a transparent, living database to
                track efforts, coordinate, and apply proven solutions.
              </li>
              <li>
                For individuals: bridge action and awareness with creative,
                neutral, and transparent content that empowers meaningful
                engagement.
              </li>
            </ol>
          </Card>

          <Card title="Vision">
            <ul className="list-disc pl-5">
              <li>
                A complete, real-time overview of humanitarian and environmental
                work enables synergy and effective cooperation.
              </li>
              <li>
                People can see where support goes and surface overlooked issues
                through an accessible platform.
              </li>
              <li>
                Modern, factual storytelling restores trust and deepens
                understanding of the state of humanity.
              </li>
            </ul>
          </Card>

          <Card title="Why It Matters">
            <ul className="list-disc pl-5">
              <li>Reduces redundant and fragmented efforts.</li>
              <li>Improves transparency and public trust.</li>
              <li>Connects stakeholders for better outcomes.</li>
              <li>Invites participation beyond sector insiders.</li>
            </ul>
          </Card>

          <Card title="Values">
            <ul className="flex flex-wrap gap-2">
              {[
                "Transparency",
                "Neutrality",
                "Participation",
                "Creativity",
                "Open access",
                "Effectiveness",
              ].map((v) => (
                <li
                  key={v}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90"
                >
                  {v}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="For Organisations">
            <ul className="list-disc pl-5">
              <li>Verified org accounts with unlimited project input.</li>
              <li>
                Upload metrics, development reports, and relevant media per
                project.
              </li>
              <li>
                Optional services: comparative intelligence consulting and
                project-centred marketing.
              </li>
            </ul>
          </Card>

          <Card title="For Individuals">
            <ul className="list-disc pl-5">
              <li>Explore projects without an account.</li>
              <li>Subscribe to follow developments.</li>
              <li>Create community points to flag local issues.</li>
              <li>Request verification and collect donations where eligible.</li>
            </ul>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/30 to-sky-600/30 p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Join the Solarpunk Taskforce
            </h3>
            <p className="mt-1 text-sm text-white/80">
              Follow projects, add your initiative, or partner with us to make
              global impact more visible and effective.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/find-projects"
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-white"
            >
              Explore projects <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Partner with ST
            </Link>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-xs text-white/60">
          Solarpunk Taskforce is building a modern, public platform for impact.
          Keep an eye on our roadmap and releases.
        </p>
      </div>
    </main>
  );
}
