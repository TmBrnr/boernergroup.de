import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight } from '@/components/ui/Button';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { COMPANIES, CURRENT_COMPANIES, PAST_COMPANIES } from '@/lib/content';
import { breadcrumbSchema, companySchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';
import type { Company } from '@/lib/types';

export const metadata: Metadata = buildMetadata({
  title: 'Companies',
  description: `The companies Tobias Börner has founded, led and scaled: ${COMPANIES.map((company) => company.name).join(', ')}.`,
  path: '/companies',
});

export default function CompaniesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Companies"
        title={`${COMPANIES.length} companies, one argument.`}
        intro="Consumer scale, health tech, then AI for defence and public safety. Each one taught the next."
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Companies', path: '/companies' },
        ]}
      />

      <section aria-labelledby="current-heading" className="py-20 sm:py-28">
        <div className="shell">
          <h2 id="current-heading" className="eyebrow">
            Currently building
          </h2>
          <div className="mt-10 flex flex-col gap-6">
            {CURRENT_COMPANIES.map((company, index) => (
              <Reveal key={company.slug} delay={index * 0.06}>
                <CompanyRow company={company} />
              </Reveal>
            ))}
          </div>

          <h2 className="eyebrow mt-24">Previously</h2>
          <div className="mt-10 flex flex-col gap-6">
            {PAST_COMPANIES.map((company, index) => (
              <Reveal key={company.slug} delay={index * 0.06}>
                <CompanyRow company={company} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <JsonLd
        id="companies-schema"
        json={graph(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Companies', path: '/companies' },
          ]),
          ...COMPANIES.map((company) => companySchema(company.slug)),
        )}
      />
    </>
  );
}

function CompanyRow({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="card group grid gap-6 p-6 sm:grid-cols-[13rem_minmax(0,1fr)_auto] sm:items-center sm:gap-10 sm:p-8"
    >
      <span className="relative block h-8 w-[9rem]">
        <Image
          src={company.logo}
          alt={`${company.name} logo`}
          fill
          sizes="144px"
          className="object-contain object-left opacity-60 transition-opacity duration-700 group-hover:opacity-100"
        />
      </span>

      <span className="flex flex-col gap-2">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[1.1875rem] font-medium tracking-[-0.022em] text-bone">
            {company.name}
          </span>
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
            {company.years}
          </span>
        </span>
        <span className="text-[0.9375rem] text-bone/55">
          {company.role} · {company.tagline}
        </span>
      </span>

      <ArrowRight className="hidden shrink-0 text-bone/25 transition-all duration-500 ease-premium group-hover:translate-x-1 group-hover:text-bone/70 sm:block" />
    </Link>
  );
}
