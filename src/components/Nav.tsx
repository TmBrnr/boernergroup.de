'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Wordmark } from '@/components/ui/Logo';
import { cx } from '@/lib/utils';
import type { CtaLink } from '@/lib/types';

export function Nav({ name, nav }: { name: string; nav: CtaLink[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500',
        scrolled || open
          ? 'border-b border-line/[0.08] bg-ink/70 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <nav aria-label="Primary" className="shell flex h-[var(--nav-h)] items-center justify-between">
        <Link
          href="/"
          className="group -ml-1 rounded px-1 py-1 text-bone transition-opacity hover:opacity-70"
          aria-label={`${name}, home`}
        >
          <Wordmark name={name} />
        </Link>

        <ul className="hidden items-center gap-9 md:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="link-draw text-[0.875rem] text-bone/62 transition-colors hover:text-bone"
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/contact"
              className="btn btn-ghost h-9 px-4 text-[0.8125rem]"
            >
              Contact
            </Link>
          </li>
        </ul>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full md:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <span className="relative block h-3 w-5">
            <span
              className={cx(
                'absolute left-0 h-[1.5px] w-5 bg-bone transition-all duration-500 ease-premium',
                open ? 'top-1.5 rotate-45' : 'top-0',
              )}
            />
            <span
              className={cx(
                'absolute left-0 h-[1.5px] w-5 bg-bone transition-all duration-500 ease-premium',
                open ? 'top-1.5 -rotate-45' : 'top-3',
              )}
            />
          </span>
        </button>
      </nav>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line/[0.06] bg-ink/95 backdrop-blur-xl md:hidden"
      >
        <ul className="shell flex flex-col py-4">
          {[...nav, { label: 'Contact', href: '/contact' }].map((item) => (
            <li key={item.href} className="border-b border-line/[0.06] last:border-0">
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-4 text-[1.35rem] font-medium tracking-[-0.02em] text-bone"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
