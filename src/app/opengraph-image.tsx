import { ImageResponse } from 'next/og';

import { SITE } from '@/lib/content';

export const alt = `${SITE.name}. Building European technology companies.`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generated at build time so the static export carries it as a real file.
export const dynamic = 'force-static';

const INK = '#08090B';
const BONE = '#EDEEF0';
const STEEL = '#9AA2AC';

/**
 * Generated once at build time, so it also exists in the static export.
 * Articles override it with their own cover.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          padding: '72px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(60% 70% at 15% 0%, rgba(154,162,172,0.16) 0%, rgba(8,9,11,0) 70%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
            <g stroke={BONE} strokeWidth="2.8" strokeLinecap="round">
              <path d="M21.806 41.866A18 18 0 0 1 7.431 16.967" />
              <path d="M9.624 13.167A18 18 0 0 1 38.376 13.167" />
              <path d="M40.569 16.967A18 18 0 0 1 26.194 41.866" />
            </g>
          </svg>
          <div style={{ color: STEEL, fontSize: 22, letterSpacing: '0.22em' }}>
            TOBIAS BÖRNER
          </div>
        </div>

        <div
          style={{
            color: BONE,
            fontSize: 78,
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
            maxWidth: '960px',
            display: 'flex',
          }}
        >
          Building European Technology Companies
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            color: 'rgba(237,238,240,0.5)',
            fontSize: 24,
          }}
        >
          <div style={{ display: 'flex' }}>boernergroup.de</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>AI</span>
            <span>·</span>
            <span>Defence</span>
            <span>·</span>
            <span>Public Safety</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
