import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArrowRight } from '@/components/ui/Button';
import { JsonLd } from '@/components/ui/JsonLd';
import { Breadcrumbs } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { COMPANIES, getCompany } from '@/lib/content';
import { breadcrumbSchema, companySchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMPANIES.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) return buildMetadata({ title: 'Not found', description: '', path: '/companies', noIndex: true });

  return buildMetadata({
    title: `${company.name} · ${company.role}`,
    description: company.summary,
    path: `/companies/${company.slug}`,
    image: company.cover,
    keywords: [company.name, company.category, 'Tobias Börner', 'European technology'],
  });
}

export default async function CompanyPage({ params }: Params) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  const index = COMPANIES.findIndex((c) => c.slug === slug);
  const next = COMPANIES[(index + 1) % COMPANIES.length];

  const trail = [
    { name: 'Home', path: '/' },
    { name: 'Companies', path: '/companies' },
    { name: company.name, path: `/companies/${company.slug}` },
  ];

  return (
    <>
      <article>
        <header className="relative border-b border-line/[0.06] pb-14 pt-[calc(var(--nav-h)+4rem)] sm:pt-[calc(var(--nav-h)+6rem)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]"
            style={{
              background: `radial-gradient(65% 100% at 25% 0%, rgba(${company.accent}, 0.09) 0%, rgba(8,9,11,0) 70%)`,
            }}
          />
          <div className="shell">
            <Breadcrumbs trail={trail} />

            <Reveal y={12}>
              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="relative block h-8 w-[9.5rem]">
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`}
                    fill
                    sizes="152px"
                    priority
                    className="object-contain object-left"
                  />
                </span>
                <span className="rounded-full border border-line/[0.12] px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-bone/55">
                  {company.category}
                </span>
              </div>

              <h1 className="mt-8 max-w-[22ch] text-d1 font-medium text-gradient">
                {company.tagline}
              </h1>

              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
                <div>
                  <dt className="eyebrow">Role</dt>
                  <dd className="mt-2 text-[0.9375rem] text-bone">{company.role}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Years</dt>
                  <dd className="mt-2 text-[0.9375rem] text-bone">{company.years}</dd>
                </div>
                {company.url ? (
                  <div>
                    <dt className="eyebrow">Website</dt>
                    <dd className="mt-2">
                      <a
                        href={company.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="link-draw text-[0.9375rem] text-bone"
                      >
                        {company.url.replace(/^https?:\/\//, '')}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </Reveal>
          </div>
        </header>

        <div className="shell py-16 sm:py-24">
          <Reveal>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-line/[0.08] bg-ink-raised">
              <Image
                src={company.cover}
                alt={`${company.name}: ${company.tagline}`}
                fill
                sizes="(max-width: 1024px) 100vw, 1280px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
            </div>
          </Reveal>

          <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-24">
            <div>
              <Reveal>
                <p className="text-lead pretty text-bone/78">{company.summary}</p>
              </Reveal>
              {company.story.map((paragraph, i) => (
                <Reveal key={i} delay={0.05 + i * 0.05}>
                  <p className="mt-7 text-[1.0625rem] leading-[1.72] tracking-[-0.011em] text-bone/58">
                    {paragraph}
                  </p>
                </Reveal>
              ))}
            </div>

            <aside className="flex flex-col gap-12">
              <Reveal delay={0.1}>
                <h2 className="eyebrow">Highlights</h2>
                <ul className="mt-6 flex flex-col gap-4">
                  {company.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3 text-[0.9375rem] leading-relaxed text-bone/62">
                      <span
                        aria-hidden="true"
                        className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-steel/70"
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.15}>
                <h2 className="eyebrow">At a glance</h2>
                <dl className="mt-6 divide-y divide-line/[0.07]">
                  {company.facts.map((fact) => (
                    <div key={fact.label} className="flex items-baseline justify-between gap-6 py-3.5 first:pt-0">
                      <dt className="text-[0.8125rem] text-faint">{fact.label}</dt>
                      <dd className="text-right text-[0.9375rem] text-bone">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </aside>
          </div>
        </div>

        <nav aria-label="More companies" className="border-t border-line/[0.06]">
          <Link
            href={`/companies/${next.slug}`}
            className="group block py-14 transition-colors duration-700 hover:bg-ink-raised sm:py-20"
          >
            <div className="shell flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-faint">Next</p>
                <p className="mt-3 text-d3 font-medium tracking-[-0.028em] text-bone">{next.name}</p>
              </div>
              <ArrowRight className="mb-3 h-5 w-5 text-bone/30 transition-all duration-500 ease-premium group-hover:translate-x-2 group-hover:text-bone" />
            </div>
          </Link>
        </nav>
      </article>

      <JsonLd
        id={`company-schema-${company.slug}`}
        json={graph(breadcrumbSchema(trail), companySchema(company.slug))}
      />
    </>
  );
}
