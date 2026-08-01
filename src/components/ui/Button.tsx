import Link from 'next/link';
import type { ReactNode } from 'react';

import { cx } from '@/lib/utils';

type Variant = 'primary' | 'ghost';

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className,
  external,
  ...rest
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>) {
  const classes = cx('btn', variant === 'primary' ? 'btn-primary' : 'btn-ghost', className);

  if (external || href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        className={classes}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cx('h-3.5 w-3.5', className)}
    >
      <path
        d="M2.5 8h11m0 0L9.5 4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
