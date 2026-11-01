# MID Designaudit 1.9 – P1 Folgepaket: meteorologische NoData-Integrität

**Stand:** 01.11.2026. **Status: Draft-Quellkandidat, nicht veröffentlicht.**
Verbindliche Basis: `MeteoMartini/MID` `mid-stable=main` v0.9.85.406, SHA `5ebac2e7d62efb92dfdebb406d4125964057a1ba`, Installer #41354077136 `completed/success`. 5 aktive Rulesets, 38 normative Verträge, 1059 Pflichtregressionen. Die Nutzeranlage `MID_DESIGNAUDIT_1_9_GESAMTPRUEFUNG_2026-11-01(1).md` ist der fachliche Ausgangs-Prüfauftrag, kein Produktions-Abnahmebeleg.

## Abgedeckte Auditpunkte – Quellkandidat, keine Green-Gate-Behauptung

| ID | Betroffene Produktpfade | Fachlich nachvollziehbare Abgrenzung | Abnahme |
| --- | --- | --- | --- |
| A2-01 | `ShortTermForecast.tsx` | Quellen- und Ergebnis-PoP müssen beide tatsächlich endlich in 0–100 % vorliegen; bei fehlender PoP bleibt `NaN` als expliziter NoData-Träger, UI zeigt `nicht verfügbar` ohne künstliches Prozentzeichen; echte 0, 1, 4, 100 bleiben erhalten. | Bestehende ShortTerm-Regressionssuite mit tatsächlichen TS-Quellfunktionen. Nächster Integrationsschritt: umfassende Source- und Browserprüfung. |
| A2-02 | `ForecastCockpit.tsx` | Fehlende, unphysikalische Wind-, Böen- und Windrichtungswerte werden nicht mehr zu 0 kt bzw. Nord 0° normalisiert. Tatsächliche 0° und 0 kt sind weiterhin zulässig. | Originalfunktionstests für Nullable/NaN/Infinity/0/360, alle vorhandenen 24h-Stundenfallbacktests und UX. |
| A5-03 | `EventPlannerPanel.tsx` | Ohne Wettercode und ohne vorhandene Niederschlagsoriginalfelder gibt es keine implizite `code:0`-Trocken-/Klarhimmel-Piktogrammklassifikation; fehlender Wettercode, PoP oder Temperatur werden verständlich und assistiv markiert. Teilverfügbare Niederschlagsfelder bleiben NaN und nicht synthetisch 0. | Bestehende Eventplaner-Regression, Test von Wettercode0 und echten PoP0 plus vollständig leeren Events, Tooltip-/Screenreader-Liveprüfung offen. |
| A6-01 | `MountainWeather.tsx` | Nicht vorliegende metrische Niederschlags-/Phasenparameter sind kein Beweis für trocken; ohne belegten Code und ohne Niederschlagsoriginale kein erfundener WMO-Code 0. Cloud-only-Ersatzcode nicht bei fehlenden Wolkendaten; trockene Klassifikation aus Stundenersatz nur nach belegtem Null-Niederschlag. | Bestehende Bergwetter-Originalparser-/Adapter-Gates, echte DACH-Provider- und Zeitslotchecks offen. |
| A6-02 | `MountainWeather.tsx` | Vollständig fehlendes Ensemble-Tages- oder Stundenintervall führt zu NaN-Menge und NaN-PoP statt `0`; keine Entwarnung bei Datenlücken. Die separat aus Quellen abgeleitete Tages-Zeitfensterauflösung bleibt gekennzeichnet. | Negativtests; vollständige Zeit-/Schnee-/Berg-Zeitachse, 23/25h-Tage, Neuschnee und Modellfehler bleiben Pflicht. |
| A0-03 | `README.md`, `scripts/test-versioning.mjs` | Veraltende statische Versionsangabe ersetzt durch kanonischen öffentlichen `version.json`-Link, separat regressionsgeschützt. | Versionspiegel-/README-Regression. |

## Wissenschaftliche Grenzen und Quellpriorität

- **Missing Data ≠ Zero:** Fehlende Daten erzeugen keine Modellwahrscheinlichkeit, kein amtliches Wind-/Wettersignal und kein „trocken“-Piktogramm. Echte fachlich gültige Nullwerte bleiben verwendbar. Keine numerischen Extreme abschneiden.
- **Zeit/Gültigkeit:** Niederschlag als vorausgehendes Originalintervall des jeweiligen Providers; Bedingung für stündlichen Berg-Niederschlag unverändert 45–75 Minuten in UTC-epoch, nicht Uhrzeichen-Subtraktion. 23-/25-h-Tage sind gesondert zu prüfen.
- **Warnungsautorität:** Amtliche DWD-/WMO-Warnfelder sind von MID-eigenem Wetterrisiko fachlich und visuell abgegrenzt; dieses Paket berührt keine amtlichen Warnverträge.
- **Parallelentwicklung:** MID v0.9.85.407 Source-PR #604 ist ein eigener nicht-Draft-Integrationspfad und modifiziert andere Dateien. Dieser P1-Kandidat wurde auf .406 nur gesichert, **nicht** zur .408-Produktion freigegeben. Vor Integration auf den tatsächlichen dann freigegebenen `mid-stable` SHA neu prüfen, Änderungen und Versionsspiegel vollständig synchronisieren, 2–5 kompatible Pakete bündeln, nicht diesen Draft generisch mergen.

## Bewusst offene Prioritäten des Gesamt-Audits

A0-01/02 (mobile verschachtelte Scrollachse/Kopfdichte), A0-04/05 (CSS-Cascade, offizielles versus MID-eigenes Statusmodell), A1-05 (Temperatur-/UTCI-Provenienz), A2-03…06 (23/25h, Charts, Fokus, Kurzsatz), A3-01…05 (Saison/14d/Ensemble-Wortwahl, Quantile, Kalender), A4-01…05 (WebGL-Rendering, native D2 acht Felder, echte WMS-/Originalpixel, Zeit- und Exportparität), A5-04…07 (Touch/Dynamic Type, alle Module/Widgets und Cross-tab State), A6-03 (Flug-/Wasser-/Reise-Originalwertprüfung) bleiben **offen**. Ihr Vorhandensein im Audit wird nicht als behobener Defekt oder reale Endgeräteabnahme ausgegeben.

**Releasebedingung unverändert:** exakter finaler nicht-Draft Source-PR-HEAD → alle 1059+ Core/Heavy/Browser/Source-Gates → MID-SHA-bound kontrollierter Merge → serverseitiges ZIP → `install-mid.yml` mit Worker/Pages/Finalize → Stable-Promotion. Keine Tests/Rulesets aufweichen, kein direkter Hauptbranch-Write.
