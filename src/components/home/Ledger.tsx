import Link from 'next/link';

import { ArrowRight } from '@/components/ui/Button';
import { RuleDraw, Wipe } from '@/components/ui/Motion';
import type { Milestone, Site } from '@/lib/types';

/**
 * Now and Before, as two registers. One line per entry, no prose.
 * Current work reads first and large; the earlier years are present, dated
 * and small. There, but not competing.
 */
export function Ledger({ site, milestones }: { site: Site; milestones: Milestone[] }) {
  const before = milestones
    .filter((m) => !m.years.startsWith('Since'))
    .sort((a, b) => Number(b.year) - Number(a.year));

  return (
    <section aria-labelledby="now-heading" className="border-t border-line/[0.06] py-20 sm:py-28">
      <div className="shell">
        <h2 id="now-heading" className="eyebrow">
          {site.now.eyebrow}
        </h2>

        <ul className="mt-9">
          {site.now.items.map((item, index) => {
            const inner = (
              <>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="wrap-safe text-d4 font-medium leading-[1.14] tracking-[-0.024em] text-bone">
                  {item.org}
                </span>
                <span className="text-[0.9375rem] text-bone/50">{item.role}</span>
                <span className="hidden text-right text-[0.9375rem] leading-snug text-bone/40 lg:block">
                  {item.note}
                </span>
              </>
            );

            const cls =
              'grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-5 gap-y-1 border-t border-line/[0.07] py-5 transition-colors duration-500 sm:grid-cols-[2.5rem_minmax(0,16rem)_minmax(0,1fr)] lg:grid-cols-[2.5rem_minmax(0,18rem)_minmax(0,14rem)_minmax(0,1fr)]';

            return (
              <Wipe as="li" key={item.org} delay={index * 0.05}>
                {item.href ? (
                  <Link href={item.href} className={`group ${cls} hover:border-line/25`}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </Wipe>
            );
          })}
        </ul>
        <RuleDraw />

        <div className="mt-20 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="eyebrow">{site.before.eyebrow}</h2>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-faint">
            {site.before.note}
          </p>
        </div>

        <ul className="mt-7">
          {before.map((milestone, index) => (
            <Wipe as="li" key={milestone.id} delay={index * 0.04}>
              <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-5 gap-y-1 border-t border-line/[0.07] py-3.5 sm:grid-cols-[6.5rem_minmax(0,14rem)_minmax(0,1fr)] sm:gap-x-8">
                <span className="whitespace-nowrap font-mono text-[0.6875rem] tracking-[0.06em] text-faint">
                  {milestone.years}
                </span>
                <span className="text-[0.9375rem] font-medium tracking-[-0.016em] text-bone/80">
                  {milestone.company}
                </span>
                <span className="col-start-2 text-[0.875rem] text-bone/45 sm:col-start-3">
                  {milestone.role}
                </span>
              </div>
            </Wipe>
          ))}
        </ul>
        <RuleDraw />

        <Link
          href="/about"
          className="link-draw group mt-9 inline-flex items-center gap-2 text-[0.9375rem] text-bone/70"
        >
          Full background
          <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
