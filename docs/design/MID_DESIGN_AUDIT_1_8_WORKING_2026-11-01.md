# MID-Designaudit 1.8 – SHA-gebundener offener Audit-/Releasezug

**Status: Source-Draft, ausdrücklich kein freigegebener Build, keine abgeschlossene A0–A5-Abnahme.**

## Verifizierte Ausgangsbasis und Sperren

- GitHub `MeteoMartini/MID`, `main=mid-stable` v0.9.85.402 SHA `1888cb97149855aa8d63f74fecad9c4f245ee02d`; Installer #41325206572 komplett mit Core, Heavy, Worker, Pages, Finalize und Stable-Promotion erfolgreich. Fünf aktive Rulesets und 1059 bisherige Pflichtregressionen.
- Eigener unveröffentlichter Entwicklungsbranch: `chatgpt/v0.9.85.404-designaudit18-extreme-coverage`, aus exakt dieser Stable-SHA abgeleitet. Die .404 im Branchnamen ist ausschließlich eine künftige Versionseinordnung. Kein Versionsspiegel/Changelog geändert und kein Build als .404 behauptet.
- **Parallel:** .403-RUC-Integrations-PR #588 HEAD `b56544b8e1a13cf77ee51c4b622682dfd1bc3b49` ist ein eigener non-draft Releasezug; Source-Run #41327414903 fehlgeschlagen: Heavy Unified Map 3/3 überschritt die bestehende 13-Minuten-Zeitgrenze, während Core und andere Heavy-Shards erfolgreich waren. Keine heimliche Übernahme, Umstellung oder Gate-Lockerung.
- Karten-Idle-Vorlade-Draft #589 HEAD `43670f128c594dc0d9ce5bf74c9fe3a42f2fde0b` besitzt drei getrennte fachliche Dateien, aber kollidierende .403-Versionierungsdateien. Nur nach .403-Stable-Promotion aus verifiziertem HEAD gezielt auf neuer Stable-Basis für den Sammelrelease qualifizieren, nicht die .403-Spiegel übernehmen.
- Frühere #580 ist nur historischer Audit-Draft; die dafür tatsächlich übernommenen Fixes wurden mit .402 veröffentlicht. RUC/D2-Drafts separat; kein stillschweigender Release dieser Arbeiten.

## Aktuelle isolierte Audit-Korrektur · Extremwetter-Ausblick

**Ehemaliger Renderpfad:** Der Panel-Render filterte das gesamte Raster für sichtbare Signale und prüfte die verfügbare Gefahrenerfassung erneut für die ausgewählte Gefahr sowie drei weitere Gefahren. Bei jeder lokalen Panel-Aktualisierung konnten große Arrays und weitere Vollraster-Durchläufe entstehen, obwohl die Datenidentität und der Zeitabschnitt unverändert blieben. Selbst wenn die Ensembleabdeckung für den Langfrist-Ausblick unzureichend war, wurden bislang Regionen-/Kontur- und Karten-Feature-Daten berechnet, die später nicht gerendert wurden.

**Source-Kandidat:** `src/extremeOutlookAssessment.ts` ermittelt Signalanzahl, belegte Zellen, per-Gefahr-Abdeckung und den unveränderten bestehenden Langfrist-65%-Admission-Status in **einem** Rasterdurchlauf. Das Panel verwendet `useMemo` mit Daten-/Gefahr-/Zeitraum-Identität und verzichtet bei unzureichender Abdeckung auf teure Regionskonturen und `buildMapData`. Der Shared-Contour-Cache aus .402 bleibt unverändert.

**Fachgrenzen:** Eine echte Null in vorhandenen Wahrscheinlichkeitsfeldern zählt als auswertbare Daten, ein fehlendes Feld nicht. Keine Änderung an DWD-Warnungen, MID-Hazard-Stufen, Schwellen, Intensität, Unsicherheit, Contour/Visual-Glättung, Prognosewerten, Modellfeldern, Akkumulation, Zeitstempel, Veröffentlichungslogik, Datenquellen oder Worker. Die Kurzfrist-Admission bleibt unverändert. Diese UI-Rechenreduktion behauptet weder eine konkrete Laufzeitverbesserung noch vollständige meteorologische Validierung.

