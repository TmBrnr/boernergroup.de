import Link from 'next/link';

import { cx } from '@/lib/utils';

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const href = (target: number) => (target === 1 ? '/newsroom' : `/newsroom/page/${target}`);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="mt-20 flex items-center justify-between border-t border-line/[0.07] pt-8">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className="btn btn-ghost h-10 px-4 text-[0.8125rem]">
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" className="h-10 w-[5.5rem]" />
      )}

      <ol className="flex items-center gap-1.5">
        {pages.map((target) => (
          <li key={target}>
            <Link
              href={href(target)}
              aria-current={target === page ? 'page' : undefined}
              className={cx(
                'flex h-9 w-9 items-center justify-center rounded-full font-mono text-[0.75rem] transition-colors duration-500',
                target === page
                  ? 'bg-bone text-ink-deep'
                  : 'text-bone/50 hover:bg-line/[0.06] hover:text-bone',
              )}
            >
              {target}
            </Link>
          </li>
        ))}
      </ol>

      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className="btn btn-ghost h-10 px-4 text-[0.8125rem]">
          Next
        </Link>
      ) : (
        <span aria-hidden="true" className="h-10 w-[5.5rem]" />
      )}
    </nav>
  );
}
