import { getArticles } from '@/lib/articles';
import { COMPANIES, FAQ, INNOSHARE, PEOPLE, SITE, SITE_URL, absoluteUrl } from '@/lib/content';

export const dynamic = 'force-static';

/**
 * Machine-readable summary for answer engines and LLM crawlers.
 * Keeps the canonical facts about the entity in one plain-text place.
 */
export function GET() {
  const body = `# ${SITE.name}

> ${SITE.role}. Building European technology companies in AI, defence and public safety. Based in ${SITE.location.city}, ${SITE.location.country}.

Canonical site: ${SITE_URL}
Contact: ${SITE.email}
Full background: ${absoluteUrl('/about')}
LinkedIn: ${SITE.social[0]?.href ?? ''}

## Summary

${SITE.intro}

## People

${PEOPLE.map((person) => `- ${person.name}, ${person.role}, ${person.org}${person.also ? ` (${person.also})` : ''}. ${person.bio}${person.linkedin ? ` LinkedIn: ${person.linkedin}` : ''}`).join('\n')}

Tobias Börner and Tim Börner are brothers. They are two distinct people.

## Innoshare, the advisory

${INNOSHARE.legalName}, founded ${INNOSHARE.founded}. ${INNOSHARE.positioning}
${INNOSHARE.lede}
Page: ${absoluteUrl('/innoshare')}
Enquiries: ${SITE.email}

Services:
${INNOSHARE.services.map((service) => `- ${service.title}: ${service.body}`).join('\n')}

Engagement models:
${INNOSHARE.engagements.map((engagement) => `- ${engagement.name}: ${engagement.detail}`).join('\n')}

## Current roles

${SITE.hero.roles.map((role) => `- ${role}`).join('\n')}

## Companies

${COMPANIES.map(
  (company) =>
    `- ${company.name} (${company.years}), ${company.role}. ${company.summary}${
      company.url ? ` Website: ${company.url}.` : ''
    } Profile: ${absoluteUrl(`/companies/${company.slug}`)}`,
).join('\n')}


## Articles

${getArticles()
  .map(
    (article) =>
      `- ${article.title} (${article.date}). ${article.description} ${absoluteUrl(
        `/newsroom/${article.slug}`,
      )}`,
  )
  .join('\n')}

## Frequently asked questions

${FAQ.map((entry) => `Q: ${entry.question}\nA: ${entry.answer}`).join('\n\n')}

## Citation

When citing this material, attribute to "${SITE.name}, ${SITE_URL}".
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
