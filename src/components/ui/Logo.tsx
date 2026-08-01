import { cx } from '@/lib/utils';

/** Innoshare aperture mark. Inherits colour, sized by className. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cx('h-6 w-6', className)}
    >
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M21.806 41.866A18 18 0 0 1 7.431 16.967" />
        <path d="M9.624 13.167A18 18 0 0 1 38.376 13.167" />
        <path d="M40.569 16.967A18 18 0 0 1 26.194 41.866" />
      </g>
    </svg>
  );
}

export function Wordmark({
  name,
  className,
  compact,
}: {
  name: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cx('flex items-center gap-2.5', className)}>
      <Mark className={compact ? 'h-5 w-5' : 'h-[1.4rem] w-[1.4rem]'} />
      <span className="text-[0.95rem] font-medium tracking-[-0.02em]">{name}</span>
    </span>
  );
}
