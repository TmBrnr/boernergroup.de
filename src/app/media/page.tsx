import type { Metadata } from 'next';

import { JsonLd } from '@/components/ui/JsonLd';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { AWARDS, MEDIA, SITE } from '@/lib/content';
import { breadcrumbSchema, graph } from '@/lib/schema';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Media',
  description:
    'Interviews, podcasts, television, articles and awards featuring Tobias Börner, on European technology, AI, defence and company building.',
  path: '/media',
});

const trail = [
  { name: 'Home', path: '/' },
  { name: 'Media', path: '/media' },
];

const ORDER = ['Interview', 'Podcast', 'TV', 'Article'];

export default function MediaPage() {
  const groups = ORDER.map((type) => ({
    type,
    items: MEDIA.filter((item) => item.type === type),
  })).filter((group) => group.items.length > 0);

  const other = MEDIA.filter((item) => !ORDER.includes(item.type));
  if (other.length > 0) groups.push({ type: 'Appearances', items: other });

  return (
    <>
      <PageHeader
        eyebrow="Media"
        title="Interviews, podcasts, press."
        intro="Where the work has been discussed publicly. For interview requests and press material, get in touch directly."
        trail={trail}
      >
        <p className="mt-8 text-[0.9375rem] text-bone/55">
          Press contact:{' '}
          <a href={`mailto:${SITE.email}`} className="link-draw text-bone">
            {SITE.email}
          </a>
        </p>
      </PageHeader>

      {groups.map((group) => (
        <section
          key={group.type}
          aria-labelledby={`media-${group.type.toLowerCase()}`}
          className="border-b border-line/[0.06] py-16 sm:py-20"
        >
          <div className="shell">
            <h2 id={`media-${group.type.toLowerCase()}`} className="eyebrow">
              {group.type}
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item, index) => (
                <li key={item.url}>
                  <Reveal delay={index * 0.05}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex h-full flex-col gap-5"
                    >
                      {/*
                        No stock photography here. The outlet is the visual:
                        set large, on a plain panel, which is honest and does
                        not go stale the way a borrowed press image does.
                      */}
                      <div className="frame relative flex aspect-[16/10] w-full flex-col justify-between overflow-hidden rounded-card border border-line/[0.08] bg-ink-raised p-6 transition-colors duration-700 group-hover:border-line/20">
                        <span className="eyebrow text-steel">{item.type}</span>
                        <span className="wrap-safe text-d3 font-medium leading-[1.04] tracking-[-0.03em] text-bone/85 transition-colors duration-700 group-hover:text-bone">
                          {item.outlet}
                        </span>
                      </div>
                      <div>
                        <p className="eyebrow flex items-center gap-3 text-faint">
                          <time dateTime={item.date}>{formatDate(item.date)}</time>
                        </p>
                        <h3 className="mt-3 text-[1.125rem] font-medium leading-[1.22] tracking-[-0.022em] text-bone">
                          {item.title}
                        </h3>
                        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-bone/50">
                          {item.summary}
                        </p>
                      </div>
                    </a>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {AWARDS.length > 0 ? (
        <section aria-labelledby="media-awards" className="py-16 sm:py-24">
          <div className="shell">
            <h2 id="media-awards" className="eyebrow">
              Awards &amp; recognition
            </h2>
            <ul className="mt-10">
              {AWARDS.map((award) => (
                <li
                  key={`${award.title}-${award.year}`}
                  className="grid grid-cols-[4rem_1fr] items-baseline gap-x-6 border-t border-line/[0.07] py-6 sm:grid-cols-[5rem_minmax(0,1fr)_16rem] sm:gap-x-10"
                >
                  <span className="font-mono text-[0.75rem] text-faint">{award.year}</span>
                  <span className="flex flex-col gap-1.5">
                    <span className="text-[1.0625rem] font-medium tracking-[-0.02em] text-bone">
                      {award.title}
                    </span>
                    <span className="text-[0.875rem] text-bone/45">{award.detail}</span>
                  </span>
                  <span className="col-start-2 text-[0.875rem] text-faint sm:col-start-3 sm:text-right">
                    {award.organisation}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <JsonLd id="media-schema" json={graph(breadcrumbSchema(trail))} />
    </>
  );
}
