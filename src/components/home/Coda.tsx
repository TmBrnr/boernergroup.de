import Link from 'next/link';

import { ArrowRight } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import type { Site } from '@/lib/types';

/** The whole of "the rest of the site": four links and an email address. */
export function Coda({ site }: { site: Site }) {
  return (
    <section
      id="contact"
      aria-labelledby="coda-heading"
      className="border-t border-line/[0.06] py-24 sm:py-36"
    >
      <div className="shell">
        <Reveal>
          <p className="eyebrow text-steel/75">{site.coda.eyebrow}</p>
          <h2 id="coda-heading" className="mt-6 max-w-[26ch] text-d2 font-medium text-gradient">
            {site.coda.line}
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-24">
          <Reveal delay={0.06}>
            <ul className="border-t border-line/[0.07]">
              {site.coda.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-baseline justify-between gap-6 border-b border-line/[0.07] py-5 text-d4 font-medium leading-[1.2] tracking-[-0.022em] text-bone/70 transition-colors duration-500 hover:text-bone"
                  >
                    <span className="wrap-safe">{link.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 -rotate-45 text-bone/20 transition-all duration-500 ease-premium group-hover:rotate-0 group-hover:text-bone/70" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="flex flex-col items-start lg:items-end">
              <p className="eyebrow text-steel/75">Direct contact</p>
              <a
                href={`mailto:${site.email}`}
                className="link-draw wrap-safe mt-5 text-d4 font-medium tracking-[-0.024em] text-bone"
              >
                {site.email}
              </a>
              <div className="mt-5 flex flex-col gap-2 text-[0.875rem] leading-relaxed text-bone/50 lg:items-end">
                <p>
                  <span className="text-bone/75">Tobias Börner</span> · Dresden
                </p>
                <p>
                  <span className="text-bone/75">Tim Börner</span> · Singapore
                </p>
              </div>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent('Enquiry via boernergroup.de')}`}
                className="btn btn-ghost group mt-7"
              >
                Write an email
                <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
