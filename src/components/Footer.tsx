import Link from 'next/link';

import { ArrowRight } from '@/components/ui/Button';
import { InnoshareLogo } from '@/components/ui/InnoshareLogo';
import { COMPANIES, SITE } from '@/lib/content';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="relative border-t border-line/[0.08] bg-ink-deep">
      <div className="shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-6">
            <Link href="/innoshare" className="w-fit text-bone transition-opacity hover:opacity-70">
              <InnoshareLogo size="sm" />
            </Link>
            <p className="max-w-[30ch] text-[0.9375rem] leading-relaxed text-bone/55">
              {SITE.name} builds European technology companies in AI, defence and public safety.
              Advisory and company building through {SITE.holding}.
            </p>
            <div className="flex flex-col gap-1.5">
              <a href={`mailto:${SITE.email}`} className="link-draw w-fit wrap-safe text-[0.9375rem] text-bone">
                {SITE.email}
              </a>
              <Link href="/contact" className="link-draw w-fit text-[0.875rem] text-bone/55">
                Email us
              </Link>
            </div>
          </div>

          <FooterColumn title="Site">
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/innoshare">Innoshare, the advisory</FooterLink>
            <FooterLink href="/companies">Companies</FooterLink>
            <FooterLink href="/newsroom">Newsroom</FooterLink>
            <FooterLink href="/media">Media</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterColumn>

          <FooterColumn title="Companies">
            {COMPANIES.map((company) => (
              <FooterLink key={company.slug} href={`/companies/${company.slug}`}>
                {company.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="LinkedIn">
            {SITE.social.map((item) => (
              <FooterLink key={item.label} href={item.href} external>
                {item.handle}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line/[0.06] pt-8 text-[0.8125rem] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {YEAR} {SITE.holding}, Dresden
          </p>
          <div className="flex gap-6">
            <Link href="/impressum" className="transition-colors hover:text-bone/70">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition-colors hover:text-bone/70">
              Datenschutz
            </Link>
            <Link href="/barrierefreiheit" className="transition-colors hover:text-bone/70">
              Barrierefreiheit
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="eyebrow">{title}</h2>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <li>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener me"
          className="group inline-flex items-center gap-1.5 text-[0.9375rem] text-bone/55 transition-colors hover:text-bone"
        >
          {children}
          <ArrowRight className="h-3 w-3 -rotate-45 opacity-0 transition-all duration-300 group-hover:opacity-60" />
        </a>
      ) : (
        <Link
          href={href}
          className="text-[0.9375rem] text-bone/55 transition-colors hover:text-bone"
        >
          {children}
        </Link>
      )}
    </li>
  );
}
