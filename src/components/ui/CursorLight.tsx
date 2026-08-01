'use client';

import { useEffect, useRef } from 'react';

/**
 * A single soft light source that follows the pointer.
 * Pure transform work on one fixed layer. No re-renders, no layout thrash.
 * Disabled for touch input and for prefers-reduced-motion.
 */
export function CursorLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (reduced || !fine) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.35;
    let x = targetX;
    let y = targetY;
    let frame = 0;
    let visible = false;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        visible = true;
        el.style.opacity = '1';
      }
    };

    const loop = () => {
      x += (targetX - x) * 0.075;
      y += (targetY - y) * 0.075;
      el.style.transform = `translate3d(${x - 380}px, ${y - 380}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[760px] w-[760px] opacity-0 transition-opacity duration-1000 will-change-transform"
      style={{
        background:
          'radial-gradient(circle, rgba(200,187,166,0.055) 0%, rgba(122,156,255,0.028) 38%, rgba(0,0,0,0) 68%)',
      }}
    />
  );
}
