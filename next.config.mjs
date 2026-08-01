/**
 * Two output modes from the same source.
 *
 *   npm run build     Node server. Image optimisation, on demand OG images,
 *                     a real POST endpoint for the forms, 301 redirects.
 *
 *   npm run export    A folder of static files for any web host. No Node at
 *                     runtime. Forms open the visitor's mail client instead of
 *                     posting, and redirects are handed to the host.
 */
const STATIC = process.env.STATIC_EXPORT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  ...(STATIC ? { output: 'export', trailingSlash: true } : {}),

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [420, 640, 828, 1080, 1280, 1600, 1920, 2560],
    // A static host has no optimiser, so the originals are served as they are.
    unoptimized: STATIC,
    // Company logos are first-party SVGs committed to /public.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  ...(STATIC
    ? {}
    : {
        async redirects() {
          return [
            { source: '/imprint', destination: '/impressum', permanent: true },
            { source: '/privacy', destination: '/datenschutz', permanent: true },
            { source: '/accessibility', destination: '/barrierefreiheit', permanent: true },
          ];
        },

        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'X-DNS-Prefetch-Control', value: 'on' },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
