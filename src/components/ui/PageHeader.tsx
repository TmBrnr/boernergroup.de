import Link from 'next/link';
import type { ReactNode } from 'react';

import { Reveal } from '@/components/ui/Reveal';

export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
        {trail.map((item, index) => (
          <li key={item.path} className="flex items-center gap-2">
            {index < trail.length - 1 ? (
              <>
                <Link href={item.path} className="transition-colors hover:text-bone/70">
                  {item.name}
                </Link>
                <span aria-hidden="true" className="text-faint/50">
                  /
                </span>
              </>
            ) : (
              <span aria-current="page" className="text-bone/60">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  trail,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  trail?: { name: string; path: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="relative border-b border-line/[0.06] pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20 sm:pt-[calc(var(--nav-h)+7rem)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]"
        style={{
          background:
            'radial-gradient(70% 100% at 20% 0%, rgba(200,187,166,0.06) 0%, rgba(8,9,11,0) 68%)',
        }}
      />
      <div className="shell">
        {trail ? <Breadcrumbs trail={trail} /> : null}
        <Reveal y={12}>
          {eyebrow ? <p className="eyebrow mt-8 text-steel/75">{eyebrow}</p> : null}
          <h1 className="mt-5 max-w-[20ch] text-d1 font-medium text-gradient">{title}</h1>
          {intro ? (
            <p className="mt-7 max-w-measure text-lead pretty text-bone/58">{intro}</p>
          ) : null}
          {children}
        </Reveal>
      </div>
    </header>
  );
}
