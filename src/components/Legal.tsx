import type { ReactNode } from 'react';

/** A two column key/value row, used for register data. */
export function LegalRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-t border-line/[0.07] py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="wrap-safe text-[0.9375rem] text-bone sm:max-w-[34rem] sm:text-right">
        {children}
      </dd>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line/[0.07] py-9">
      <h2 className="text-[1.0625rem] font-medium tracking-[-0.02em] text-bone">{title}</h2>
      <div className="mt-4 flex max-w-[68ch] flex-col gap-4 text-[0.9375rem] leading-relaxed text-bone/60 [&_a]:text-bone [&_a]:underline [&_a]:decoration-signal/60 [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-bone/85">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-steel/60"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The three legal pages always point at each other. */
export function LegalNav({ current }: { current: 'impressum' | 'datenschutz' | 'barrierefreiheit' }) {
  const items = [
    { href: '/impressum', label: 'Impressum' },
    { href: '/datenschutz', label: 'Datenschutz' },
    { href: '/barrierefreiheit', label: 'Barrierefreiheit' },
  ];

  return (
    <nav aria-label="Legal" className="mt-10 flex flex-wrap gap-2">
      {items.map((item) => {
        const active = item.href === `/${current}`;
        return (
          <a
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'rounded border border-transparent bg-bone px-3.5 py-1.5 text-[0.8125rem] font-medium text-ink-deep'
                : 'rounded border border-line/[0.12] px-3.5 py-1.5 text-[0.8125rem] text-bone/60 transition-colors duration-500 hover:border-line/25 hover:text-bone'
            }
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
