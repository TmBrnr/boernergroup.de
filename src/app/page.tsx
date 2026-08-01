import type { Metadata } from 'next';

import { AdvisoryBand } from '@/components/home/AdvisoryBand';
import { AssemblyHero } from '@/components/home/AssemblyHero';
import { Coda } from '@/components/home/Coda';
import { Ledger } from '@/components/home/Ledger';
import { INNOSHARE, PEOPLE, SITE, TIMELINE } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: `${SITE.name} · Building European Technology Companies`,
  description:
    'Technology entrepreneur and investor. Geschäftsführer of Civitas Europe, CMO of Orcrist Technologies, co-founder of Fastic and LOVOO, founder of the advisory Innoshare. Based in Dresden.',
  path: '/',
  type: 'profile',
});

/**
 * Four registers, in the order a reader needs them:
 * the claim, what is current, the advisory, how to reach us.
 * Everything discursive lives on /about.
 */
export default function HomePage() {
  return (
    <>
      <AssemblyHero site={SITE} />
      <Ledger site={SITE} milestones={TIMELINE} />
      <AdvisoryBand innoshare={INNOSHARE} people={PEOPLE} />
      <Coda site={SITE} />
    </>
  );
}
