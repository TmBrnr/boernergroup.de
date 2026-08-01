'use client';

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { cx } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;
const DEFAULT_COUNTER_FORMAT = (value: number) => String(Math.round(value));

/**
 * Headline reveal: each line sits in its own overflow-hidden band and slides up.
 * Lines are declared explicitly rather than measured, so nothing reflows.
 */
export function LineReveal({
  lines,
  className,
  delay = 0,
  stagger = 0.08,
  as: Tag = 'span',
}: {
  lines: string[];
  className?: string;
  delay?: number;
  stagger?: number;
  as?: 'span' | 'h1' | 'h2' | 'p';
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <Tag className={className}>{lines.join(' ')}</Tag>;
  }

  return (
    <Tag className={className}>
      {lines.map((line, index) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block will-change-transform"
            initial={{ y: '108%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.15, delay: delay + index * stagger, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/** A hairline that draws in from the left when it enters view. */
export function RuleDraw({ className, delay = 0 }: { className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();

  return (
    <span ref={ref} className={cx('block h-px w-full bg-line/[0.1]', className)}>
      <motion.span
        className="block h-px origin-left bg-line/30"
        initial={reduced ? false : { scaleX: 0 }}
        animate={inView || reduced ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.2, delay, ease: EASE }}
      />
    </span>
  );
}

/**
 * A figure that counts up once, in view.
 * Formatting stays in the caller so "50M+" and "2012" both work.
 */
export function Counter({
  to,
  from = 0,
  duration = 1.6,
  format = DEFAULT_COUNTER_FORMAT,
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduced = useReducedMotion();
  const [text, setText] = useState(() => format(reduced ? to : from));
  const displayText = reduced ? format(to) : text;

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setText(format(value)),
    });
    return () => controls.stop();
  }, [inView, reduced, from, to, duration, format]);

  return (
    <span ref={ref} className={cx('tabular-nums', className)}>
      {displayText}
    </span>
  );
}

/** Hairline reading progress across the top of the document. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 40, mass: 0.4 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-signal/70"
    />
  );
}

/**
 * Elements enter with a clip wipe rather than a fade. It reads as a shutter
 * opening, which suits the instrumentation language better than a dissolve.
 */
export function Wipe({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'article' | 'span';
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  const Plain = as;

  if (reduced) return <Plain className={className}>{children}</Plain>;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 1.05, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/** Slow vertical drift as the element passes the viewport. Subtle by design. */
export function Parallax({
  children,
  distance = 40,
  className,
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Digits that roll over instead of swapping. Used for the career odometer index. */
export function Odometer({ value, className }: { value: number; className?: string }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(value);

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.55, ease: EASE });
    return () => controls.stop();
  }, [value, mv, reduced]);

  const text = useTransform(mv, (v) => String(Math.round(v)).padStart(2, '0'));
  return <motion.span className={cx('tabular-nums', className)}>{text}</motion.span>;
}
