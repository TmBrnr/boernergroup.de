'use client';

import { useDeferredValue, useMemo, useState, type ReactNode } from 'react';

import { ArticleCard } from '@/components/newsroom/ArticleCard';
import { fieldClass } from '@/components/ui/Field';
import type { SearchEntry } from '@/lib/articles';

/**
 * Client-side search over a small prebuilt index.
 * The full list is rendered on the server first, so this is purely additive
 * and the page works with JavaScript disabled.
 */
export function NewsroomSearch({ index, children }: { index: SearchEntry[]; children: ReactNode }) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    if (needle.length < 2) return null;
    const terms = needle.split(/\s+/);
    return index.filter((entry) => terms.every((term) => entry.haystack.includes(term)));
  }, [deferred, index]);

  return (
    <div>
      <div className="relative max-w-md">
        <label htmlFor="newsroom-search" className="sr-only">
          Search articles
        </label>
        <input
          id="newsroom-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the newsroom"
          className={`${fieldClass} pl-11`}
          role="searchbox"
          aria-describedby="newsroom-search-status"
        />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </div>

      <p id="newsroom-search-status" role="status" className="mt-3 text-[0.8125rem] text-faint">
        {results === null
          ? `${index.length} article${index.length === 1 ? '' : 's'}`
          : `${results.length} result${results.length === 1 ? '' : 's'} for “${deferred.trim()}”`}
      </p>

      {results === null ? (
        children
      ) : (
        results.length > 0 ? (
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((entry) => (
              <ArticleCard key={entry.slug} article={entry} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-[0.9375rem] text-bone/55">
            Nothing matched. Try a broader term: sovereignty, defence, trust.
          </p>
        )
      )}
    </div>
  );
}
