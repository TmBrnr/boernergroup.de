import fs from 'node:fs/promises';
import path from 'node:path';

import { loadEnvConfig } from '@next/env';

import {
  createGeneratedCover,
  prepareArticle,
  type ArticleDraft,
} from '../src/lib/publishing/article';
import type { OpenAiReasoningEffort } from '../src/lib/publishing/config';
import { draftArticle, researchTopic, type ResearchResult } from '../src/lib/publishing/openai';

loadEnvConfig(process.cwd());

const FIXTURE_BRIEF =
  'Explain how European technology leaders can turn AI sovereignty from a policy slogan into practical architecture and procurement decisions.';

const FIXTURE_ARTICLE: ArticleDraft = {
  title: 'From AI sovereignty slogans to engineering decisions',
  description:
    'A practical framework for turning European AI sovereignty goals into architecture, procurement and operating choices.',
  categories: ['Artificial Intelligence', 'Europe', 'Sovereignty'],
  coverAlt: 'Abstract dark editorial illustration with blue market trajectories and geometric nodes.',
  body: `## Sovereignty is an operating constraint

AI sovereignty becomes useful when leaders translate it into decisions about compute, model portability, data location and contractual control. A policy statement alone cannot make a system resilient.

The practical question is whether an organisation can keep operating when a supplier changes its terms, withdraws a service or falls outside an acceptable jurisdiction. That makes substitutability an engineering requirement rather than a communications theme.

## Start with the dependency map

Teams should document where their models run, who can access the data, which interfaces are proprietary and how long a migration would take. This creates a concrete view of concentration risk.

<Aside>
The useful test is not whether a supplier is European. It is whether the system can be moved, audited and operated under the organisation's own constraints.
</Aside>

## Procurement has to test portability

Contracts should preserve data export, model substitution and meaningful termination rights. Technical teams should prove those promises with regular migration exercises rather than relying on documentation.

## Make the fallback real

A fallback that has never processed production-shaped traffic is only a diagram. Leaders should fund the adapters, evaluation suites and operational drills required to make alternatives credible.

## Sources

- [European Commission: European approach to artificial intelligence](https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence)
- [ENISA: Cloud security](https://www.enisa.europa.eu/topics/cloud-and-big-data/cloud-security)`,
};

const FIXTURE_RESEARCH: ResearchResult = {
  brief: 'Fixture research used only to validate the local output pipeline without an API call.',
  sources: [
    'https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence',
    'https://www.enisa.europa.eu/topics/cloud-and-big-data/cloud-security',
  ],
};

async function writePreview(draft: ArticleDraft, research: ResearchResult): Promise<string> {
  const cover = await createGeneratedCover(draft);
  const article = prepareArticle({
    ...draft,
    coverAlt: 'Abstract dark editorial illustration with blue market trajectories and geometric nodes.',
  });
  const outputDirectory = path.join(process.cwd(), '.local-previews', article.slug);

  await fs.mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outputDirectory, 'article.mdx'), article.mdx, 'utf8'),
    fs.writeFile(path.join(outputDirectory, 'cover.jpg'), cover.bytes),
    fs.writeFile(
      path.join(outputDirectory, 'research.json'),
      `${JSON.stringify(research, null, 2)}\n`,
      'utf8',
    ),
  ]);

  return outputDirectory;
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const fixture = arguments_.includes('--fixture');
  const request = arguments_.filter((argument) => argument !== '--fixture').join(' ').trim();

  if (fixture) {
    const outputDirectory = await writePreview(FIXTURE_ARTICLE, FIXTURE_RESEARCH);
    console.log(`Local fixture preview created: ${outputDirectory}`);
    return;
  }

  if (!request) {
    throw new Error(
      'Provide an article brief, for example: npm run test:blog -- "Write an article about European AI infrastructure"',
    );
  }

  const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAiApiKey) {
    throw new Error(
      'OPENAI_API_KEY is empty in .env.local. Add the key, or run npm run test:blog -- --fixture for an offline smoke test.',
    );
  }

  const openAiReasoningEffort = process.env.OPENAI_REASONING_EFFORT?.trim() || 'max';
  const allowedReasoningEfforts: OpenAiReasoningEffort[] = [
    'none',
    'low',
    'medium',
    'high',
    'xhigh',
    'max',
  ];
  if (!allowedReasoningEfforts.includes(openAiReasoningEffort as OpenAiReasoningEffort)) {
    throw new Error(
      `OPENAI_REASONING_EFFORT must be one of: ${allowedReasoningEfforts.join(', ')}`,
    );
  }

  const config = {
    openAiApiKey,
    openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-6-luna',
    openAiReasoningEffort: openAiReasoningEffort as OpenAiReasoningEffort,
  };

  console.log('Researching current sources…');
  const research = await researchTopic(request || FIXTURE_BRIEF, config);
  console.log(`Found ${research.sources.length} source(s). Drafting article…`);
  const draft = await draftArticle({ request, research, config });
  console.log('Validating MDX and creating the branded cover…');
  const outputDirectory = await writePreview(draft, research);
  console.log(`Local generated preview created: ${outputDirectory}`);
  console.log('No Slack, GitHub, or deployment request was made.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
