## Source-Gate-Nachtrag

Der erste vollständige .435-Source-Lauf42090883593 fand zwei weitere veraltete Teilabdeckungs-Erwartungen in `test-shortterm-german-word-order-09767.mjs` und `test-precipitation-shortterm-coherence-0985211.mjs`. Beide wurden auf die vollständige explizite Unvollständigkeitsmeldung korrigiert (exakte Gleichheit statt schwächerem Regex); deutsche Zeitphrasen und keine Niederschlagserfindung aus PoP bleiben geschützt. Beide Originaltests und die Hauptregression danach erfolgreich. Produktcode unverändert; erneuter vollständiger Source-Lauf auf neuem SHA zwingend.

## C55-Integration des geprüften Teilumfangs

Auf ausdrücklichen Nutzerauftrag wird der lückenfeste Kurzfrist-Fix aus diesem Draft zu einem synchron versionierten .435-Source-Kandidaten qualifiziert. Originale bestehende Regression unter Node22.16.0 erfolgreich, einschließlich sämtlicher ergänzter Lücken-/Missing-/Überlappungsfälle. App-/Tooling-TypeScript, Vite-Produktionsbuild, unverändertes vollständiges Webbudget, Versions-/Aggregatspiegel sowie benachbarte Nebel-, ungültige Intervall-, nachlaufende Niederschlags- und Darstellungsparitätstests erfolgreich. Pflichtinventar1079 unverändert. Vollständige Source-/Installer-/Worker-/Pages-/Finalize-Gates stehen auf endgültigem SHA noch aus. Der folgende ursprüngliche Draftbericht dokumentiert Herkunft und offene Restarbeiten, keine vollständige Forecast-Audit-Abnahme.

# MID v0.9.85.435 · wiederaufgenommener Forecast-Audit (DRAFT, nicht veröffentlicht)

