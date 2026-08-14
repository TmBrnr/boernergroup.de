import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight } from '@/components/ui/Button';
import { LeadershipPair } from '@/components/LeadershipPair';
import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { COMPANIES, FAQ, FOCUS, PEOPLE, SITE, STORY, TIMELINE } from '@/lib/content';
import { breadcrumbSchema, faqSchema, graph, timSchema } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About',
  description:
    'Tobias Börner, technology entrepreneur, CEO and investor. From consumer tech and growth to health tech, AI, European sovereignty, defence and public safety.',
  path: '/about',
  type: 'profile',
});

const trail = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={STORY.headline}
        intro={SITE.intro}
        trail={trail}
      />

      {/* ---- The through-line ---- */}
      <section aria-labelledby="chain-heading" className="py-20 sm:py-28">
        <div className="shell lg:grid lg:grid-cols-[minmax(14rem,0.55fr)_minmax(0,1.45fr)] lg:gap-20 xl:gap-28">
          <Reveal className="mb-12 lg:mb-0">
            <figure className="overflow-hidden rounded-sm border border-line/[0.1] bg-ink-raised lg:sticky lg:top-28">
              <Image
                src="/media/portrait.jpg"
                alt="Tobias Börner"
                width={1200}
                height={1500}
                sizes="(min-width: 1280px) 24rem, (min-width: 1024px) 18rem, 100vw"
                className="aspect-[4/5] w-full object-cover object-top"
                priority
              />
            </figure>
          </Reveal>

          <div>
            <h2 id="chain-heading" className="eyebrow">
              {STORY.eyebrow}
            </h2>
            <ol className="mt-10">
              {STORY.steps.map((step, index) => (
                <Reveal
                  key={step.label}
                  delay={index * 0.04}
                  as="li"
                  className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-6 gap-y-2 border-t border-line/[0.07] py-7 transition-colors duration-500 hover:border-line/20 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-x-10"
                >
                  <span className="pt-1 font-mono text-[0.6875rem] tracking-[0.16em] text-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="min-w-0 break-words text-d4 font-medium tracking-[-0.022em] text-bone">
                    {step.label}
                  </h3>
                  <p className="col-start-2 min-w-0 max-w-[46ch] text-[0.9375rem] leading-relaxed text-bone/50 transition-colors duration-500 group-hover:text-bone/72 sm:pt-1.5">
                    {step.note}
                  </p>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={0.1}>
              <p className="mt-12 border-t border-line/[0.07] pt-10 text-d3 font-medium leading-[1.04] tracking-[-0.03em] text-bone/85 sm:max-w-[24ch]">
                {STORY.conclusion}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- Full timeline, long form ---- */}
      <section aria-labelledby="cv-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
        <div className="shell">
          <h2 id="cv-heading" className="eyebrow">
            {STORY.career.eyebrow}
          </h2>
          <ol className="mt-10">
            {[...TIMELINE].reverse().map((milestone, index) => (
              <Reveal
                key={milestone.id}
                delay={index * 0.04}
                as="li"
                className="grid gap-6 border-t border-line/[0.07] py-8 sm:grid-cols-[5rem_minmax(0,1fr)_14rem] sm:gap-10"
              >
                <span className="font-mono text-[0.75rem] text-faint">{milestone.years}</span>
                <div>
                  <h3 className="text-[1.0625rem] font-medium tracking-[-0.02em] text-bone">
                    {milestone.company}
                    <span className="text-bone/40"> · {milestone.role}</span>
                  </h3>
                  <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-bone/55">
                    {milestone.achievement}
                  </p>
                  {milestone.href ? (
                    <Link
                      href={milestone.href}
                      className="link-draw mt-4 inline-block text-[0.875rem] text-bone/70"
                    >
                      {milestone.company} in detail
                    </Link>
                  ) : null}
                </div>
                <span className="eyebrow sm:text-right">{milestone.chapter}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Current focus ---- */}
      <section aria-labelledby="focus-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
        <div className="shell">
          <h2 id="focus-heading" className="eyebrow">
            Current focus
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.07] sm:grid-cols-2 lg:grid-cols-3">
            {FOCUS.map((area, index) => (
              <li key={area.title}>
                <Reveal delay={index * 0.04} className="h-full">
                  <article className="group h-full bg-ink p-7 transition-colors duration-700 hover:bg-ink-raised">
                    <p className="eyebrow text-steel/70">{area.metric}</p>
                    <h3 className="mt-6 text-[1.0625rem] font-medium tracking-[-0.022em] text-bone">
                      {area.title}
                    </h3>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-bone/52 transition-colors duration-700 group-hover:text-bone/70">
                      {area.body}
                    </p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Companies ---- */}
      <section aria-labelledby="co-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="co-heading" className="eyebrow">
              Companies
            </h2>
            <Link
              href="/companies"
              className="link-draw group inline-flex items-center gap-2 text-[0.9375rem] text-bone/70"
            >
              Company index
              <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap items-center gap-x-12 gap-y-8">
            {COMPANIES.map((company) => (
              <li key={company.slug}>
                <Link
                  href={`/companies/${company.slug}`}
                  className="relative block h-7 w-[8.5rem] opacity-50 transition-opacity duration-700 hover:opacity-100"
                >
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`}
                    fill
                    sizes="136px"
                    className="object-contain object-left"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line/[0.06] py-20 sm:py-28"><div className="shell"><LeadershipPair people={PEOPLE} heading="Who runs Innoshare" /></div></section>

      {/* ---- FAQ: the GEO anchor ---- */}
      <section aria-labelledby="faq-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-20">
          <h2 id="faq-heading" className="eyebrow">
            {STORY.faq.eyebrow}
          </h2>
          <dl className="divide-y divide-line/[0.07]">
            {FAQ.map((entry) => (
              <div key={entry.question} className="py-7 first:pt-0">
                <dt className="text-[1.0625rem] font-medium tracking-[-0.02em] text-bone">
                  {entry.question}
                </dt>
                <dd className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-bone/55">
                  {entry.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <JsonLd id="about-schema" json={graph(breadcrumbSchema(trail), faqSchema(), timSchema())} />
    </>
  );
}
