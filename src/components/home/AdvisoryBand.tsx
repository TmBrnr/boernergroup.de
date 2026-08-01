import Link from 'next/link';

import { LeadershipPair } from '@/components/LeadershipPair';

import { ArrowRight } from '@/components/ui/Button';
import { InnoshareLogo } from '@/components/ui/InnoshareLogo';
import { LineReveal, RuleDraw, Wipe } from '@/components/ui/Motion';
import type { Innoshare, Person } from '@/lib/types';

/** One screen for the advisory. Four service names, one link, nothing else. */
export function AdvisoryBand({
  innoshare,
  people,
}: {
  innoshare: Innoshare;
  people: Person[];
}) {
  return (
    <section
      id="advisory"
      aria-labelledby="advisory-heading"
      className="scroll-mt-24 border-t border-line/[0.06] py-24 sm:py-32"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
          <div>
            <Wipe>
              <Link
                href="/innoshare"
                className="inline-block text-bone transition-opacity duration-500 hover:opacity-70"
              >
                <InnoshareLogo size="md" />
              </Link>
            </Wipe>

            <LineReveal
              as="h2"
              className="mt-10 max-w-[16ch] text-d2 font-medium text-gradient"
              lines={['The advisory', 'behind the companies.']}
            />

            <Wipe delay={0.15}>
              <p className="mt-7 max-w-measure text-lead text-bone/58">{innoshare.principle}</p>
              <Link href="/innoshare" className="btn btn-primary group mt-9">
                Advisory and company building
                <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
              </Link>
            </Wipe>

            <div className="mt-14 border-t border-line/[0.07] pt-8">
              <LeadershipPair people={people} heading="Who runs it" />
            </div>
          </div>

          <div className="lg:pt-4">
            <ol>
            {innoshare.services.map((service, index) => (
              <li key={service.id}>
                <RuleDraw delay={index * 0.07} />
                <Wipe delay={index * 0.07}>
                  <Link
                    href={`/innoshare#${service.id}`}
                    className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-4 py-6"
                  >
                    <span className="font-mono text-[0.6875rem] tracking-[0.16em] text-faint">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="wrap-safe text-d4 font-medium leading-[1.2] tracking-[-0.022em] text-bone/70 transition-colors duration-500 group-hover:text-bone">
                      {service.title}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 -rotate-45 text-bone/20 transition-all duration-500 ease-premium group-hover:rotate-0 group-hover:text-bone/70" />
                  </Link>
                </Wipe>
              </li>
            ))}
            </ol>
            <RuleDraw delay={0.3} />
          </div>
        </div>
      </div>
    </section>
  );
}
