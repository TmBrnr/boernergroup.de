import type { Metadata } from 'next';

import { LegalList, LegalNav, LegalRow, LegalSection } from '@/components/Legal';
import { PageHeader } from '@/components/ui/PageHeader';
import { INNOSHARE, LEGAL, SITE } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Datenschutzerklärung',
  description:
    'Informationen zur Verarbeitung personenbezogener Daten nach Art. 13 DSGVO auf boernergroup.de.',
  path: '/datenschutz',

});

export default function DatenschutzPage() {
  const r = INNOSHARE.registry;
  const a = LEGAL.supervisoryAuthority;

  return (
    <div lang="de">
      <PageHeader
        eyebrow="Informationen nach Art. 13 DSGVO"
        title="Datenschutzerklärung"
        intro="Diese Website ist statisch, setzt keine Cookies und lädt nichts von Dritten nach. Es bleibt trotzdem einiges zu erklären, und zwar genau das, was tatsächlich passiert."
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Datenschutz', path: '/datenschutz' },
        ]}
      >
        <LegalNav current="datenschutz" />
      </PageHeader>

      <section className="py-16 sm:py-20">
        <div className="shell max-w-4xl">
          <h2 className="eyebrow">Verantwortlicher</h2>
          <dl className="mt-6">
            <LegalRow label="Verantwortlich">{r.company}</LegalRow>
            <LegalRow label="Anschrift">
              {r.street}, {r.postcode} {r.city}, {r.country}
            </LegalRow>
            <LegalRow label="Vertreten durch">{r.managingDirectors.join(' und ')}</LegalRow>
            <LegalRow label="Kontakt">
              <a href={`mailto:${r.email}`} className="link-draw">
                {r.email}
              </a>
            </LegalRow>
            <LegalRow label="Stand">{formatDate(LEGAL.updated)}</LegalRow>
          </dl>

          <LegalSection title="Datenschutzbeauftragter">
            <p>
              Wir sind gesetzlich nicht verpflichtet, eine Datenschutzbeauftragte oder einen
              Datenschutzbeauftragten zu benennen, und haben dies nicht getan. Alle Anliegen zum
              Datenschutz richten Sie bitte an{' '}
              <a href={`mailto:${r.email}`}>{r.email}</a>.
            </p>
          </LegalSection>

          <LegalSection title="Was diese Website nicht tut">
            <LegalList items={LEGAL.notCollected} />
          </LegalSection>

          <LegalSection id="server" title="Aufruf der Website und Server-Logfiles">
            <p>
              Beim Aufruf einer Seite überträgt Ihr Browser technisch notwendige Daten an unseren
              Hoster. Dieser speichert sie kurzzeitig in Logdateien:
            </p>
            <LegalList
              items={[
                'IP-Adresse des anfragenden Geräts',
                'Datum und Uhrzeit des Zugriffs',
                'aufgerufene Adresse und übertragene Datenmenge',
                'Meldung, ob der Abruf erfolgreich war',
                'Browsertyp, Version und Betriebssystem',
                'die zuvor besuchte Seite, sofern Ihr Browser sie übermittelt',
              ]}
            />
            <p>
              <strong>Zweck und Rechtsgrundlage.</strong> Diese Verarbeitung ist erforderlich, um
              die Website auszuliefern, ihre Stabilität zu sichern und Angriffe zu erkennen.
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im
              sicheren und störungsfreien Betrieb.
            </p>
            <p>
              <strong>Speicherdauer.</strong> Logdaten werden nach spätestens 30 Tagen gelöscht oder
              gekürzt, sofern sie nicht zur Aufklärung eines konkreten Sicherheitsvorfalls
              erforderlich sind. Eine Zusammenführung mit anderen Datenquellen findet nicht statt.
            </p>
          </LegalSection>

          <LegalSection id="kontakt" title="Kontakt per E-Mail">
            <p>
              Wenn Sie uns per E-Mail schreiben, verarbeiten wir die von
              Ihnen angegebenen Daten: Name, E-Mail-Adresse, Organisation, Betreff und Ihre
              Nachricht. Diese Angaben nutzen wir ausschließlich, um Ihr Anliegen zu beantworten.
            </p>
            <p>
              <strong>Rechtsgrundlage.</strong> Zielt Ihre Anfrage auf einen Vertrag oder dessen
              Anbahnung, ist dies Art. 6 Abs. 1 lit. b DSGVO. In allen übrigen Fällen stützen wir
              uns auf Art. 6 Abs. 1 lit. f DSGVO, mit dem berechtigten Interesse, Anfragen
              zuverlässig zu beantworten.
            </p>
            <p>
              <strong>Speicherdauer.</strong> Wir bewahren Ihre Nachricht auf, solange sie zur
              Bearbeitung nötig ist, danach höchstens sechs Monate zur Nachvollziehbarkeit.
              Handelsrechtliche und steuerrechtliche Aufbewahrungsfristen bleiben unberührt.
            </p>
          </LegalSection>

          <LegalSection id="newsletter" title="Newsletter">
            <p>
              Wenn Sie den Newsletter abonnieren, verarbeiten wir Ihre E-Mail-Adresse auf Grundlage
              Ihrer Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Sie können die Einwilligung
              jederzeit widerrufen, etwa über den Abmeldelink in jeder Nachricht oder formlos per
              E-Mail. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt
              unberührt.
            </p>
          </LegalSection>

          <LegalSection id="auftragsverarbeiter" title="Auftragsverarbeiter">
            <p>
              Wir setzen Dienstleister ein, die personenbezogene Daten in unserem Auftrag und nach
              unserer Weisung verarbeiten. Mit jedem besteht ein Vertrag zur Auftragsverarbeitung
              nach Art. 28 DSGVO.
            </p>
            <ul className="mt-1 flex flex-col gap-4">
              {LEGAL.processors.map((processor) => (
                <li key={processor.name} className="border-t border-line/[0.07] pt-4">
                  <p className="text-[0.9375rem] font-medium text-bone/85">
                    {processor.url ? (
                      <a href={processor.url} target="_blank" rel="noreferrer noopener">
                        {processor.name}
                      </a>
                    ) : (
                      processor.name
                    )}
                  </p>
                  <p className="mt-1">{processor.role}</p>
                  {processor.note ? (
                    <p className="mt-1 text-[0.8125rem] text-faint">{processor.note}</p>
                  ) : null}
                  {processor.transfer ? (
                    <p className="mt-1 text-[0.8125rem] text-faint">{processor.transfer}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p>
              <strong>Übermittlung in Drittländer.</strong> Sollte ein Dienstleister Daten außerhalb
              des Europäischen Wirtschaftsraums verarbeiten, geschieht dies nur auf Grundlage eines
              Angemessenheitsbeschlusses der EU-Kommission oder der Standardvertragsklauseln nach
              Art. 46 Abs. 2 lit. c DSGVO, ergänzt um zusätzliche Schutzmaßnahmen.
            </p>
          </LegalSection>

          <LegalSection id="hosting" title="Schriften und externe Inhalte">
            <p>
              Alle Schriften werden von unserem eigenen Server ausgeliefert. Es besteht keine
              Verbindung zu Google Fonts oder einem anderen Schriftanbieter, und es wird keine
              IP-Adresse an Dritte übertragen. Karten, Videos, Social-Plugins und externe Player
              sind nicht eingebunden.
            </p>
            <p>
              Vorschaubilder für soziale Netzwerke erzeugen wir selbst auf unserem Server. Ein
              externer Bilddienst wird dafür nicht verwendet.
            </p>
          </LegalSection>

          <LegalSection id="rechte" title="Ihre Rechte">
            <p>Ihnen stehen gegenüber uns die folgenden Rechte zu:</p>
            <LegalList
              items={[
                'Auskunft über die zu Ihrer Person gespeicherten Daten nach Art. 15 DSGVO',
                'Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten nach Art. 16 DSGVO',
                'Löschung nach Art. 17 DSGVO, soweit keine Aufbewahrungspflicht entgegensteht',
                'Einschränkung der Verarbeitung nach Art. 18 DSGVO',
                'Datenübertragbarkeit nach Art. 20 DSGVO',
                'Widerruf einer erteilten Einwilligung nach Art. 7 Abs. 3 DSGVO mit Wirkung für die Zukunft',
              ]}
            />
            <p>
              <strong>Widerspruchsrecht nach Art. 21 DSGVO.</strong> Soweit wir Daten auf Grundlage
              eines berechtigten Interesses verarbeiten, können Sie der Verarbeitung aus Gründen,
              die sich aus Ihrer besonderen Situation ergeben, jederzeit widersprechen. Wir
              verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende
              schutzwürdige Gründe nachweisen, die Ihre Interessen überwiegen.
            </p>
            <p>
              Zur Ausübung genügt eine formlose Nachricht an{' '}
              <a href={`mailto:${r.email}`}>{r.email}</a>. Ein Nachweis Ihrer Identität kann
              erforderlich sein, damit wir keine Daten an Unbefugte herausgeben.
            </p>
          </LegalSection>

          <LegalSection id="beschwerde" title="Beschwerderecht bei der Aufsichtsbehörde">
            <p>
              Unabhängig davon können Sie sich nach Art. 77 DSGVO bei einer Aufsichtsbehörde
              beschweren. Für uns zuständig ist:
            </p>
            <p>
              {a.name}
              <br />
              {a.street}, {a.postcode} {a.city}
              <br />
              <a href={a.url} target="_blank" rel="noreferrer noopener">
                {a.url.replace(/^https?:\/\//, '')}
              </a>
            </p>
          </LegalSection>

          <LegalSection title="Pflicht zur Bereitstellung und Datensicherheit">
            <p>
              Sie sind weder gesetzlich noch vertraglich verpflichtet, uns personenbezogene Daten
              bereitzustellen. Ohne die im Formular als erforderlich gekennzeichneten Angaben können
              wir Ihre Anfrage jedoch nicht beantworten.
            </p>
            <p>
              Die Website wird ausschließlich über eine verschlüsselte Verbindung ausgeliefert
              (TLS). Ob die Verbindung verschlüsselt ist, erkennen Sie am Schlosssymbol Ihres
              Browsers.
            </p>
          </LegalSection>

          <LegalSection title="Änderungen dieser Erklärung">
            <p>
              Wir passen diese Erklärung an, wenn sich die Website oder die Rechtslage ändert. Es
              gilt jeweils die hier abrufbare Fassung. Stand: {formatDate(LEGAL.updated)}. Fragen an{' '}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            </p>
          </LegalSection>
        </div>
      </section>
    </div>
  );
}
