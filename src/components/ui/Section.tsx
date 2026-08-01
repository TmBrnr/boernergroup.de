import type { ReactNode } from 'react';

import { cx } from '@/lib/utils';

export function Section({
  id,
  children,
  className,
  as: Tag = 'section',
  label,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
  label?: string;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={label}
      className={cx('relative py-24 sm:py-32 lg:py-40', className)}
    >
      {children}
    </Tag>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  intro,
  id,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: string;
  id?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <header
      className={cx(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="text-d2 balance font-medium text-gradient max-w-[22ch]">
        {title}
      </h2>
      {intro ? (
        <p className="text-lead pretty max-w-measure text-bone/60">{intro}</p>
      ) : null}
    </header>
  );
}
