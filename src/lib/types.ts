export type CtaLink = { label: string; href: string };

export type Site = {
  name: string;
  nameAscii: string;
  shortName: string;
  role: string;
  holding: string;
  domain: string;
  url: string;
  locale: string;
  location: { city: string; country: string; countryCode: string };
  hero: {
    headline: string;
    pillars: string[];
    roles: string[];
    rolesLine: string;
    claim: string[];
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
  };
  intro: string;
  email: string;
  social: { label: string; href: string; handle: string }[];
  sameAs: string[];
  nav: CtaLink[];
  now: {
    eyebrow: string;
    items: { role: string; org: string; note: string; href: string | null }[];
  };
  before: { eyebrow: string; note: string };
  coda: { eyebrow: string; line: string; links: CtaLink[] };
  keywords: string[];
};

export type Company = {
  slug: string;
  name: string;
  role: string;
  years: string;
  status: 'current' | 'past';
  category: string;
  url: string | null;
  tagline: string;
  summary: string;
  logo: string;
  cover: string;
  accent: string;
  highlights: string[];
  story: string[];
  facts: { label: string; value: string }[];
};

export type Milestone = {
  id: string;
  year: string;
  years: string;
  company: string;
  role: string;
  chapter: string;
  location: string;
  roleLong: string;
  /** 'primary' shows on the homepage; 'secondary' only on /about. */
  weight: 'primary' | 'secondary';
  /** One short line, used by the homepage. */
  line: string;
  /** The longer version, used on /about. */
  achievement: string;
  href: string | null;
};

export type SectionCopy = { eyebrow: string; headline: string; intro?: string };

export type Story = {
  eyebrow: string;
  headline: string;
  steps: { label: string; note: string }[];
  conclusion: string;
  timeline: SectionCopy;
  career: SectionCopy;
  faq: SectionCopy;
};

export type FocusArea = { title: string; body: string; metric: string };

export type Philosophy = { statements: string[]; closing: string };


export type MediaItem = {
  type: 'Podcast' | 'Interview' | 'Article' | 'TV' | 'Award' | string;
  title: string;
  outlet: string;
  date: string;
  url: string;
  summary: string;
};

export type Award = {
  title: string;
  organisation: string;
  year: string;
  detail: string;
  url: string | null;
};

export type Faq = { question: string; answer: string };

export type ArticleFrontmatter = {
  publisherOperation?: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  categories: string[];
  cover: string;
  coverAlt: string;
  featured?: boolean;
  draft?: boolean;
};

export type Article = ArticleFrontmatter & {
  slug: string;
  body: string;
  readingTime: number;
  words: number;
};

export type Person = {
  slug: string;
  name: string;
  role: string;
  org: string;
  location: string;
  also: string | null;
  bio: string;
  focus: string[];
  image: string | null;
  website: string | null;
  linkedin: string | null;
  email: string;
};

export type Innoshare = {
  legalName: string;
  name: string;
  founded: number;
  url: string;
  logo: string;
  lockup: string;
  positioning: string;
  lede: string;
  principle: string;
  services: { id: string; title: string; body: string; detail: string[] }[];
  record: { value: number; suffix: string; label: string; count: boolean }[];
  offices: string[];
  registry: {
    company: string;
    street: string;
    postcode: string;
    city: string;
    country: string;
    managingDirectors: string[];
    register: string;
    court: string;
    vat: string;
    email: string;
    phone: string;
    website: string;
  };
  clients: { eyebrow: string; items: string[] };
  engagements: { name: string; detail: string }[];
};

export type Legal = {
  updated: string;
  supervisoryAuthority: {
    name: string;
    street: string;
    postcode: string;
    city: string;
    url: string;
  };
  processors: {
    name: string;
    role: string;
    note: string | null;
    transfer: string | null;
    url: string | null;
  }[];
  notCollected: string[];
  accessibility: { standard: string; status: string; knownGaps: string[] };
};
