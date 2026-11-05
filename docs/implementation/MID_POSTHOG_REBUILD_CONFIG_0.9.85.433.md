# MID v0.9.85.433 – PostHog-EU-Buildkonfiguration nachziehen

## SHA-verifizierte Basis
Vor Änderung am 5. November 2026: `main` = `mid-stable` = `218d07bf290b5beff3c0643f3cc61852bab3156f` (MID v0.9.85.432). Die vorangegangene PostHog-Source-Integration #666 wurde über den regulären Release-ZIP-/Installer-/Worker-/Pages-/Stable-Pfad erfolgreich veröffentlicht (Installer `42059293729`).

## Ursache und Zweck
Bei dem Installer `42059293729` wurde der Web-Build vor der Einrichtung der beiden Repository-Variablen `VITE_POSTHOG_PROJECT_TOKEN` und `VITE_POSTHOG_HOST` ausgeführt; seine Build-Step-Umgebung wies beide als leer aus. Vite substituiert `import.meta.env.VITE_*` bereits beim Build. Deshalb genügt nachträgliches Setzen der Repository-Variablen nicht, um die bereits veröffentlichte Web/PWA-Datei zu aktivieren. Ein neuer versionierter Build ist notwendig.

Der Nutzer hat die Einrichtung beider Werte bestätigt; sie wurden weder gelesen noch protokolliert. Dieses Follow-up stellt **keine** Änderung des PostHog-Projekttokens, der Consent-Logik, des Datenvertrags oder des bestehenden Worker-Fachverhaltens dar. Es erstellt einen frischen Quell-Release `v0.9.85.433` auf verifizierter Stable-Basis, damit die unveränderten, bereits vorhandenen Buildschritte diese Konfiguration bei einem **neuen** Workflow-Start übernehmen können.

## Voraussetzungen und Grenzen
- GitHub Actions Repository-Variablen (keine Personal API Keys): öffentlicher PostHog-Project-Token `VITE_POSTHOG_PROJECT_TOKEN` und `VITE_POSTHOG_HOST=https://eu.i.posthog.com`.
- `src/posthogTelemetry.ts` bleibt für Web/PWA und ausdrückliches Opt-in, `$process_person_profile:false`, keine permanenten Kennungen, Ortsdaten oder Nutzertexte, EU-only, maximal 30 Events je Seitenaufruf.
- Keine Datenerfassung in nativen iOS-/Android-Laufzeiten; keine Session-Replays, Browser-Autocapture, kostenpflichtigen Dienste, Secret-Logs oder neuen Berechtigungen.
- Verbindliche MID-Source-/Security-/Installer-/Worker-/Pages-/Stable-Gates bleiben unverändert. Parallele WIP-Drafts #663–#665 werden nicht angetastet.
- Der **bereits gebaute** App-Build wird nicht nachträglich verändert. Eine neue Release-Version ist daher gemäß `AGENTS.md` vorgeschrieben.
- Kein Erfolgsversprechen: Erst auf dem neuen Installer SHA und mit belegter Buildkonfiguration sowie erfolgreichem Stable-Gate als veröffentlicht melden. Nach Promotion bleibt eine freiwillige Zustimmung in MID → Einstellungen → Systemstatus und anschließend ein frischer Start notwendig, damit `mid_runtime_ready` als reales Ereignis auftaucht.

## QA
- Vollständiger Source-PR-Gate einschließlich PostHog-Regression `scripts/test-posthog-telemetry-0985432.mjs`; danach ausschließlich automatischer SHA-gebundener Merge, serverseitiges Release-ZIP, `install-mid.yml`, Worker-/Pages-/Finalize- und Stable-Promotion.
- Beide GitHub-Variablen im neuen Installer nur auf **Vorhandensein** prüfen; niemals Werte, Tokenfragmente oder gesamte Umgebungsvariablen protokollieren.
- Nach Deployment Opt-in-Verfügbarkeit und reale, ausschließlich erlaubte Ereignisnamen im EU-PostHog-Projekt 329940 prüfen. **Keine** künstlichen Produktionsereignisse erzeugen, fehlende Messungen nicht als belegte Null interpretieren.
- PostHog-Dashboard https://eu.posthog.com/project/329940/dashboard/1087828 .
