import type { Metadata } from 'next';

import { LegalList, LegalNav, LegalSection } from '@/components/Legal';
import { PageHeader } from '@/components/ui/PageHeader';
import { INNOSHARE, LEGAL } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Erklärung zur Barrierefreiheit',
  description: 'Erklärung zur Barrierefreiheit für boernergroup.de nach WCAG 2.2 Stufe AA.',
  path: '/barrierefreiheit',

});

export default function BarrierefreiheitPage() {
  const r = INNOSHARE.registry;
  const a = LEGAL.accessibility;

  return (
    <div lang="de">
      <PageHeader
        eyebrow="Erklärung zur Barrierefreiheit"
        title="Barrierefreiheit"
        intro="Diese Seite richtet sich nach WCAG 2.2 Stufe AA. Wo wir das Ziel noch nicht erreichen, steht es hier."
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Barrierefreiheit', path: '/barrierefreiheit' },
        ]}
      >
        <LegalNav current="barrierefreiheit" />
      </PageHeader>

      <section className="py-16 sm:py-20">
        <div className="shell max-w-4xl">
          <LegalSection title="Geltungsbereich">
            <p>
              Diese Erklärung gilt für die Website {r.website.replace(/^https?:\/\//, '')},
              betrieben von der {r.company}.
            </p>
            <p>
              Wir sind ein Kleinstunternehmen und erbringen ausschließlich Leistungen für andere
              Unternehmen und öffentliche Stellen. Nach unserer Einschätzung fallen wir damit nicht
              in den Anwendungsbereich des Barrierefreiheitsstärkungsgesetzes. Wir veröffentlichen
              diese Erklärung freiwillig, weil eine Website, die alle bedienen können, ohnehin die
              bessere Website ist.
            </p>
          </LegalSection>

          <LegalSection title="Stand der Vereinbarkeit">
            <p>
              Diese Website ist mit {a.standard} nach eigener Prüfung {a.status === 'largely conformant' ? 'weitgehend vereinbar' : a.status}.
            </p>
          </LegalSection>

          <LegalSection title="Was umgesetzt ist">
            <LegalList
              items={[
                'Semantische Auszeichnung: genau eine Hauptüberschrift je Seite, geordnete Zwischenüberschriften, echte Landmarken für Navigation, Inhalt und Fußbereich.',
                'Vollständige Bedienbarkeit per Tastatur, sichtbarer Fokusrahmen auf jedem interaktiven Element, ein Sprunglink zum Inhalt als erstes fokussierbares Element.',
                'Alle inhaltstragenden Bilder haben einen Alternativtext. Rein dekorative Grafiken sind für Screenreader ausgeblendet.',
                'Kontraste erfüllen mindestens das Verhältnis 4,5 zu 1 für Fließtext und 3 zu 1 für große Schrift und Bedienelemente.',
                'Bei aktivierter Einstellung "Bewegung reduzieren" stehen alle Animationen still. Die animierte Fläche auf der Startseite wird dann durch die gleiche Aussage als normale Überschrift ersetzt.',
                'Schriftgrößen sind in relativen Einheiten gesetzt und lassen sich bis 200 Prozent vergrößern, ohne dass Inhalt verloren geht.',
                'Formularfelder haben verknüpfte Beschriftungen, Fehlermeldungen werden angesagt.',
                'Die Seite funktioniert ohne JavaScript. Ohne Skripte erscheint statt der animierten Fläche der Text.',
              ]}
            />
          </LegalSection>

          <LegalSection title="Bekannte Einschränkungen">
            <LegalList items={a.knownGaps} />
          </LegalSection>

          <LegalSection title="Erstellung dieser Erklärung">
            <p>
              Diese Erklärung wurde am {formatDate(LEGAL.updated)} erstellt. Grundlage ist eine
              Selbstbewertung anhand der Erfolgskriterien der WCAG 2.2 Stufe AA. Eine Prüfung durch
              eine externe Stelle hat bisher nicht stattgefunden.
            </p>
          </LegalSection>

          <LegalSection title="Rückmeldung">
            <p>
              Ist Ihnen eine Barriere aufgefallen, schreiben Sie uns bitte an{' '}
              <a href={`mailto:${r.email}`}>{r.email}</a>. Beschreiben Sie kurz, wo das Problem
              auftrat und welches Gerät und welche Hilfstechnik Sie verwenden. Wir antworten
              innerhalb von zwei Werktagen und nennen Ihnen, bis wann wir die Stelle beheben.
            </p>
          </LegalSection>
        </div>
      </section>
    </div>
  );
}
