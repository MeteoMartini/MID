# MID 18.2.37 – .284 vorbereiteter Ganztages-/Push-Härtungsstand

## Verifizierte Basis / Provenienz

Source: `main=mid-stable=b02d1b018882807fbce114cf6816f520f52339d1` (v0.9.85.282, Installer #39038958909 grün). Beim Start ist .283 im separaten autorisierten PR #399 noch nicht veröffentlicht. Diese Arbeit wird auf dem isolierten `chatgpt/v0.9.85.284-full-day-skybar` vorbereitet und **erst nach SHA-verifizierter .283-Stable-Promotion** anhand der neueren Basis neu integriert. Nicht als Release oder erfolgreichen Browser-/iOS-Test behandeln.

## Nutzerfehler #401

- Unter *Aktuell* beschränkte der erste Skybar-Stundenstreifen seine Basis auf `shortTermProfileHourlyPoints(buildShortTermForecast(... now))` – die bereits verstrichenen Minuten der angezeigten vollen Stunde waren nicht in der Quellreihe. Korrektur: nur tatsächlich verfügbare echte `Hour.epoch`-Stunden über den kompletten 12-Stunden-Chart verwenden, präzise Endpositionen, Kurzfrist-Niederschlagsüberlagerung weiterhin nur dort, wo 15-Minuten-Nowcast belegt ist; niemals fehlende Vergangenheit synthetisieren.
- `reconcileForecastDaysWithHours` verwendete `nearTerm / futureRelevant / futureFraction`, wodurch Regen, Regenanteil, Schauer, Schnee, PoP und Tagescode im heutigen *Day*-Objekt durch Zukunftsdaten ersetzt wurden. Korrektur: echter lokaler 00–24-Uhr-Tag, `daySkybarCalendarWindow` + `daySkybarUnavailableRanges`; vollständige 23/24/25-Stunden-Serie ist Voraussetzung für tägliche Stundenaggregation. Bei unvollständiger Serie bleiben Tagesanbieterwerte mit deren Provenienz maßgeblich. Fehlende Werte nicht als 0 interpretieren.
- Der Sunshine-Daily-Fallback verwendete bislang bereits 18 Stunden als vermeintliche Ganztagsabdeckung. Geprüfte erste und letzte lokale Stunde sowie wirkliche Tagesdauer (23/24/25 Stunden) sind jetzt erforderlich, sonst Tagesanbieterwert/Fallback. Ein vollumfänglicher, vorhersagebasierter Tageswert ist **keine Messsummierung** bereits beobachteten Wetters.

## Nutzerfehler #400

- Der Client serialisiert `push-subscribe`-Übertragungen auf diesem Gerät, übermittelt den zum Ausführungszeitpunkt gespeicherten Modus und verlangt die Bestätigung aus der Worker-Antwort. Server-Status liefert den gespeicherten Modus, UI unterscheidet unbestätigte lokale Speicherung und bestätigte Serverübernahme.
- Scheduler prüft vor KV-Zurückschreiben, ob die Konfiguration zwischenzeitlich aktualisiert wurde. Ein vorhandener Push-Payload kann für maximal TTL 300 s nach Versand noch verzögert zugestellt werden und kann durch die später geänderte Einstellung nicht rückwirkend modifiziert werden. Keine gerätebestätigte End-to-End-Push-Abnahme ohne echte Zustellung.

## Pflichtprüfungen vor Source-PR

- `node scripts/test-mid284-complete-calendar-day-current.mjs`: 09:45 vollständige 09–10-Uhr-Basis, Regen um 02 Uhr noch als Tagessumme 17:30 Uhr, 18h-lückenhafter stündlicher Fallback, Sunshine, 23/25h-DST, keine synthetischen Daten.
- `node scripts/test-mid284-push-absolute-sync.mjs`: paralleler alter/nachfolgender neuer Präferenz-POST, Worker-Acknowledgment, serverseitiger Status und KV-Konfigurationsschutz.
- Dazu alle bestehenden App-/Skybar-/Nowcast-/7-/14-Tage-/Widget- und Push-Regressionen sowie responsive Browser-Screenshots (Light/Dark, Small/Large iPhone, Tablet, Desktop); Datenmenge, Modelllauf, Akkumulationsfenster, Niederschlagsphysik, Sonnenstand und Zeitzonen konsistent prüfen.
- Nach .283 Stable: neuen Head/SHA und Version .284, `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, Versionsspiegel, Changelogs, Worker-Aggregate, Module CSS, SHA-gebundene PR-Gates und Installer erneut verifizieren. **Kein Release ohne vollständige Evidenz.**
