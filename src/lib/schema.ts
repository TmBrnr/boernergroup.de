import {
  COMPANIES,
  FAQ,
  INNOSHARE,
  PEOPLE,
  SITE,
  SITE_URL,
  absoluteUrl,
} from './content';
import type { Article } from './types';

type Json = Record<string, unknown>;

export const PERSON_ID = `${SITE_URL}/#person`;
export const INNOSHARE_ID = `${SITE_URL}/innoshare#organization`;
export const personId = (slug: string) => `${SITE_URL}/#${slug}`;
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function personSchema(): Json {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.name,
    alternateName: SITE.nameAscii,
    url: SITE_URL,
    image: absoluteUrl('/media/portrait.jpg'),
    email: `mailto:${SITE.email}`,
    jobTitle: 'Chief Executive Officer',
    description: SITE.intro,
    knowsAbout: [
      'Artificial intelligence',
      'European technological sovereignty',
      'Defence technology',
      'Public safety technology',
      'Company building',
      'Growth marketing',
      'Consumer subscription apps',
    ],
    knowsLanguage: ['en', 'de'],
    nationality: { '@type': 'Country', name: 'Germany' },
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.location.city,
      addressCountry: SITE.location.countryCode,
    },
    worksFor: [{ '@id': ORG_ID }, { '@id': INNOSHARE_ID }],
    founder: { '@id': INNOSHARE_ID },
    sibling: { '@id': personId('tim-boerner') },
    alumniOf: COMPANIES.filter((c) => c.status === 'past').map((c) => ({
      '@type': 'Organization',
      name: c.name,
      ...(c.url ? { url: c.url } : {}),
    })),
    sameAs: SITE.sameAs,
  };
}

export function organizationSchema(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Civitas Europe',
    url: 'https://civitas-europe.de',
    description:
      'Civitas Europe develops Civitas Sentinel, a GDPR-compliant digital analysis platform for police and security authorities.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'DE',
    },
    employee: { '@id': PERSON_ID },
  };
}

export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: `${SITE.name}, ${SITE.role}`,
    inLanguage: 'en',
    publisher: { '@id': PERSON_ID },
    about: { '@id': PERSON_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/newsroom?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqSchema(): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: FAQ.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(article: Article): Json {
  return {
    '@type': 'BlogPosting',
    '@id': absoluteUrl(`/newsroom/${article.slug}#article`),
    headline: article.title,
    description: article.description,
    datePublished: new Date(article.date).toISOString(),
    dateModified: new Date(article.updated ?? article.date).toISOString(),
    inLanguage: 'en',
    articleSection: article.categories,
    keywords: article.categories.join(', '),
    wordCount: article.words,
    timeRequired: `PT${article.readingTime}M`,
    image: absoluteUrl(article.cover),
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: absoluteUrl(`/newsroom/${article.slug}`),
  };
}

export function companySchema(slug: string): Json | null {
  const company = COMPANIES.find((c) => c.slug === slug);
  if (!company) return null;

  return {
    '@type': 'Organization',
    name: company.name,
    ...(company.url ? { url: company.url } : {}),
    description: company.summary,
    slogan: company.tagline,
    logo: absoluteUrl(company.logo),
    member: {
      '@type': 'OrganizationRole',
      roleName: company.role,
      member: { '@id': PERSON_ID },
    },
  };
}

/** Wraps nodes in a single @graph so entities can reference each other by @id. */
export function graph(...nodes: (Json | null)[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  });
}


/** Tim Börner as his own entity, so search and answer engines never merge the brothers. */
export function timSchema(): Json | null {
  const tim = PEOPLE.find((person) => person.slug === 'tim-boerner');
  if (!tim) return null;

  return {
    '@type': 'Person',
    '@id': personId(tim.slug),
    name: tim.name,
    alternateName: 'Tim Boerner',
    jobTitle: tim.role,
    description: tim.bio,
    email: `mailto:${tim.email}`,
    ...(tim.website ? { url: tim.website } : {}),
    ...(tim.image ? { image: absoluteUrl(tim.image) } : {}),
    knowsAbout: tim.focus,
    knowsLanguage: ['de', 'en'],
    worksFor: { '@id': INNOSHARE_ID },
    sibling: { '@id': PERSON_ID },
    ...(tim.website || tim.linkedin
      ? { sameAs: [tim.website, tim.linkedin].filter(Boolean) }
      : {}),
  };
}

/** Innoshare: the organisation plus each advisory service it offers. */
export function innoshareSchema(): Json[] {
  const org: Json = {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': INNOSHARE_ID,
    name: INNOSHARE.legalName,
    alternateName: INNOSHARE.name,
    legalName: INNOSHARE.legalName,
    url: absoluteUrl('/innoshare'),
    logo: absoluteUrl(INNOSHARE.logo),
    image: absoluteUrl(INNOSHARE.logo),
    slogan: INNOSHARE.positioning,
    description: INNOSHARE.lede,
    foundingDate: String(INNOSHARE.founded),
    email: `mailto:${SITE.email}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: INNOSHARE.registry.street,
      postalCode: INNOSHARE.registry.postcode,
      addressLocality: INNOSHARE.registry.city,
      addressCountry: 'DE',
    },
    vatID: INNOSHARE.registry.vat,
    areaServed: { '@type': 'Place', name: 'Europe' },
    founder: { '@id': PERSON_ID },
    employee: PEOPLE.map((person) => ({ '@id': personId(person.slug) })),
    knowsAbout: INNOSHARE.services.map((service) => service.title),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Advisory services',
      itemListElement: INNOSHARE.services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service.title,
          description: service.body,
          provider: { '@id': INNOSHARE_ID },
        },
      })),
    },
  };

  const tim = timSchema();
  return tim ? [org, tim] : [org];
}
