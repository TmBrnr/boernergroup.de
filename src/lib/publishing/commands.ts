export const MAX_BRIEF_LENGTH = 16_000;

export type PublisherCommand =
  | { kind: 'create'; request: string }
  | { kind: 'update'; slug: string; request: string }
  | { kind: 'delete'; slug: string }
  | { kind: 'help' }
  | { kind: 'confirm' | 'cancel' | 'preview' | 'status'; reviewId: string }
  | { kind: 'clarify'; message: string };

export function cleanPrompt(text: string): string {
  return text
    .replace(/<@[^>]+>/g, '')
    .replace(/^@[\w.-]+\s*/i, '')
    .replace(/<(https?:\/\/[^>|]+)(?:\|[^>]+)?>/g, '$1')
    .replace(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/g, '$1')
    .trim();
}

function articleTarget(text: string, siteUrl: string, update = false): { slug: string; rest: string } | null {
  if (update && !/^https?:\/\//i.test(text.trim())) {
    const target = /^(?:(?:article|post|artikel|beitrag)\s+)?([a-z0-9]+(?:-[a-z0-9]+)*)(?:\s+([\s\S]+))?$/i.exec(text.trim());
    if (target) return { slug: target[1].toLowerCase(), rest: target[2]?.trim() ?? '' };
  }
  const urls = [...text.matchAll(/https?:\/\/[^\s<>]+/g)];
  if (urls.length) {
    if (!update && urls.length !== 1) return null;
    if (update && urls[0].index !== 0) return null;
    const raw = urls[0][0].replace(/[.,;!]+$/, '');
    try {
      const url = new URL(raw);
      const host = new URL(siteUrl).hostname.replace(/^www\./, '');
      if (url.hostname.replace(/^www\./, '') !== host || url.username || url.password) return null;
      const match = /^\/newsroom\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(url.pathname);
      if (!match) return null;
      return { slug: match[1], rest: text.slice(urls[0].index! + urls[0][0].length).trim() };
    } catch {
      return null;
    }
  }
  const match = /^(?:(?:the|den|der|das)\s+)?(?:(?:article|post|artikel|beitrag)\s+)?(?:\/newsroom\/)?([a-z0-9]+(?:-[a-z0-9]+)+)(?:\s+([\s\S]+))?$/i.exec(text.trim());
  return match ? { slug: match[1].toLowerCase(), rest: match[2]?.trim() ?? '' } : null;
}

export function parsePublisherCommand(text: string, siteUrl: string): PublisherCommand {
  const prompt = cleanPrompt(text);
  if (/^(?:help|commands?|hilfe|befehle)[.!?]?$/i.test(prompt)) return { kind: 'help' };
  const decision = /^(confirm|approve|freigabe|freigeben|bestätigen|bestaetigen|cancel|abbrechen|verwerfen|preview|vorschau|status)\s+([a-f0-9]{32})$/i.exec(prompt);
  if (decision) {
    const action = decision[1].toLowerCase();
    const kind = /^(cancel|abbrechen|verwerfen)$/.test(action) ? 'cancel'
      : /^(preview|vorschau)$/.test(action) ? 'preview'
      : action === 'status' ? 'status' : 'confirm';
    return { kind, reviewId: decision[2].toLowerCase() };
  }

  const update = /^(?:update|edit|revise|aktualisiere|aktualisieren|überarbeite|ueberarbeite|bearbeite)\s+([\s\S]+)$/i.exec(prompt);
  if (update) {
    const target = articleTarget(update[1], siteUrl, true);
    const request = target?.rest.replace(/^[-–—:]\s*/, '').trim();
    if (target && request && request.length >= 20 && request.length <= MAX_BRIEF_LENGTH) {
      return { kind: 'update', slug: target.slug, request };
    }
    return { kind: 'clarify', message: 'Use `update <article-slug or newsroom URL> <changes to make>` (at least 20 characters of instructions). I will preview the revised article before changing it.' };
  }
  const create = /^(?:new\s+(?:blog\s+)?(?:post|article)|(?:draft|publish|create)\s+(?:(?:an?|new)\s+)?(?:blog\s+)?(?:post|article)|write\s+(?:(?:an?|new|\d+[ -]word)\s+)+(?:blog\s+)?(?:post|article|analysis)|(?:neuer?|neuen)\s+(?:blogpost|artikel|beitrag)|(?:schreibe|erstelle)\s+(?:(?:einen?|neuen?)\s+)?(?:blogpost|artikel|beitrag))\b[\s:–—-]*([\s\S]+)$/i.exec(prompt);
  if (create && create[1].trim().length >= 20 && create[1].trim().length <= MAX_BRIEF_LENGTH) {
    const request = create[1].trim();
    if (!/^(?:this page does not exist|page[- ]not[- ]found|404\b|diese seite (?:existiert nicht|wurde nicht gefunden))/i.test(request)) {
      return { kind: 'create', request };
    }
  }
  // Conversational management requests never fall through to article creation.
  if (/\b(?:delete|remove|lösche?n?|loesche?n?|löscge|entferne?n?)\b/i.test(prompt)) {
    const command = /\b(?:delete|remove|lösche?n?|loesche?n?|löscge|entferne?n?)\b/i.exec(prompt)!;
    const target = articleTarget(prompt.slice(command.index + command[0].length), siteUrl);
    if (target) return { kind: 'delete', slug: target.slug };
    return { kind: 'clarify', message: 'Which article should I delete? Use `delete <article-slug>` or `lösche <newsroom URL>`. I will show the exact article for confirmation first.' };
  }
  return { kind: 'clarify', message: 'I have not created or changed an article. Use `new blog post <brief>`, `update <URL> <changes>`, `delete <URL>`, or `help`. Every change needs a preview and explicit confirmation.' };
}
