import type { Metadata } from 'next';
import Link from 'next/link';

import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { JsonLd } from '@/components/ui/JsonLd';
import { Breadcrumbs } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { SITE } from '@/lib/content';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description: 'Contact Tobias and Tim Börner directly by email or LinkedIn.',
  path: '/contact',
});

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Contact', path: '/contact' },
];

const emailHref = `mailto:${SITE.email}?subject=${encodeURIComponent(
  'Enquiry via boernergroup.de',
)}&body=${encodeURIComponent(
  'Hello Tobias and Tim,\n\nI am writing about:\n\nName:\nOrganisation:',
)}`;

const contactDetails = [
  {
    number: '01',
    label: 'Email',
    value: SITE.email,
    note: 'The fastest route for advisory, investment, speaking and press.',
    href: emailHref,
    span: 'md:col-span-3',
  },
  {
    number: '02',
    label: 'Tobias Börner',
    value: 'LinkedIn',
    note: 'Technology companies · Dresden, Germany',
    href: SITE.social[0].href,
    span: 'md:col-span-3',
  },
  {
    number: '03',
    label: 'Tim Börner',
    value: 'LinkedIn',
    note: 'Innoshare · Singapore',
    href: SITE.social[1].href,
    span: 'md:col-span-2',
  },
  {
    number: '04',
    label: 'Advisory',
    value: 'Innoshare',
    note: 'Growth, company building and market entry.',
    href: '/innoshare',
    span: 'md:col-span-2',
  },
  {
    number: '05',
    label: 'Based in',
    value: 'Dresden · Singapore',
    note: 'Working across Europe and Asia-Pacific.',
    href: null,
    span: 'md:col-span-2',
  },
];

export default function ContactPage() {
  return (
    <>
      <header className="relative overflow-hidden border-b border-line/[0.06] pb-20 pt-[calc(var(--nav-h)+4rem)] sm:pb-28 sm:pt-[calc(var(--nav-h)+6rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem]"
          style={{
            background:
              'radial-gradient(58% 100% at 78% 0%, rgba(154,162,172,0.08) 0%, rgba(8,9,11,0) 70%)',
          }}
        />
        <div className="shell">
          <Breadcrumbs trail={trail} />
          <Reveal>
            <p className="eyebrow mt-10 text-steel">Contact</p>
            <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)] lg:items-end lg:gap-20">
              <h1 className="max-w-[12ch] text-d1 font-medium leading-[0.94] tracking-[-0.055em] text-gradient">
                Start with an email.
              </h1>
              <div className="flex flex-col items-start border-l border-line/[0.1] pl-6 sm:pl-8">
                <p className="max-w-[38ch] text-[1.0625rem] leading-relaxed text-bone/60">
                  One address reaches Tobias in Dresden and Tim in Singapore. Add the context that
                  matters; expect a reply within two business days.
                </p>
                <ButtonLink href={emailHref} className="group mt-7">
                  Write to Tobias &amp; Tim
                  <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>
      </header>

      <section aria-labelledby="details-heading" className="py-20 sm:py-28">
        <div className="shell">
          <Reveal>
            <div className="grid gap-6 border-b border-line/[0.08] pb-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <p className="eyebrow text-steel/75">Direct channels</p>
              <div>
                <h2 id="details-heading" className="text-d3 font-medium tracking-[-0.035em] text-bone">
                  One address. Two locations.
                </h2>
                <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-bone/50">
                  Choose the route that fits. Email is best when the conversation needs context.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10 grid overflow-hidden rounded-2xl border border-line/[0.08] bg-line/[0.08] md:grid-cols-6">
              {contactDetails.map((detail) => (
                <ContactDetail key={detail.number} {...detail} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <JsonLd id="contact-schema" json={graph(breadcrumbSchema(trail))} />
    </>
  );
}

function ContactDetail({
  number,
  label,
  value,
  note,
  href,
  span,
}: {
  number: string;
  label: string;
  value: string;
  note: string;
  href: string | null;
  span: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[0.625rem] tracking-[0.16em] text-faint">{number}</span>
        {href ? (
          <ArrowRight className="h-3.5 w-3.5 -rotate-45 text-bone/20 transition-all duration-500 group-hover:rotate-0 group-hover:text-bone/70" />
        ) : (
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-steel/40" />
        )}
      </div>
      <p className="eyebrow mt-10 text-steel/70">{label}</p>
      <p className="wrap-safe mt-3 text-[1.25rem] font-medium tracking-[-0.025em] text-bone">
        {value}
      </p>
      <p className="mt-3 max-w-[32ch] text-[0.8125rem] leading-relaxed text-bone/45">{note}</p>
    </>
  );
  const className = `group min-h-52 border-b border-r border-line/[0.08] bg-ink p-7 transition-colors duration-500 hover:bg-bone/[0.025] sm:p-8 md:min-h-64 ${span}`;

  if (!href) return <div className={className}>{content}</div>;
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
      {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener me' } : {})}
    >
      {content}
    </a>
  );
}
