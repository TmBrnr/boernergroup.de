'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

type RevealTag = 'div' | 'li' | 'article' | 'span' | 'section';

/**
 * Scroll-triggered fade + rise. `as` exists so a reveal can be a real <li>
 * inside a list rather than an invalid <div> wrapper.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  once = true,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
  as?: RevealTag;
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  const Plain = as;

  if (reduced) return <Plain className={className}>{children}</Plain>;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-12% 0px -12% 0px' }}
      transition={{ duration: 0.95, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

export function RevealText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 1.05,
              delay: delay + index * 0.055,
              ease: EASE,
            }}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
