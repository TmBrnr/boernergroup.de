import type { Metadata } from 'next';

import { EmailContact } from '@/components/EmailContact';
import { LeadershipPair } from '@/components/LeadershipPair';
import { JsonLd } from '@/components/ui/JsonLd';
import { InnoshareLogo } from '@/components/ui/InnoshareLogo';
import { Counter, LineReveal, RuleDraw, Wipe } from '@/components/ui/Motion';
import { Breadcrumbs } from '@/components/ui/PageHeader';
import { INNOSHARE, PEOPLE, SITE } from '@/lib/content';
import { breadcrumbSchema, graph, innoshareSchema } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Innoshare · Advisory and Company Building',
  description:
    'Innoshare is the advisory and company-building firm founded by Tobias Börner in 2012. Growth and performance, subscription and retention, company building, and go-to-market for deep tech selling into public institutions.',
  path: '/innoshare',
  keywords: [
    'Innoshare',
    'growth advisory',
    'company building',
    'subscription consulting',
    'go-to-market deep tech',
    'Tobias Börner advisory',
    'Tim Börner',
  ],
});

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Innoshare', path: '/innoshare' },
];

export default function InnosharePage() {
  return (
    <>
      {/* ---- Brand header ---- */}
      <header className="relative overflow-hidden border-b border-line/[0.06] pb-16 pt-[calc(var(--nav-h)+4rem)] sm:pb-20 sm:pt-[calc(var(--nav-h)+6rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]"
          style={{
            background:
              'radial-gradient(60% 100% at 18% 0%, rgba(154,162,172,0.07) 0%, rgba(8,9,11,0) 68%)',
          }}
        />
        <div className="shell">
          <Breadcrumbs trail={trail} />

          <div className="mt-10">
            <InnoshareLogo size="lg" />
          </div>

          <LineReveal
            as="h1"
            className="mt-12 max-w-[20ch] text-d1 font-medium text-gradient"
            lines={['The advisory', 'behind the companies.']}
            delay={0.15}
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
            <p className="text-lead pretty text-bone/62">{INNOSHARE.lede}</p>
            <div className="lg:pt-2">
              <RuleDraw delay={0.5} />
              <p className="mt-6 text-[0.9375rem] leading-relaxed text-bone/50">
                {INNOSHARE.principle}
              </p>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-bone/50">
                Founded by Tobias Börner in Dresden. Run by Tim Börner from Singapore.
              </p>
              <a href="#enquiry" className="btn btn-primary mt-8">
                Start a conversation
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Track record ---- */}
      <section aria-labelledby="record-heading" className="py-16 sm:py-20">
        <div className="shell">
          <h2 id="record-heading" className="sr-only">
            Track record
          </h2>
          <dl className="grid gap-px overflow-hidden rounded-card border border-line/[0.08] bg-line/[0.07] sm:grid-cols-2 lg:grid-cols-4">
            {INNOSHARE.record.map((item, index) => (
              <Wipe key={item.label} delay={index * 0.07} className="h-full">
                <div className="flex h-full flex-col justify-between gap-6 bg-ink p-7">
                  <dt className="eyebrow max-w-[22ch] text-faint">{item.label}</dt>
                  <dd className="text-d2 font-medium tracking-[-0.032em] text-bone">
                    {item.count ? <Counter to={item.value} /> : item.value}
                    <span className="text-steel">{item.suffix}</span>
                  </dd>
                </div>
              </Wipe>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- Services ---- */}
      <section aria-labelledby="services-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
        <div className="shell">
          <h2 id="services-heading" className="eyebrow">
            What we do
          </h2>

          <ol className="mt-12">
            {INNOSHARE.services.map((service, index) => (
              <li key={service.id} className="group">
                <RuleDraw delay={index * 0.06} />
                <Wipe delay={index * 0.06}>
                  <div className="grid gap-6 py-10 lg:grid-cols-[4rem_minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
                    <span className="font-mono text-[0.6875rem] tracking-[0.16em] text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-d3 font-medium tracking-[-0.028em] text-bone">
                        {service.title}
                      </h3>
                      <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-relaxed text-bone/55">
                        {service.body}
                      </p>
                    </div>
                    <ul className="flex flex-col gap-2.5 lg:pt-2">
                      {service.detail.map((line) => (
                        <li
                          key={line}
                          className="flex gap-3 text-[0.9375rem] leading-relaxed text-bone/45 transition-colors duration-500 group-hover:text-bone/65"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-steel/60"
                          />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Wipe>
              </li>
            ))}
          </ol>
          <RuleDraw />
        </div>
      </section>

      {/* ---- Who we work with + how ---- */}
      <section aria-labelledby="clients-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
        <div className="shell grid gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 id="clients-heading" className="eyebrow">
              {INNOSHARE.clients.eyebrow}
            </h2>
            <ul className="mt-8">
              {INNOSHARE.clients.items.map((item, index) => (
                <Wipe
                  key={item}
                  as="li"
                  delay={index * 0.05}
                  className="border-t border-line/[0.07] py-5 text-[1.0625rem] leading-snug tracking-[-0.018em] text-bone/70"
                >
                  {item}
                </Wipe>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">How we engage</h2>
            <dl className="mt-8">
              {INNOSHARE.engagements.map((engagement, index) => (
                <Wipe key={engagement.name} delay={index * 0.05} className="block">
                  <div className="border-t border-line/[0.07] py-5">
                    <dt className="text-[1.0625rem] font-medium tracking-[-0.02em] text-bone">
                      {engagement.name}
                    </dt>
                    <dd className="mt-1.5 max-w-[46ch] text-[0.9375rem] text-bone/50">
                      {engagement.detail}
                    </dd>
                  </div>
                </Wipe>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-line/[0.06] py-20 sm:py-28"><div className="shell"><LeadershipPair people={PEOPLE} heading="Who runs it" /></div></section>

      {/* ---- Enquiry ---- */}
      <section
        id="enquiry"
        aria-labelledby="enquiry-heading"
        className="scroll-mt-28 border-t border-line/[0.06] py-20 sm:py-28"
      >
        <div className="shell grid gap-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-24">
          <div>
            <p className="eyebrow text-steel">Enquiries</p>
            <h2 id="enquiry-heading" className="mt-5 max-w-[16ch] text-d2 font-medium text-gradient">
              Tell us what you are building.
            </h2>
            <p className="mt-6 max-w-measure text-[1.0625rem] leading-relaxed text-bone/55">
              Every enquiry reaches both of us at{' '}
              <a href={`mailto:${SITE.email}`} className="link-draw text-bone">
                {SITE.email}
              </a>
              . We answer within two business days, including the mandates we decline.
            </p>
          </div>
          <EmailContact
            email={SITE.email}
            kind="advisory"
          />
        </div>
      </section>

      <JsonLd id="innoshare-schema" json={graph(breadcrumbSchema(trail), ...innoshareSchema())} />
    </>
  );
}
