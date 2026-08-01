import { Mark } from '@/components/ui/Logo';
import { cx } from '@/lib/utils';

/**
 * The Innoshare lockup, set in live type rather than an SVG wordmark,
 * so it stays crisp at any size and inherits the page colour.
 */
export function InnoshareLogo({
  className,
  size = 'md',
  kicker = 'Advisory · since 2012',
  showLegal = true,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  kicker?: string;
  showLegal?: boolean;
}) {
  const scale = {
    sm: { mark: 'h-5 w-5', word: 'text-[1rem]', legal: 'text-[0.5625rem]' },
    md: { mark: 'h-8 w-8', word: 'text-[1.6rem]', legal: 'text-[0.625rem]' },
    lg: { mark: 'h-12 w-12', word: 'text-[2.6rem]', legal: 'text-[0.6875rem]' },
  }[size];

  return (
    <span className={cx('inline-flex items-center gap-3.5', className)}>
      <Mark className={scale.mark} />
      <span className="flex flex-col">
        <span className={cx('font-medium leading-none tracking-[-0.032em]', scale.word)}>
          Innoshare
        </span>
        {showLegal ? (
          <span
            className={cx(
              'mt-1.5 font-mono uppercase leading-none tracking-[0.2em] text-steel/70',
              scale.legal,
            )}
          >
            {kicker}
          </span>
        ) : null}
      </span>
    </span>
  );
}
