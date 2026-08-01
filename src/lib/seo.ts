import type { Metadata } from 'next';

import { SITE, SITE_URL, absoluteUrl } from './content';

type BuildMetadata = {
  title: string;
  description: string;
  path: string;
  /** Absolute or root-relative image. Falls back to the generated OG image. */
  image?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  keywords,
  noIndex,
}: BuildMetadata): Metadata {
  const url = absoluteUrl(path);
  // Without an explicit image, the file based opengraph-image applies.
  const resolvedImage = image ? (image.startsWith('http') ? image : absoluteUrl(image)) : null;

  return {
    title,
    description,
    keywords: keywords ?? SITE.keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type: type === 'profile' ? 'profile' : type,
      url,
      title,
      description,
      siteName: SITE.domain,
      locale: 'en_GB',
      ...(resolvedImage
        ? { images: [{ url: resolvedImage, width: 1200, height: 630, alt: title }] }
        : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(resolvedImage ? { images: [resolvedImage] } : {}),
    },
    metadataBase: new URL(SITE_URL),
  };
}
