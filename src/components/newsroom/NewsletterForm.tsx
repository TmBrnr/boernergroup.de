'use client';

import { useState } from 'react';

import { ArrowRight } from '@/components/ui/Button';
import { fieldClass } from '@/components/ui/Field';

const STATIC = process.env.NEXT_PUBLIC_STATIC === '1';

export function NewsletterForm({ compact }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;

    const form = event.currentTarget;
    const email = new FormData(form).get('email');

    if (STATIC) {
      window.location.href = `mailto:mail@boernergroup.de?subject=${encodeURIComponent(
        'Newsletter',
      )}&body=${encodeURIComponent(`Please add ${String(email)} to the newsletter.`)}`;
      setState('sent');
      form.reset();
      return;
    }

    setState('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, kind: 'newsletter' }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok: boolean;
        message?: string;
      } | null;
      if (!response.ok || !payload?.ok) throw new Error(payload?.message);
      setState('sent');
      form.reset();
    } catch {
      setState('error');
    }
  }

  return (
    <div className={compact ? '' : 'card p-8 sm:p-10'}>
      {!compact ? (
        <>
          <p className="eyebrow text-steel/70">Newsletter</p>
          <h2 className="mt-5 max-w-[24ch] text-d4 font-medium text-bone">
            New essays, sent when there is something worth saying.
          </h2>
          <p className="mt-3 max-w-[46ch] text-[0.9375rem] text-bone/55">
            Occasional notes on European technology, AI and company building. No cadence, no
            marketing, unsubscribe in one click.
          </p>
        </>
      ) : null}

      <form onSubmit={onSubmit} className={compact ? 'flex flex-col gap-3' : 'mt-7 flex flex-col gap-3 sm:flex-row'}>
        <label htmlFor={compact ? 'nl-email-compact' : 'nl-email'} className="sr-only">
          Email address
        </label>
        <input
          id={compact ? 'nl-email-compact' : 'nl-email'}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={`${fieldClass} sm:max-w-xs`}
        />
        <button
          type="submit"
          className="btn btn-primary group shrink-0"
          disabled={state === 'sending'}
          aria-busy={state === 'sending'}
        >
          {state === 'sending' ? 'Subscribing…' : state === 'sent' ? 'Request sent' : 'Subscribe'}
          <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
        </button>
      </form>

      {state === 'sent' ? (
        <p role="status" className="mt-3 text-[0.8125rem] text-steel">
          Your subscription request has been received.
        </p>
      ) : null}
      {state === 'error' ? (
        <p role="alert" className="mt-3 text-[0.8125rem] text-steel">
          That did not work. Please try again in a moment.
        </p>
      ) : null}
    </div>
  );
}
