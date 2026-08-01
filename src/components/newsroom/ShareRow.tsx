'use client';

import { useState } from 'react';

export function ShareRow({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'X',
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <span className="eyebrow text-faint">Share</span>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="link-draw text-[0.875rem] text-bone/60 transition-colors hover:text-bone"
            >
              {link.label}
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={copy}
            className="link-draw text-[0.875rem] text-bone/60 transition-colors hover:text-bone"
          >
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </li>
      </ul>
    </div>
  );
}
