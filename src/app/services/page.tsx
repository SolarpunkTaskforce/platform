import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Megaphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Services | Solarpunk Taskforce",
  description:
    "Comparative intelligence consulting and marketing services for impact-driven projects and organisations.",
};

function ServiceCard({
  icon,
  title,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="rounded-2xl border border-soltas-ocean/20 bg-white p-8 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-soltas-ocean/10 text-soltas-ocean">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-soltas-abyssal">{title}</h3>
      <p className="mb-6 text-sm leading-6 text-soltas-text">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-soltas-text">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-soltas-ocean" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <main className="relative bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        {/* Header */}
        <header className="mb-12 sm:mb-16">
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full border border-soltas-ocean/30 bg-soltas-ocean/10 px-3 py-1 text-xs font-medium tracking-wide text-soltas-ocean">
              Professional Services
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-soltas-abyssal sm:text-5xl">
            Services for Impact Organisations
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-soltas-text sm:text-base">
            Solarpunk Taskforce offers specialized services to help projects and organisations
            registered on our platform maximize their impact, visibility, and strategic positioning
            in the humanitarian and environmental sectors.
          </p>
        </header>

        {/* Services Grid */}
        <div className="mb-16 grid gap-8 md:grid-cols-2">
          <ServiceCard
            icon={<BarChart3 size={24} />}
            title="Comparative Intelligence Consulting"
            description="Data-driven insights to help your organisation understand the competitive landscape, identify opportunities for collaboration, and apply proven solutions from similar initiatives worldwide."
            features={[
              "Comprehensive sector analysis and benchmarking against similar projects",
              "Identification of potential partners and collaboration opportunities",
              "Insights on proven solutions and best practices from related initiatives",
              "Gap analysis to identify underserved areas and funding opportunities",
              "Strategic recommendations for resource allocation and impact optimization",
              "Access to platform data and analytics on global humanitarian and environmental efforts",
            ]}
          />

          <ServiceCard
            icon={<Megaphone size={24} />}
            title="Project-Centered Marketing Services"
            description="Strategic marketing and storytelling services designed to increase visibility, build trust, and drive engagement for your projects through modern, creative communication."
            features={[
              "Project narrative development and compelling storytelling",
              "Content creation: articles, videos, podcasts, and visual media",
              "Social media strategy and management for your initiatives",
              "Donor engagement campaigns to increase funding and support",
              "Brand positioning within the impact sector",
              "Community building and awareness campaigns tailored to your mission",
            ]}
          />
        </div>

        {/* Why Choose ST Services Section */}
        <section className="mb-16 rounded-2xl border border-soltas-ocean/20 bg-soltas-ocean/5 p-8">
          <h2 className="mb-6 text-2xl font-bold text-soltas-abyssal">
            Why Choose ST Services?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold text-soltas-abyssal">
                Platform Integration
              </h3>
              <p className="text-sm text-soltas-text">
                Leverage our comprehensive database of global humanitarian and environmental
                projects for unparalleled strategic insights.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-soltas-abyssal">
                Impact-Focused Expertise
              </h3>
              <p className="text-sm text-soltas-text">
                Our team specializes in the humanitarian and environmental sectors, understanding
                the unique challenges and opportunities you face.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-soltas-abyssal">
                Creative Storytelling
              </h3>
              <p className="text-sm text-soltas-text">
                Move beyond crisis-driven narratives with modern, inspiring content that builds
                trust and deepens engagement with your mission.
              </p>
            </div>
          </div>
        </section>

        {/* Who Benefits Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-soltas-abyssal">
            Who Can Benefit from Our Services?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "NGOs & NPOs",
                description:
                  "Established organisations seeking to optimize operations and expand their reach.",
              },
              {
                title: "New Projects",
                description:
                  "Emerging initiatives looking for strategic guidance and visibility in a crowded sector.",
              },
              {
                title: "Funding Bodies",
                description:
                  "Donors and grantmakers seeking data-driven insights for informed investment decisions.",
              },
              {
                title: "Social Enterprises",
                description:
                  "Impact-driven businesses needing market intelligence and strategic positioning.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-soltas-ocean/20 bg-white p-6"
              >
                <h3 className="mb-2 font-semibold text-soltas-abyssal">{item.title}</h3>
                <p className="text-sm text-soltas-text">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-soltas-abyssal">Our Process</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Initial Consultation",
                description:
                  "We discuss your goals, challenges, and needs to determine the best service approach.",
              },
              {
                step: "2",
                title: "Custom Strategy",
                description:
                  "Our team develops a tailored plan leveraging platform data and industry expertise.",
              },
              {
                step: "3",
                title: "Implementation & Support",
                description:
                  "We work with you to execute the strategy and provide ongoing support for sustained impact.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-soltas-ocean text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-soltas-abyssal">{item.title}</h3>
                <p className="text-sm text-soltas-text">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="rounded-2xl border border-soltas-ocean/30 bg-gradient-to-r from-soltas-ocean/10 to-soltas-ocean/5 p-8">
          <div className="mb-6">
            <h2 className="mb-3 text-2xl font-bold text-soltas-abyssal">
              Ready to Amplify Your Impact?
            </h2>
            <p className="text-sm text-soltas-text">
              Whether you need strategic insights or want to elevate your project&apos;s
              visibility, our services are designed to help you achieve your mission more
              effectively. Get in touch to discuss how we can support your work.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-soltas-ocean px-6 py-3 text-sm font-semibold text-white transition hover:bg-soltas-ocean/90"
            >
              Request a Consultation <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-xl border border-soltas-ocean/30 bg-white px-6 py-3 text-sm font-semibold text-soltas-ocean transition hover:bg-soltas-ocean/10"
            >
              Learn More About ST
            </Link>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-xs text-soltas-muted">
          Services are available exclusively to registered organisations and projects on the
          Solarpunk Taskforce platform. Registration is free and open to all verified
          humanitarian and environmental initiatives.
        </p>
      </div>
    </main>
  );
}

