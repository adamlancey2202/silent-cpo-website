import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { projects } from "@/lib/projects";


export function SelectedWork() {
  return (
    <section id="work" aria-labelledby="work-heading" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
              SELECTED WORK
            </p>
            <h2 id="work-heading" className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-7xl">
              IDEAS, MADE REAL.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-mist/75">
            Custom storefronts, booking systems, and member platforms.
            A closer look at what I build.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project, index) => {
            const Card = project.url ? "a" : "div";
            return (
            <article key={project.image} className="group overflow-hidden rounded-2xl border border-mist/15 bg-midnight/30 transition-colors hover:border-gold/40">
              <Card
                href={project.url}
                target={project.url ? "_blank" : undefined}
                rel={project.url ? "noopener noreferrer" : undefined}
                aria-label={project.url ? `View ${project.name} website (opens in a new tab)` : undefined}
                className="block h-full focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold"
              >
                <div className="flex items-center justify-between border-b border-mist/10 px-5 py-3">
                  <span className="font-[family-name:var(--font-mono)] text-xs tracking-wider text-mist/65">
                    PROJECT / {String(index + 1).padStart(2, "0")}
                  </span>
                  {project.url && <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-gold transition-transform motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />}
                </div>
                <div className="aspect-video overflow-hidden border-b border-mist/10 bg-deep">
                  <Image
                    src={`/images/work/${project.image}.webp`}
                    alt={project.alt}
                    width={1280}
                    height={720}
                    sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1280px) calc((100vw - 80px) / 2), 600px"
                    className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
                  />
                </div>
                <div className="p-6 md:p-8">
                  <p className="mb-3 font-[family-name:var(--font-mono)] text-[11px] leading-relaxed tracking-[0.12em] text-gold">
                    {project.category}
                  </p>
                  <h3 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-bone md:text-4xl">
                    {project.name.toUpperCase()}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-mist/75">{project.description}</p>
                  <ul aria-label="Project features" className="mt-5 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li key={tag} className="rounded-full border border-mist/15 px-3 py-1 text-xs text-mist/75">{tag}</li>
                    ))}
                  </ul>
                  {project.url && <span className="mt-7 inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-gold">
                    VIEW WEBSITE <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </span>}
                </div>
              </Card>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
