import Image from 'next/image';

import { Wipe } from '@/components/ui/Motion';
import type { Person } from '@/lib/types';

/**
 * The only place people appear. Name, role, where they sit, and how to reach
 * them, all in one row each. Tobias carries the site; Innoshare is run by both
 * of them, and a managing director should not be a footnote.
 */
export function LeadershipPair({
  people,
  heading = 'Who runs it',
}: {
  people: Person[];
  heading?: string;
}) {
  return (
    <div>
      <h2 className="eyebrow">{heading}</h2>
      <ul className="mt-7 grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {people.map((person, index) => (
          <Wipe as="li" key={person.slug} delay={index * 0.07}>
            <div className="flex items-start gap-4">
              {/* A monogram beats a stand-in photograph of somebody else. */}
              <span className="relative h-[4.25rem] w-14 shrink-0 overflow-hidden rounded-sm border border-line/[0.1] bg-ink-raised">
                {person.image ? (
                  <Image
                    src={person.image}
                    alt={`${person.name}, ${person.role} at ${person.org}`}
                    fill
                    sizes="56px"
                    className="object-cover grayscale transition-[filter] duration-700 hover:grayscale-0"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center font-mono text-[0.8125rem] tracking-[0.08em] text-steel/70"
                  >
                    {person.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </span>
                )}
              </span>

              <div className="min-w-0">
                <p className="text-[1.0625rem] font-medium tracking-[-0.02em] text-bone">
                  {person.name}
                </p>
                <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-steel">
                  {person.role}
                </p>
                <p className="mt-1 text-[0.8125rem] text-faint">{person.location}</p>

                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem]">
                  {person.website ? (
                    <a
                      href={person.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link-draw text-bone/70 transition-colors hover:text-bone"
                    >
                      Website
                    </a>
                  ) : null}
                  {person.linkedin ? (
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link-draw text-bone/70 transition-colors hover:text-bone"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                  <a
                    href={`mailto:${person.email}`}
                    className="link-draw wrap-safe text-bone/70 transition-colors hover:text-bone"
                  >
                    Email
                  </a>
                </p>
              </div>
            </div>
          </Wipe>
        ))}
      </ul>
    </div>
  );
}
