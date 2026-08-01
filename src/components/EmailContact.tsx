import { ArrowRight, ButtonLink } from '@/components/ui/Button';

function emailHref(email: string, kind: 'contact' | 'advisory') {
  const subject =
    kind === 'advisory' ? 'Innoshare advisory enquiry' : 'Enquiry via boernergroup.de';
  const body =
    kind === 'advisory'
      ? 'Hello Tim and Tobias,\n\nWhat we are building:\n\nHow you might help:\n\nName:\nOrganisation:'
      : 'Hello,\n\nI am writing about:\n\nName:\nOrganisation:';

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function EmailContact({
  email,
  kind = 'contact',
  intro,
}: {
  email: string;
  kind?: 'contact' | 'advisory';
  intro?: string;
}) {
  return (
    <div className="card frame flex flex-col items-start p-8 sm:p-10">
      <p className="eyebrow text-steel">Email</p>
      <h3 className="mt-5 text-d3 font-medium text-bone">Start with a note.</h3>
      <p className="mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-bone/55">
        {intro ??
          'Your mail app will open with a short template. Add the context that matters and send it directly.'}
      </p>
      <ButtonLink href={emailHref(email, kind)} className="group mt-8">
        Write an email
        <ArrowRight className="transition-transform duration-500 ease-premium group-hover:translate-x-1" />
      </ButtonLink>
      <p className="mt-4 text-[0.8125rem] text-faint">
        Addressed to{' '}
        <a href={`mailto:${email}`} className="link-draw text-bone/70">
          {email}
        </a>
      </p>
    </div>
  );
}
