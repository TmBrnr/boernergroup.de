import type { Metadata } from 'next';

import { LegalNav, LegalRow, LegalSection } from '@/components/Legal';
import { PageHeader } from '@/components/ui/PageHeader';
import { INNOSHARE, SITE } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Impressum',
  description:
    'Anbieterkennzeichnung nach § 5 DDG und § 18 Abs. 2 MStV für boernergroup.de, betrieben von der Innoshare GmbH, Dresden.',
  path: '/impressum',

});

export default function ImpressumPage() {
  const r = INNOSHARE.registry;
  const directors = r.managingDirectors.join(' und ');

  return (
    <div lang="de">
      <PageHeader
        eyebrow="Angaben gemäß § 5 DDG"
        title="Impressum"
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Impressum', path: '/impressum' },
        ]}
      >
        <LegalNav current="impressum" />
      </PageHeader>

      <section className="py-16 sm:py-20">
        <div className="shell max-w-4xl">
          <h2 className="eyebrow">Anbieter</h2>
          <dl className="mt-6">
            <LegalRow label="Firma">{r.company}</LegalRow>
            <LegalRow label="Anschrift">
              {r.street}, {r.postcode} {r.city}, {r.country}
            </LegalRow>
            <LegalRow label="Vertreten durch">{directors}</LegalRow>
            <LegalRow label="E-Mail">
              <a href={`mailto:${r.email}`} className="link-draw">
                {r.email}
              </a>
            </LegalRow>
            {r.phone ? (
              <LegalRow label="Telefon">
                <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="link-draw">
                  {r.phone}
                </a>
              </LegalRow>
            ) : null}
            <LegalRow label="Handelsregister">{r.register}</LegalRow>
            <LegalRow label="Registergericht">{r.court}</LegalRow>
            <LegalRow label="Umsatzsteuer-ID">
              {r.vat} <span className="text-faint">(§ 27a UStG)</span>
            </LegalRow>
          </dl>

          <LegalSection title="Verantwortlich für redaktionelle Inhalte">
            <p>
              Verantwortlich nach § 18 Abs. 2 MStV: {r.managingDirectors[0]}, {r.company},{' '}
              {r.street}, {r.postcode} {r.city}.
            </p>
          </LegalSection>

          <LegalSection title="Verbraucherstreitbeilegung">
            <p>
              Wir sind weder verpflichtet noch bereit, an einem Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle im Sinne des § 36 VSBG teilzunehmen.
            </p>
            <p>
              Die europäische Plattform zur Online-Streitbeilegung wurde am 20. Juli 2025
              eingestellt. Die Pflicht, auf sie zu verlinken, ist damit entfallen. Ein Link darauf
              findet sich auf dieser Seite deshalb bewusst nicht mehr.
            </p>
          </LegalSection>

          <LegalSection title="Haftung für Inhalte">
            <p>
              Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen
              Gesetzen verantwortlich. Nach §§ 7 bis 10 DDG sind wir als Diensteanbieter jedoch
              nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
              oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben davon unberührt.
            </p>
          </LegalSection>

          <LegalSection title="Haftung für Links">
            <p>
              Diese Seite enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
              Einfluss haben. Für diese fremden Inhalte können wir keine Gewähr übernehmen. Für die
              Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
              verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links
              umgehend.
            </p>
          </LegalSection>

          <LegalSection title="Urheberrecht">
            <p>
              Die durch die Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
              deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.
              Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
              oder Erstellers.
            </p>
          </LegalSection>

          <LegalSection title="Datenschutz">
            <p>
              Wie wir mit personenbezogenen Daten umgehen, steht in der{' '}
              <a href="/datenschutz">Datenschutzerklärung</a>. Fragen dazu richten Sie bitte an{' '}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            </p>
          </LegalSection>
        </div>
      </section>
    </div>
  );
}