**Regression:** Das bereits verpflichtende `scripts/test-extreme-outlook-modelled-areas-096618.mjs` wird um real ausgeführte, mit esbuild kompilierte Gegenproben ergänzt: bestehende Schwellen- und Sichtbarkeitssignale, belegte Nullfelder, fehlende Gefahrenfelder, 75%-vs.-50%-Abdeckung, getrennte Gefahrengliederung. Die bestehende Kontur- und Regionenidentität-Prüfung bleibt bestehen. Vollständige Source-, Browser-, Worker-, Installer- und Geräteabnahme noch nicht ausgeführt; keine grüne Behauptung vor realen Logs.

## A0–A5 · priorisierte offene Abnahmematrix

| Teil | Offener Prüfschwerpunkt | Nachweis/Blocker |
|---|---|---|
| A0 Daten/Provenienz | Einheit, Modelllauf, gültiger Zeitpunkt, Akkumulationsfenster, Datenlücken und echte 0 vs. Missing in gemeinsamem Quellrenderer; keine amtliche Warnungsvermischung | Echtdatensätze und Verbraucherpfad nicht vollständig geprüft; keine pauschale Abnahme |
| A1 Aktuell/Heute | Skybar-Zeit-/Phasenkohärenz, 24-h-Warnung zu früh, Niederschlag PoP vs. Menge, tatsächliche Quellhinweise | Reale Zeiten/Standorte, DST 23/25h, Light/Dark und Browser-Screenshots fehlen |
| A2 Vorhersage | 12h/7d/14d, ENS-Quantil- und Linienvertrag, NoData-Lücken/fehlende Modellfelder | App-/Widget-/Export-Gegenprobe offen |
| A3 Karten | 10-s-Nutzerbefund; First Visible, Interactive, Idle, Anforderungs-/Chunk-Wasserfall; absolute und relative Gültigkeitszeit; WMS-Originalfarben/Legenden/Export; kompakte Modell-/Beobachtungswahl | Source-Fixes .402, Draft #589, aber noch keine repräsentative reale WebGL-/iOS-Performance-Abnahme |
| A4 Mehr/State | Navigation, Favoriten, Legenden, Beobachtungen, Kartenregion/Zoom, gespeicherte Kurven, Widgets, Geräteabgleich | Offline-/Reload-/Multitab-/Querverbraucher-Abnahme offen |
| A5 Responsive/A11y | 320×568–1920×1080, iPhone/iPad Hoch/Quer, Safe Areas, Ersttipper, Fokus, Overlays, Dynamic Type, Kontrast | Echte Geräte-/VoiceOver-WCAG-2.2-AA-Abnahme ausdrücklich offen |

## Bündelung und Releasebedingung

1. Die .403-RUC-Releasekette muss vollständig SHA-gebunden erfolgreich auf `mid-stable` ankommen oder ein belegter fachlich/sicherheitstechnisch zulässiger anderer Versionspfad ausdrücklich gewählt werden; **kein Releasekonflikt mit .403**.
2. Danach aktuelle SHAs, Version, Verträge, offene PRs, Reviews und Änderungen erneut prüfen. Die hier angelegten Audit-Blobs nur SHA-geprüft und konfliktfrei in einen **neuen** `chatgpt/v0.9.85.404-*`-Sammelbranch aus frischer Stable integrieren; #589 ebenfalls nur nach konkreten Per-Datei-Prüfungen. Kein unvalidierter Reset/Rebase oder Überschreiben paralleler Arbeit.
3. In diesem neuen Integrationsbranch alle Versionsspiegel, Nutzer-/Build-Changelog und Release Notes auf die tatsächliche neue vierteilige Version synchronisieren; gezielte und vollständige Regressionen, Browser-Responsive-/Accessibility-/meteorologische Negativfälle ausführen.
4. Einziger Releaseweg: non-draft Source-PR-Gate komplett grün auf exaktem HEAD → kontrollierter SHA-Bot-Merge → serverseitiges ZIP → voller `install-mid.yml` mit sämtlichen Core-/Heavy-, Worker-/Pages-/Finalize-Gates → SHA-verifizierte Stable-Promotion. Bei jeder Unklarheit fail-closed.

**Offen bleiben** die E2E-/Geräte-/Provider-Messungen und unabhängigen RUC-Qualifikationen. Diese nicht durch Quell- oder Strukturtests ersetzen.
