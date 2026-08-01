import type { ReactNode } from 'react';

import { cx } from '@/lib/utils';

const base =
  'w-full rounded-xl border border-line/[0.12] bg-line/[0.03] px-4 py-3 text-[0.9375rem] text-bone placeholder:text-faint/70 transition-colors duration-300 hover:border-line/20 focus:border-line/30 focus:bg-line/[0.05] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal/80';

export function Field({
  label,
  htmlFor,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-[0.8125rem] font-medium text-bone/70">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="text-[0.75rem] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const fieldClass = base;
