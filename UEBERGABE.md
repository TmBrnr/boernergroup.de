# Übergabe an die Administration

boernergroup.de, neu gebaut. Diese Datei ist die Kurzfassung für die Person, die
das Ding deployt. Die ausführliche Dokumentation liegt in `README.md` und
`docs/` und ist auf Englisch.

## Das Release liegt fertig im Paket

**`out/` ist die Website.** Fertig gebaut, dreißig Seiten, kein Node zur
Laufzeit nötig. Den Inhalt des Ordners auf den Webspace kopieren und die Sache
läuft. Weiterleitungen für die drei alten englischen Pfade liegen als
`_redirects`, `.htaccess` und `vercel.json` dabei, je nachdem was der Hoster
liest.

## Ansehen, ohne etwas zu installieren

Doppelklick auf **`Website ansehen.command`** (Mac) oder
**`Website ansehen.bat`** (Windows). Startet einen kleinen lokalen Server und
öffnet den Browser. Beenden mit Strg+C im Fenster, das aufgeht.

Das ist genau der Ordner, der später hochgeladen wird, nur eben ausgeliefert
wie von einem Webserver.

Warum nicht einfach die HTML-Datei doppelklicken: über `file://` startet React
nicht, und dann bleiben die Einblendungen unsichtbar und interne Links tot. Die
Seite sieht dabei kaputt aus, obwohl sie es nicht ist. Deshalb der kleine
Server.

Der Quellcode liegt daneben, falls die Seite weiterentwickelt werden soll.

## Neu bauen

```bash
npm install
npm run dev        # Entwicklung, http://localhost:3000
npm run export     # baut out/ neu
npm run serve      # liefert out/ lokal aus, dasselbe wie der Doppelklick
npm run typecheck  # muss sauber durchlaufen
```

Getestet mit Node 22.

Wer lieber einen Node-Server betreibt, nimmt `npm run build && npm start`. Dann
laufen zusätzlich die Bildoptimierung und ein echter POST-Endpunkt für die
Formulare. Für diese Seite ist das nicht nötig: der statische Export kann
alles, außer dass die Formulare das Mailprogramm öffnen statt zu senden.

## Stack

Next.js 15 (App Router), TypeScript, Tailwind 3, Framer Motion. Inhalte als MDX
und JSON im Repository, kein CMS zu hosten, keine Datenbank. Alle 37 Routen
werden beim Build statisch erzeugt.

Schriften liegen als woff2 im Repository und werden vom eigenen Server
ausgeliefert. Es geht kein Request an Google Fonts. Das ist Absicht und gehört
so in der Datenschutzerklärung dokumentiert.

## Vor dem Livegang

1. **Domain setzen.** In `.env.local` die Zeile
   `NEXT_PUBLIC_SITE_URL=https://boernergroup.de` setzen und `npm run export`
   noch einmal laufen lassen. Davon hängen die kanonischen URLs, die Sitemap,
   der Feed und die Vorschaubilder ab. Im mitgelieferten `out/` steht bereits
   `https://boernergroup.de`. Wer unter einer anderen Domain testet, baut neu.

   Nur beim Node-Betrieb relevant: ohne `CONTACT_FORM_ENDPOINT` werden
   Formulareingaben serverseitig geloggt statt zugestellt. Im statischen Export
   öffnet das Formular ohnehin das Mailprogramm, da geht nichts verloren.

2. **Rechtliches.** `/impressum`, `/datenschutz` und `/barrierefreiheit` sind
   gebaut und mit den echten Registerdaten gefüllt. Zwei Lücken sind bewusst
   offen und stehen als solche auf der Seite:
   - die beiden Auftragsverarbeiter in `content/data/legal.json`, sobald Hoster
     und Formular-Backend feststehen. Mit beiden ist ein AV-Vertrag nach
     Art. 28 DSGVO nötig.
   - eine Telefonnummer in `content/data/innoshare.json` → `registry.phone`.
     Die Zeile im Impressum erscheint erst, wenn dort etwas steht.

   Die Datenschutzerklärung sollte vor dem Livegang anwaltlich geprüft werden.

3. **Weiterleitungen.** `/imprint`, `/privacy` und `/accessibility` leiten per
   301 auf die deutschen Pfade. Falls die alte Seite andere URLs hatte, gehören
   die in `next.config.mjs` → `redirects()` ergänzt.

4. **Bilder.** Es gibt keine Platzhalter. Zwölf Bilddateien insgesamt: zwei
   Fotos von Tobias, zehn selbst gezeichnete Grafiken aus `scripts/art/`, die
   sich jederzeit neu erzeugen lassen. Offen sind nur zwei Dinge, beide
   bewusst: ein Porträt von Tim, und die offiziellen Firmenlogos als SVG in
   `public/logos/`, wo derzeit typografische Provisorien liegen. Details in
   `docs/ASSETS.md`.

5. **Suchmaschinen.** `sitemap.xml` in der Search Console einreichen.
   `robots.txt` erlaubt ausdrücklich auch die KI-Crawler, das ist eine bewusste
   Entscheidung und lässt sich in `src/app/robots.ts` umdrehen.

## Inhalte pflegen

Nichts davon erfordert eine Änderung an `src/`:

| Was | Wo |
|---|---|
| Artikel | `content/articles/*.mdx`, Dateiname wird zur URL |
| Firmen | `content/data/companies.json` |
| Lebenslauf | `content/data/timeline.json` |
| Personen | `content/data/people.json` |
| Beratung | `content/data/innoshare.json` |
| Rechtliches | `content/data/legal.json` und `innoshare.json` → `registry` |
| Startseite | `content/data/site.json` |

Nach Änderungen an Inhalten `npm run export` laufen lassen, dann `npm run serve`
zum Nachsehen.

Vollständige Anleitung: `docs/CONTENT.md`.

## Weitere Dokumentation

| Datei | Inhalt |
|---|---|
| `README.md` | Stack, Routen, beide Build-Modi, Umgebungsvariablen |
| `docs/CONTENT.md` | Wie jeder Inhaltstyp gepflegt wird |
| `docs/ASSETS.md` | Jede Bilddatei, woher sie kommt, wie man sie neu erzeugt |
| `docs/BRAND.md` | Logo, Farben, Typografie, Regeln für Bewegung |
| `docs/SEO-GEO.md` | Was an strukturierten Daten drin ist und warum |

## Eine Bitte an die Redaktion

Keine Gedankenstriche in Texten. Weder Halbgeviertstrich noch Geviertstrich.
Punkt, Komma oder Doppelpunkt stattdessen. Das ist eine ausdrückliche Vorgabe
und im gesamten Bestand konsequent umgesetzt. `grep -rn "—\|–" .` muss leer
bleiben.
