# MID v0.9.85.432 – PostHog EU Web/PWA Telemetrie (Source-Kandidat)

Stand der Quellbasis: `mid-stable` = `main` `77de0e326d586274d5f42f0ea63827a887d1b147`, v0.9.85.431. Der Release ist **nicht** durch dieses Dokument freigegeben. Maßgeblich bleiben Source-PR-Gate, kontrollierter SHA-Merge, serverseitiges Release-ZIP, `install-mid.yml`, Worker/Pages-Gates und erfolgreiche Stable-Promotion. Parallelkandidaten #665, #664, #663 und weitere offene PRs werden nicht überschrieben.

## Datensparsamkeit und Rechtsgrundlage
- Einwilligung in MID → Einstellungen → Systemstatus: explizites Opt-in, lokal gespeichert. Standard OFF, Revoke sofort wirksam; laufende Übertragungen werden abgebrochen.
- Keine SDK-Autocapture-Funktion, Cookies, User-Identify, Session-Replay, Replays, Heatmaps oder permanente Nutzer-/Gerätekennung.
- Pro Seite wird nach Zustimmung ein nicht persistierter Zufallswert als PostHog-`distinct_id` erzeugt. `$process_person_profile:false` unterdrückt das Personenprofil. Maximal 30 Events je Seitenladung. Kein automatischer Retry bei Netzwerkfehlern.
- Ereignisse: `mid_runtime_ready` (Version, Plattform, Startdauer, vorhandene Navigation-Timings), `mid_navigation_attempt` (nur feste Tab-IDs), `mid_client_error` (nur vordefinierte Fehlerkategorie). Keine Stacktraces, Fehlermeldungen, URL, Referrer, Freitext, persönliche Daten, Koordinaten, Ortsnamen oder Favoriten. Fehlerkategorien sind ausdrücklich keine vollständige Ursachenanalyse; keine automatische PostHog-`$exception`-Issue-Erzeugung.
- Nur Web/PWA: `isMidNativeRuntime()` verhindert native iOS-/Android-Erfassung. Die bestehende Apple-Privacy-Deklaration und Cloudflare RUM bleiben unverändert. Eine spätere native Freigabe braucht gesonderten Datenschutz-/Manifest-Review.
- HTTPS ausschließlich `https://eu.i.posthog.com/i/v0/e/`, `credentials:omit`, `referrerPolicy:no-referrer`, `cache:no-store`. Beide Buildvariablen `VITE_POSTHOG_PROJECT_TOKEN` (öffentlicher Project-Ingestion-Key) und `VITE_POSTHOG_HOST` (EU) müssen gesetzt sein; fehlt einer, ist die Erfassung deaktiviert.
- EU-PostHog-Projekt-ID 329940; serverseitige IP-Anonymisierung geprüft. Vor Nutzerfreigabe ist eine DSGVO-/Informationspflichtprüfung der eingesetzten Analytik einschließlich bestehender Cloudflare-RUM und Einwilligungstexte erforderlich.

## Kosten
PostHog Free-Plan geprüft, keine kostenpflichtigen Produktabonnements. Kontingent am 5.11.2026: 1.000.000 Product-Analytics-Events, 0 benutzt. Der rein clientseitige 30-Events-Deckel reduziert Aufkommen, ist aber **kein** serverseitiges Monats-/Kostenlimit. Bei planmäßigem Wachstum oder Tarifänderung Billing-Limits erneut prüfen, niemals zahlungspflichtige Tarife ohne ausdrückliche Freigabe.

## Build / QA
- Neues `scripts/test-posthog-telemetry-0985432.mjs`: simulierte Opt-in/Opt-out-, Nicht-EU-/Native-/Missing-Token-, Feldminimierungs-, Fehler-/Navigations- und Event-Budget-Checks. Release-Gate bleibt zusätzlich verbindlich.
- Kein npm-Paket und kein Drittanbieter-Script erforderlich: PostHog offizielle Capture-API `/i/v0/e/`, dokumentiert unter https://posthog.com/docs/api/capture .
- Die Integration enthält eine strikt allowlist-basierte Telemetrie und keine meteorologischen Eingriffe. `missing` bleibt `missing`; Laufzeiten nur bei gültiger numerischer Messung.
- Neue öff. Repo-Variablen `VITE_POSTHOG_PROJECT_TOKEN` und `VITE_POSTHOG_HOST=https://eu.i.posthog.com` sind vor dem ersten Live-Event in der bewährten Deploymentkonfiguration einzurichten. Keine persönlichen API-Schlüssel in Repository oder Buildlogs kopieren.
- Ein Browser-/Unit-Test ist keine reale iOS-/VoiceOver-Abnahme.
- Dashboard: https://eu.posthog.com/project/329940/dashboard/1087828 . Initiale Anzeige enthält keine verifizierten Ereignisse und darf nicht als produktive Telemetrie bezeichnet werden.

## Ergebnisgrenze
Quellcode/Dashboard vorbereitet; „veröffentlicht“, „grün“ und „erfasst Daten“ dürfen ausschließlich nach belegten jeweiligen Erfolgen gemeldet werden.