## Live-Provenienz
Auf Nutzerauftrag wurde der GitHub Copilot Cloud Run [42074340393 / Job 127410406033](https://github.com/MeteoMartini/MID/actions/runs/42074340393/job/127410406033) vom 05.11.2026 untersucht. Er beendete nach 3.540.000 ms mit Agent-Session-Timeout; aufgerufene unvollständige `npm run test:regressions`-Prozesse wurden beendet, die Git-Autosicherung scheiterte nach `git checkout`. Copilot hatte einen legitimen, aber nur am damaligen Stable gestarteten Branch `chatgpt/v0.9.85.435-forecast-audit` erzeugt; Live-Readback zeigte anschließend **keinen Commit zusätzlich zu Stable**. Nicht gesicherte Änderungen, lokale Testergebnisse und sein unvollständiger Arbeitstext werden ausdrücklich **nicht** als wiederhergestellt behauptet.

Die neue verifizierte Basis war `main=mid-stable` v0.9.85.434 SHA `994ea3bcf1ab20e7036f50a92b7033b44b538804`; fünf GitHub-Rulesets aktiv. Historische PostHog-/UI-Ergonomie-Entwicklungen .432–.434 bleiben erhalten. Diese separate Vertrauenszone schreibt nur auf den SHA-gebundenen autorisierten `chatgpt/*`-Branch, nicht auf Produktionsrefs. Kein Copilot-Workflow oder Token geändert.

## Reproduzierbarer tatsächlicher Befund
`src/shortTermSignificantBrief.ts` gab bereits nach **nur zwei trockenen bekannten Stunden** den uneingeschränkten Satz **„Keine markanten Wetterereignisse in den nächsten 24 Stunden.“** zurück; die vorhandene `scripts/test-short-term-brief-chart-0985289.mjs` erwartete diesen Satz bislang sogar explizit. Das ist meteorologisch nicht zulässig, weil unbekannte Zeitintervalle und unbekannte Böen nicht als 24h-Negativnachweis gelten dürfen. Die Aussage entstammt der eigenen MID-Prognoselogik, **keiner amtlichen DWD-Warnung**.

## Korrektur in diesem Draft
- Ereignis-Signale (Niederschlag/Böen) bleiben unverändert und werden weiterhin auch bei Teilabdeckung angezeigt.
- Eine uneingeschränkte *24-Stunden-Entwarnung* setzt **ab jetzt** zugleich voraus: Erster gültiger Bucket deckt `now` ab, letztes Ende reicht mindestens bis `now+24h`, alle Buckets sind lücken-/überlappungsfrei bis auf 1s Rundungstoleranz, jeder Bucket ist höchstens 1h lang und hat sowohl eine nichtnegative endliche Niederschlagsmenge als auch einen nichtnegativen endlichen Böenwert. Alles in absoluten Epochenmillisekunden; 23-/25-Stunden-Ortstage werden **nicht** starr auf 24 lokale Kalenderstunden abgebildet.
- Sind nur Teile bekannt, bleibt eine begrenzte, ausdrücklich gekennzeichnete Aussage: `Keine markanten Signale in den vorliegenden Kurzfristdaten; 24-Stunden-Abdeckung unvollständig.` Sind beide Grundgrößen unbekannt, bleibt `Kurzfristdaten unvollständig.` Die Anwesenheit eines tatsächlichen Events behält Vorrang.
- Kein Missing→0, keine zusätzlichen Anbieterabrufe, keine Änderung an WMO-/DWD-Warnungen, Hyperlokal/Nowcast/Gewichtung, Modellen, Widgets/Exporten oder Releasekonfiguration.

## Regressionen und Grenzen
Die *bestehende* Pflichtregression `scripts/test-short-term-brief-chart-0985289.mjs` wird gezielt um fünf unabhängige negative/positive Randfälle erweitert: nur zwei Stunden, vollständige 24h, Lücke, verspäteter Beginn, unbekannte Menge, unbekannte Böe, 24h-Aggregat und Zeitüberlappung. Keine neuen Regressionen werden erfunden oder aus Baseline-/Package-Inventar entfernt. **Sechs isolierte Coverage-Prädikatsfälle** auf Node 22.16.0 im aktuellen ChatGPT-Container waren erfolgreich; sie sind **keine** ausgeführte Original-Repository-Regression oder CI-Qualifikation.

Nach SHA-gebundener PR-Integration müssen `npm ci`, echte `node scripts/test-short-term-brief-chart-0985289.mjs` (Pflichtinventar in `MID_BASELINE.json`, ohne separaten npm-Script-Alias), die benachbarten Wettertext-/NoData-/PoP-/Nacht-/Nebel-/Karten-/Browser-/Versionstests und die vollständigen 1079+ vertraglichen Source-/Installer-Gates erneut auf dem **finalen** Source-Head bestehen. Ein Pilot allein ist keine Freigabe.

## Noch ausdrücklich offen aus Copilots breiterem Forecast-Audit
- `src/SevenDayForecastSummary.tsx`: tägliche/zeitbezogene PoP, NoData-Verhalten und echte Temperatur-/Wetterereignispriorität auf vollständigem Stundenvertrag und den bestehenden textgenauen Regressionen prüfen.
- `src/App.tsx`: `precipitationNowSummary`/`combineRadarAndModel` und die „Niederschlagsrisiko jetzt“-Zeitbasis; fehlende Modellwahrscheinlichkeit vs. Radarsignal, Zeitfensterbeschriftung und echte unabhängige Quellprovenienz prüfen.
- `shortTermFogRisk.ts`: Phänomenbeobachtung gegen prognostiziertes Nebelrisiko abgrenzen, fehlende Feuchte/Wind-/Sichtfelder nicht still zu Null setzen; WMO-/DWD-Sichtvertrag.
- Responsive, Farb-/Fokus-/LightDark, Grafiken, Widgets und echte Browser-/Simulator-Abnahme auf aktuellem Stable; historische Copilot-Browserinteraktion ist keine Produktabnahme.

**Release:** Dies ist ein DRAFT ohne Versionsbump und kein auszuliefernder Build `.435`. Nur ein vollständig versionierter, aggregat- und regressionsgeprüfter integrativer Source-PR darf nach dem bestehenden MID-Source-Gate den SHA-gebundenen Bot, serverseitiges ZIP, `install-mid.yml`, Worker/Pages/Finalize und Stable-Promotion erreichen. Keine Änderung an Rulesets, CI, Credits oder produktiven Secrets.
