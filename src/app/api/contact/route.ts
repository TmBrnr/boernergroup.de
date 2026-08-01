import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

type FormKind = 'contact' | 'advisory' | 'newsletter';
type Payload = Record<string, unknown> & { kind?: unknown; companyUrl?: unknown };

const RECIPIENT = process.env.CONTACT_RECIPIENT?.trim() || 'mail@boernergroup.de';
const FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL?.trim() || 'Boerner Group Website <mail@boernergroup.de>';
const MAX_BODY_BYTES = 20_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(body: { ok: boolean; message: string }, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function readField(payload: Payload, key: string, maxLength: number) {
  const value = payload[key];
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function formKind(value: unknown): FormKind | null {
  if (value === undefined || value === 'contact') return 'contact';
  if (value === 'advisory' || value === 'newsletter') return value;
  return null;
}

function deliveryEndpoint(kind: FormKind) {
  return kind === 'newsletter'
    ? process.env.NEWSLETTER_FORM_ENDPOINT?.trim()
    : process.env.CONTACT_FORM_ENDPOINT?.trim();
}

function emailText({
  kind,
  name,
  email,
  organisation,
  subject,
  message,
}: {
  kind: FormKind;
  name: string;
  email: string;
  organisation: string;
  subject: string;
  message: string;
}) {
  if (kind === 'newsletter') {
    return [`Newsletter subscription request`, '', `Email: ${email}`].join('\n');
  }

  return [
    `Form: ${kind}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Organisation: ${organisation || '—'}`,
    `Subject: ${subject}`,
    '',
    message,
  ].join('\n');
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, message: 'The message is too long.' }, 413);
  }

  let payload: Payload;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    payload = parsed as Payload;
  } catch {
    return json({ ok: false, message: 'Invalid request body.' }, 400);
  }

  // Honeypot: silently accept so automated submitters learn nothing.
  if (readField(payload, 'companyUrl', 500)) {
    return json({ ok: true, message: 'Request received.' });
  }

  const kind = formKind(payload.kind);
  const email = readField(payload, 'email', 254).toLowerCase();
  const name = readField(payload, 'name', 120);
  const organisation = readField(payload, 'organisation', 160);
  const subject = readField(payload, 'subject', 160).replace(/[\r\n]+/g, ' ');
  const message = readField(payload, 'message', 5_000);

  if (!kind) return json({ ok: false, message: 'Invalid form type.' }, 400);
  if (!EMAIL_PATTERN.test(email)) {
    return json({ ok: false, message: 'Please provide a valid email address.' }, 422);
  }
  if (kind !== 'newsletter' && (!name || !subject || message.length < 10)) {
    return json({ ok: false, message: 'Please complete all required fields.' }, 422);
  }

  const endpoint = deliveryEndpoint(kind);
  const outbound = {
    kind,
    name,
    email,
    organisation,
    subject,
    message,
    to: RECIPIENT,
    receivedAt: new Date().toISOString(),
  };

  try {
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outbound),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`Form endpoint returned ${response.status}`);
    } else {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (!apiKey) {
        return json(
          {
            ok: false,
            message: `Email delivery is not configured. Please write to ${RECIPIENT} directly.`,
          },
          503,
        );
      }

      const resend = new Resend(apiKey);
      const label = kind === 'newsletter' ? 'Newsletter request' : subject;
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [RECIPIENT],
        replyTo: email,
        subject: `[boernergroup.de] ${label}`,
        text: emailText({ kind, name, email, organisation, subject, message }),
      });

      if (error) throw new Error(`${error.name}: ${error.message}`);
    }

    return json({
      ok: true,
      message:
        kind === 'newsletter'
          ? 'Subscription request received.'
          : 'Message sent. You will hear back within two business days.',
    });
  } catch (error) {
    console.error(
      '[contact delivery failed]',
      error instanceof Error ? error.message : 'Unknown delivery error',
    );
    return json(
      {
        ok: false,
        message: `Email delivery is temporarily unavailable. Please write to ${RECIPIENT} directly.`,
      },
      502,
    );
  }
}
