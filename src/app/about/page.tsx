import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | Solarpunk Taskforce",
  description:
    "What Solarpunk Taskforce is, why it exists, and how the platform connects people, projects, and organisations to improve global impact.",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-soltas-ocean/30 bg-soltas-ocean/10 px-3 py-1 text-xs font-medium tracking-wide text-soltas-ocean">
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
    <section className="rounded-2xl border border-soltas-ocean/20 bg-soltas-ocean/5 p-6">
      <h3 className="mb-3 text-lg font-semibold text-soltas-abyssal">{title}</h3>
      <div className="text-sm leading-6 text-soltas-text">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="relative bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <div className="mb-4 flex flex-wrap gap-2">
            <Pill>Humanitarian</Pill>
            <Pill>Environmental</Pill>
            <Pill>Open Platform</Pill>
            <Pill>Global Community</Pill>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-soltas-abyssal sm:text-5xl">
            About Solarpunk Taskforce
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-soltas-text sm:text-base">
            A unifying force within the global humanitarian and environmental movement,
            connecting people, projects, and organisations to improve the coordination and
            effectiveness of global impact. By bridging the gap between action and awareness
            through transparent communication and creative media, we empower a global community
            to engage meaningfully in impact. With a bold, modern brand, we are reshaping how
            impact is seen, shared, and supported.
          </p>
        </header>

        {/* Intro banner */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-soltas-ocean/20 bg-soltas-ocean/5">
          <div className="p-6 sm:p-8">
            <p className="max-w-3xl text-sm text-soltas-text sm:text-base leading-7">
              The Solarpunk Taskforce platform is a living, transparent map and database of
              humanitarian and environmental efforts, paired with modern storytelling to bridge
              action and awareness. We address critical gaps in the impact sector through an
              accessible, community-driven digital platform.
            </p>
          </div>
        </div>

        {/* The Problems Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-soltas-abyssal sm:text-3xl">The Addressed Problems</h2>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            <Card title="Redundant and Fragmented Efforts">
              <p>
                Without a standardised platform for global humanitarian and environmental efforts,
                organisations struggle to identify where the greatest needs lie. This results in
                redundant initiatives, with multiple actors overlapping on the same issues and
                wasting resources. ST enhances efficiency by providing a clear overview of ongoing
                projects and indicating where resources should be allocated.
              </p>
            </Card>

            <Card title="Disconnected Stakeholders">
              <p>
                Countless organisations pursue shared goals in isolation, missing crucial synergies
                and opportunities. Smaller impact organisations often collapse due to their
                inability to find supporting entities. ST enables synergies by providing a clear
                overview of the organisations involved and their respective efforts.
              </p>
            </Card>

            <Card title="Declining Public Trust">
              <p>
                Limited transparency towards the public results in diminished trust, particularly
                with charities. ST connects people directly with projects and facilitates transparent
                coverage of initiatives, aiming to engage the public and increase trust through clear
                communication and thorough documentation.
              </p>
            </Card>

            <Card title="Lack of Central Platform">
              <p>
                Most digital infrastructure depicting humanitarian and environmental efforts is
                outdated, limited, or used internally, making it inaccessible to the public. This
                leads to reduced awareness and engagement. ST serves as the central point of
                information on global efforts, making them accessible to all.
              </p>
            </Card>

            <Card title="Lack of Community Voices">
              <p>
                Humanitarian action is largely determined by the biggest players, while countless
                smaller challenges affecting communities worldwide lack a platform. ST enables
                individuals to highlight local issues and connects advocates with larger players
                who have the resources to address them.
              </p>
            </Card>

            <Card title="Lack of Creativity">
              <p>
                The humanitarian and environmental sectors rely on emotional responses to tragedy.
                Creative content with proper storytelling is significantly lacking. ST seeks to
                become a centre for content that inspires, educates, and creatively conveys what
                humanity is and how anyone can participate in its development.
              </p>
            </Card>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            <Card title="The Vision">
              <p className="mb-4 font-medium">A world in which:</p>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Impact-driven organisations have a complete, real-time overview of global
                  humanitarian and environmental efforts, enabling synergy, effective cooperation,
                  and the application of proven solutions across contexts.
                </li>
                <li>
                  Individuals can transparently see where their support goes, engage meaningfully
                  with global efforts, and bring attention to overlooked issues through an
                  accessible and empowering platform.
                </li>
                <li>
                  Awareness of underrepresented global issues is elevated through creative, factual,
                  and meaningful content that restores trust in humanitarian work and deepens the
                  understanding of the state of humanity.
                </li>
              </ol>
            </Card>

            <Card title="The Mission">
              <p className="mb-4">
                The ST mission is twofold, tailored to impact-driven organisations and individuals:
              </p>
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <strong>For impact-driven organisations:</strong> Develop a transparent global
                  platform and living database that tracks humanitarian and environmental efforts—enabling
                  efficient cooperation, reducing redundant resource allocation, and improving
                  communication and implementation across initiatives.
                </li>
                <li>
                  <strong>For individuals:</strong> Bridge the gap between action and awareness
                  by generating creative, neutral, and transparent content on global issues—empowering
                  people to understand, trust, and meaningfully engage with humanitarian and
                  environmental efforts.
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Platform Features Section */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-soltas-abyssal sm:text-3xl">The Solution: The ST Platform</h2>
          <div className="grid grid-cols-1 gap-6 sm:gap-8">
            <Card title="Interactive Global Map">
              <p className="mb-3">
                An overview of global humanitarian and environmental projects through an interactive
                globe with filterable parameters.
              </p>
              <p className="font-medium mb-2">Outcomes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Improved visibility of and access to potential partners and collaborators</li>
                <li>Better identification of where resources are most needed</li>
                <li>Knowledge base of projects, problems, funding sources, and solutions</li>
                <li>Central platform for funders to find the right project to invest in</li>
                <li>Improved visibility and exposure for projects and smaller organisations</li>
                <li>Better public understanding of the impact world and meaningful engagement</li>
              </ul>
            </Card>

            <Card title="Communication Platform">
              <p className="mb-3">
                A platform with user-generated content to share updates on projects, impact-related
                news, and relevant multimedia.
              </p>
              <p className="font-medium mb-2">Outcomes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fostering a community of changemakers with a dedicated hub for information exchange</li>
                <li>Decentralised information network enabling voices from all changemakers</li>
                <li>Increased transparency and visibility of the impact world, accessible by all</li>
              </ul>
            </Card>

            <Card title="Watchdog Network">
              <p className="mb-3">
                A stage for advocates to bring attention to and fundraise for humanitarian and
                environmental issues in their area.
              </p>
              <p className="font-medium mb-2">Outcomes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Providing a voice to overlooked communities with niche issues</li>
                <li>Empowering advocates to raise funds and initiate change</li>
                <li>Connecting advocates to organisations with the right resources</li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Platform Pages Overview */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-soltas-abyssal sm:text-3xl">Platform Pages</h2>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card title="Home | Interactive Map">
              <p>
                Features the interactive globe with key statistics: number of projects, changemakers,
                organisations, total funding raised, lives improved, and issues implemented. Three
                views available: All Projects, Subscribed Projects, and Featured Projects.
              </p>
            </Card>

            <Card title="Find Projects">
              <p>
                Discover projects through an interactive globe or table view with advanced filtering:
                AI search, UN SDGs, IFRC challenges, demographics, intervention types, locations,
                organisations, and donation ranges. Includes a timeline to view historical data.
              </p>
            </Card>

            <Card title="Find Organisations">
              <p>
                Explore organisations with globe and table views, filtering by location, thematic
                areas, demographics, age, project count, and funding needs. Each organisation has
                a comprehensive profile with projects, metrics, and multimedia.
              </p>
            </Card>

            <Card title="Find Funding">
              <p>
                Accessible overview of active and upcoming funding opportunities supporting
                humanitarian and environmental action. Structured filters help match funding
                to real needs while improving visibility into resource flows.
              </p>
            </Card>

            <Card title="Feed">
              <p>
                Dedicated feed where projects and organisations post content—news articles,
                research, videos, podcasts, or images. Three views: popular posts, followed
                content, and Watchdog issues. Easy donation access for each project.
              </p>
            </Card>

            <Card title="Note Empathy">
              <p>
                The media branch of ST showcasing multimedia content (video series, podcasts,
                artwork), written works (news articles, commentaries, updates), and the ST
                store for branded merchandise.
              </p>
            </Card>

            <Card title="Services">
              <p>
                Comparative intelligence consulting services and marketing services for projects
                and organisations registered in the platform. Request services and learn more
                about how ST can support your impact work.
              </p>
              <Link
                href="/services"
                className="mt-3 inline-block text-sm font-medium text-soltas-ocean hover:underline"
              >
                Learn more about our services →
              </Link>
            </Card>

            <Card title="Watchdog Network">
              <p>
                Empowers advocates to create verified issues for their communities, raising
                awareness and funds for local humanitarian and environmental challenges that
                deserve attention and resources.
              </p>
              <Link
                href="/watchdog"
                className="mt-3 inline-block text-sm font-medium text-soltas-ocean hover:underline"
              >
                Explore watchdog issues →
              </Link>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-soltas-ocean/30 bg-gradient-to-r from-soltas-ocean/10 to-soltas-ocean/5 p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold text-soltas-abyssal">
              Join the Solarpunk Taskforce
            </h3>
            <p className="mt-1 text-sm text-soltas-text">
              Follow projects, add your initiative, or partner with us to make
              global impact more visible and effective.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-soltas-ocean px-4 py-2 text-sm font-semibold text-white transition hover:bg-soltas-ocean/90"
            >
              Explore projects <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-soltas-ocean/30 bg-soltas-ocean/10 px-4 py-2 text-sm font-semibold text-soltas-ocean transition hover:bg-soltas-ocean/20"
            >
              Partner with ST
            </Link>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-xs text-soltas-muted">
          Solarpunk Taskforce is building a modern, public platform for impact.
          Keep an eye on our roadmap and releases.
        </p>
      </div>
    </main>
  );
}
