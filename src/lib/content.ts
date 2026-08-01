import awards from '~/content/data/awards.json';
import companies from '~/content/data/companies.json';
import faq from '~/content/data/faq.json';
import focus from '~/content/data/focus.json';
import innoshare from '~/content/data/innoshare.json';
import legal from '~/content/data/legal.json';
import media from '~/content/data/media.json';
import people from '~/content/data/people.json';
import philosophy from '~/content/data/philosophy.json';
import site from '~/content/data/site.json';
import story from '~/content/data/story.json';
import timeline from '~/content/data/timeline.json';

import type {
  Award,
  Company,
  Faq,
  FocusArea,
  Innoshare,
  Legal,
  MediaItem,
  Milestone,
  Person,
  Philosophy,
  Site,
  Story,
} from './types';

export const SITE = site as Site;
export const COMPANIES = companies as Company[];
export const TIMELINE = timeline as Milestone[];
export const STORY = story as Story;
export const FOCUS = focus as FocusArea[];
export const PHILOSOPHY = philosophy as Philosophy;
export const MEDIA = media as MediaItem[];
export const AWARDS = awards as Award[];
export const FAQ = faq as Faq[];
export const INNOSHARE = innoshare as Innoshare;
export const LEGAL = legal as Legal;
export const PEOPLE = people as Person[];

export function getPerson(slug: string): Person | undefined {
  return PEOPLE.find((person) => person.slug === slug);
}

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url
).replace(/\/$/, '');

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getCompany(slug: string): Company | undefined {
  return COMPANIES.find((c) => c.slug === slug);
}

export const CURRENT_COMPANIES = COMPANIES.filter((c) => c.status === 'current');
export const PAST_COMPANIES = COMPANIES.filter((c) => c.status === 'past');

export const MEDIA_BY_TYPE = MEDIA.reduce<Record<string, MediaItem[]>>((acc, item) => {
  (acc[item.type] ??= []).push(item);
  return acc;
}, {});
