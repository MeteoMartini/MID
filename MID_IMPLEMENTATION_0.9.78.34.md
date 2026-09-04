# MID v0.9.78.34

## Anlass
Die in v0.9.78.33 neu in die 7-Tage-Tageskacheln übernommene Skybar nutzte noch das meteorologische Tagesfenster (`dayPeriodHoursForDate`) und zeigte dadurch nur einen abgeschnittenen Tagesausschnitt statt des gesamten Kalendertags.

## Umsetzung
- `src/ForecastCockpit.tsx`: Die Tageskachel-Skybar verwendet nun `calendarDayHours=hours.filter(hour=>hour.time.startsWith(day.date))` und rendert damit den vollständigen 24-h-Verlauf des jeweiligen Prognosetags.
- Fallback bleibt erhalten: Falls ausnahmsweise keine vollständigen Kalendertag-Stunden vorliegen, wird weiterhin auf `dayHours` zurückgegriffen.
- Die bereits vorhandenen Niederschlags-Tooltips der Tageskachel wurden auf dieselbe Kalendertag-Stundenbasis vereinheitlicht.

## Regressionen
- `scripts/test-weather-profile-skybar-pills-097723.mjs` erweitert: schützt nun ausdrücklich, dass die Tageskachel-Skybar den vollständigen Kalendertag statt nur des Tagesfensters verwendet.

## Wirkung
Die 7-Tage-Tageskacheln zeigen die Skybar jetzt konsistent über den gesamten 24-h-Tag und nicht mehr nur über einen abgeschnittenen Teilbereich.

---

## Parallel-Chat-Integration desselben v0.9.78.34-Arbeitsstands

## CodeQL-Sicherheitshärtung #81–#90

- Sechs Regressionstests prüfen URL-Literale nicht länger über unvollständige Substrings. Der gemeinsame Testhelfer extrahiert HTTPS-URLs, parst sie mit `URL` und vergleicht Host bzw. vollständige URL exakt. Ähnlich benannte Angreiferdomains erfüllen den Vertrag damit nicht.
- Netatmo-OAuth-Rücksprünge werden nicht mehr in `sessionStorage` oder `localStorage` abgelegt. Der validierte Callback gelangt über einen einmalig konsumierbaren, flüchtigen In-Memory-Handoff zum Einstellungsbereich; Browser-/PWA-Rücksprünge bleiben zusätzlich direkt über die bereinigte Callback-URL funktionsfähig. Das serverseitige, zeitlich begrenzte OAuth-Ergebnis bleibt unverändert als Resilienzpfad bestehen.
- Die temporäre Wrangler-Konfiguration und ihre Metadaten entstehen in einem atomar erzeugten, zufälligen privaten Temp-Verzeichnis. Verzeichnis und Dateien erhalten restriktive Rechte; exklusive Dateierzeugung verhindert Symlink-/Überschreibungsangriffe. Der Installer reicht die zufälligen Pfade ausschließlich über Step-Outputs weiter.

## Offene Dependabot-PRs

Die verbliebenen PRs #6, #18 und #21 werden nicht übernommen. #6 und #21 verletzen durch isolierte React-19-Pakete den qualifizierten React-18.3.1-Vertrag. #18 ist mit Vite 6.4.3 nachweislich nicht lauffähig (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Eine spätere React-/Vite-Major-Migration bleibt ein eigener, vollständiger Kompatibilitätsmeilenstein.

Der Versuch, die drei PRs nach dokumentierter Begründung zu schließen, wurde vom verbundenen GitHub-App-Zugang jeweils mit `403 Resource not accessible by integration` abgewiesen. Die PRs bleiben deshalb offen, aber fachlich eindeutig als nicht übernahmefähig bewertet.

## Worker

Keine fachliche Workerlogik geändert. Die Worker-Dateien werden nur releaseweit auf v0.9.78.34 synchronisiert; nach semantischer Versionsnormalisierung ist kein Worker-Upload erforderlich.

## Abnahme

- `npm run verify`: TypeScript 7.0.2, Vite 6.4.3, Worker-Syntax und 657 automatisch erkannte Regressionstests bestanden.
- `npm run audit:dependencies`: keine HIGH-/CRITICAL-Befunde; nach Timeout des npm-Bulk-Endpunkts war der vorgesehene OSV-Fallback erfolgreich.
- `npm run test:release-upload-budget`: Transportvertrag und Größenbudget bestanden.
- Light-/Dark-Logoassets: alle 18 produktiv verwendeten Dateien stimmen bytegenau mit den freigegebenen Assetpaketen überein.
- Worker-Semantikvergleich v0.9.78.33 gegen v0.9.78.34: unverändert (`changed=false`).
