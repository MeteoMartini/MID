# MID v0.9.85.253 · Dependency-Audit-Evidenz (Issue #346)

Basis: main = mid-stable = 11b0ed2597cc13d3b1499febaaea626690733cd4 (.252). Keine offenen Source-PRs zum Start. Nur vertrauenswürdiger codex/*-Branch.

Der Doppelausfall von npm Bulk und OSV führte bislang in den gemeinsamen Clean-Logzweig. Jetzt getrennte checked/unknown/blocked-Zustände, Zeit, Lockfile-Hash, Quelle, Befunde und Providerfehler. JSON-Artefakt sowie Log-JSON und Step-Summary ohne Änderung der Workflow-Permissions. Report-Schreibfehler blockieren statt Belegverlust zu verstecken. Shape-/Vollständigkeitsprüfung verhindert malformed/partial response als Clean-Ergebnis.

Die schon bestehende deferred-external-service-outage-Policy bleibt erhalten (prüfbar in der vorhandenen .097831-Regressionspflicht); unknown ist explizit keine Sicherheitsfreigabe. Keine neue Lockerung. audit:all bleibt unabhängig und streng; echte HIGH/CRITICAL weiterhin Exit 1. OSV-CVSS-Vektorbewertung/Detailhydration ist nicht Umfang dieses Pakets; der bisherige Severity-Vertrag bleibt erhalten.

Die vorhandene Required-Regression ist um echte lokale HTTP-/Prozessfixtures ergänzt: npm sauber, npm-Ausfall/OSV sauber, beide 503, malformed OSV, npm HIGH, OSV CRITICAL. Isolierter temporärer Root und eigener Report verhindern Überschreibung anderer Audit-Evidenz; Summary, Hash, Fehleranzahl, Exit-Code und ausbleibendes Clean-Log werden geprüft.

Keine Codec-/UI-/CSS-/Modelländerungen. #344, #345, #348, #350, #352 und echte iOS/WKWebView/VoiceOver bleiben getrennt offen. Publikation nur über Source-Gate/Release-Bot/Installer/Pages/Stable.

## Zusätzlicher Sicherheitsbefund vor Freigabe

`npm run audit:all` am 14.10.2026 meldete source-map-js 1.2.1 HIGH (GHSA-68fv-2mgg-jv7q). PR #358 sofort zurück in Draft. Offizielle Advisory: https://github.com/advisories/GHSA-68fv-2mgg-jv7q, patched 1.2.2. Genau ein transitives Dev-Paket aktualisiert (`npm update source-map-js`), kein Override und keine Framework-Version geändert. Upgrade-Policy/Required-Lockfile-Test sichern den Patch. Bestehende drei moderate Dev-/iOS-Befunde bleiben upstream. Alle Checks nach dem Patch erneut erforderlich; ältere grüne Resultate reichen nicht.
