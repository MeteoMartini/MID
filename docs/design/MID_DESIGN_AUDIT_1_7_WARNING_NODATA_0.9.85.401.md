# MID-Designaudit 1.7 – modellierte Warnhinweise: NoData und Zeitfenster

**Status: isolierter Source-Draft, kein Build und keine Releasefreigabe.**

## Herkunft und Grenzen

- Verifizierte, vollständig veröffentlichte Ausgangsbasis: v0.9.85.400, `main=mid-stable` SHA `a6c644fef9762ffad1f4f48a8ddfdf77d4fe2fe7`.
- Installer [41311115993](https://github.com/MeteoMartini/MID/actions/runs/41311115993) vollständig `completed/success`, einschließlich aller fachlichen Core-/Heavy-Gates, Worker, Pages und Finalize; fünf aktive GitHub-Rulesets, 1059 bestehende Pflichtregressionen.
- Parallele D2-/RUC-Drafts #578/#577/#576 und alte Design-Drafts #538/#563/#566 wurden nicht verändert. Keine amtlichen Warnmeldungen, Warnfarben oder Produktionsdienste verändert.
- Die `0.9.85.401` im Branch- und Dokumentnamen ist eine **Reservierung für einen möglichen späteren Build**, nicht die Produktversion dieses Drafts. `package.json` und Versionsspiegel bleiben auf der geprüften Stable .400.

## A1/A2: konkrete Fehlerursache und Korrektur

`src/dwdWarnings.ts` führte mehrstündige Akkumulationen in den **MID-eigenen modellierten Prognosehinweisen** mit `finite(value, 0)` aus. Bei fehlenden Regen-, Schauer- oder Neuschnee-Stundenwerten erschien die Stunde rechnerisch als echte Null. Eine ursprünglich unvollständige 6-h-Summe konnte dadurch die Warnschwelle erreichen, ohne dass alle sechs Stunden belegt waren. Außerdem wurde eine fehlende `null`-Windrichtung über `Number(null) === 0` als Nordrichtung dargestellt.

Die Korrektur unterscheidet echte endliche, nichtnegative Zahlen von `null`, `undefined`, `NaN`, ungültigen Strings und negativen Mengen. Für Summen gilt: Ein einziges nicht belegtes Intervall ergibt `NaN` für genau das betroffene Aggregat und löst dafür keinen scheinbar vollständigen MID-Hinweis aus. Echte Nullstunden und vollständige Summen bleiben erhalten. Die bestehende WMO-Code-gestützte Flüssigphasen-Fallbacklogik nutzt nur tatsächlich verfügbare Gesamtniederschlagswerte. Ein belegtes Total von 0 mm bleibt als dry-Null zugelassen. Eine Windrichtung von genau 0 Grad ist weiterhin Nord; fehlende Richtungen bekommen keinen erfundenen Nordtext.

**Fachgrenze:** Dies sind modellierte MID-Prognosehinweise mit DWD-nahen Schwellen, keine amtlichen DWD-Warnungen. Für amtliche Daten bleiben Originalwarnungen, Meldungstexte, Warnstufen, zeitliche Gültigkeit, Hierarchie und Farbvertrag nach `MID_WARNING_HYBRID_CONTRACT.md` unberührt.

## A1 · Zusätzlich reproduzierter Stundenabdeckungsfehler (Frost/Wärme)

`forwardMin` und `forwardAllBelow` aus `src/dwdWarnings.ts` werteten bisher die nächsten drei bzw. zwölf *Arrayeinträge* aus, ohne belegte stündliche Zeitkontinuität zu fordern. Ein ausgeführter isolierter Quellfunktions-Test mit Frost-Epochen 00/03/06 UTC ergab fälschlich `true` für »3 Stunden unter −10 °C«; zusammenhängende Epochen 00/01/02 UTC ergaben ebenfalls `true`. Dies ist **kein** Beweis einer entsprechenden laufenden Produktionsmeldung, aber ein reproduzierbarer numerischer Fehlerfall.

Die neue gemeinsame `completeHourlyWarningWindow`-Abdeckung verlangt bei vorhandenem Zeitbezug gültige stündliche Epochen mit höchstens ±5 min Toleranz; bei gemischten bekannten und fehlenden Zeitstempeln schlägt das Fenster fehl. `forwardSum` verwendet denselben Guard, `forwardMin` und `forwardAllBelow` ebenfalls. Der gezielt ausgeführte reine Helfercheck auf dem tatsächlichen Branch-Quelltext ergab: 3h-Frost (lückenlos)=true, 3h-Frost mit 00/03/06=false, teils fehlende Epochen=false; 12h-Wärme lückenlos ergibt 22 °C, 12 Werte im 2h-Abstand NaN. Neue positive/negative Fälle stehen im vorhandenen Pflichtskript `scripts/test-dwd-warning-markers.mjs`.

**Ausdrückliche Restrisiken:** Datensätze ganz ohne Zeitstempel werden aus Kompatibilitätsgründen noch als fortlaufende Arraystunden behandelt; das ist keine bestätigte Zeitprovenienz und muss vor schärferer Publikationssperre im gesamten Datenpfad und in den existierenden Verbraucher-/Regressionstests qualifiziert werden. Dies ersetzt keinen End-to-End-Test mit realen DWD-/Prognosedaten.

## A4 · Wesentlicher Negativbefund: Qualitätsindikator derzeit ohne Verbraucher

Quellcode-Readback des verifizierten Stable `src/App.tsx` ergab **nur** die Importstelle und einen JSX-Aufruf von `DataQualityIndicator`; diese exportierte Komponente gibt absichtlich `null` zurück. `ParameterQualityIndicator` selbst wird nicht importiert oder gerendert. Folglich hatten die ursprünglichen Korrekturen an Radar-Fallback und Zukunftszeitlabel **keine sichtbare Wirkung**. Sie und der dafür ergänzte rein textuelle Test wurden auf dem Draft durch rücklesbare Revert-Commits **wieder auf die ursprünglichen Stable-Git-Blobs zurückgeführt**. Im effektiven PR-Diff verbleibt keine Änderung dieser zwei Dateien. Eine tatsächliche Anzeigeprovenienz-Korrektur muss am aktiven `App.tsx`-Quellenpfad (`sourceFor`, `fieldSourceInfo`, Modell-/Stations-/Radardetails) ansetzen; Ursache und Verbraucher sind zuerst fachlich zu testen.

Der aktuelle Benutzer sieht Quellendetails in tatsächlichen Info-Popovers und Messkarten des Aktuell-Cockpits; eine appweite echte UI-E2E-Prüfung ist offen. Der gemeinsame `AppInfoHint`/`AppPortalPopover`-Vertrag schützt zugängliche Trigger und Escape/Außenklick, seine reale gerätespezifische Abnahme steht aus.
## Wiederverwendete Regression

`scripts/test-dwd-warning-markers.mjs` erweitert das bestehende Pflichtskript (kein Entfernen oder Ersetzen von Tests). Neue adversarielle Fälle: 6-h-Starkregen mit fehlender Stunde, vollständiger 6-h-Starkregen, 6-h-Neuschnee mit fehlender Stunde, vollständiger Schnee, fehlende Windrichtung sowie echte Nordrichtung 0 Grad. Die bestehenden DWD-/Schwellen- und Darstellungsfälle bleiben erhalten. Aussage `grün` erst nach tatsächlichem Lauf auf genau dem neuen Head.

## A0–A5 · SHA-gebundenes Verbraucher-/Testinventar (kein Testdurchlauf)

Nach Readback von Stable .400: `src/App.tsx` (A0/A1, 474265 Zeichen), `src/ForecastCockpit.tsx` (A1/A2), `src/EnsemblePanel.tsx` (A2), `src/MapWorkspacePanel.tsx` (A3), `src/WmsOriginalExportControl.tsx` und `src/wmsOriginalMapExport.ts` (A3), `src/WidgetGenerator.tsx` (A4), `src/AppInfoPopover.tsx` / `src/AppPortalPopover.tsx` (A5). Kein zusätzlicher Karten-/iOS-/Warn-/Worker-PR verändert.

| Auditbereich | Reale Verbraucher | Vorrangig bereits inventarisierte Pflichtprüfungen | Abnahmestatus |
|---|---|---|---|
| A1 · Aktuell/Heute | `App.tsx`, `ForecastCockpit.tsx`, `ShortTermForecast.tsx`, `SkyBarSegments.tsx`, `dwdWarnings.ts` | `test-rain-warning-evidence-0985178.mjs`, `test-current-skybar-canonical-0985230.mjs`, `test-precipitation-forward-geometry-097916.mjs`, `test-mid-18-2-4-warning-timeline-098577.mjs` | source-geprüft; Warn-Helfer-Repro ausgeführt; keine reale Browser-Abnahme |
| A2 · 7d/14d/ENS | `ForecastCockpit.tsx`, `EnsemblePanel.tsx`, `ensembleCumulativeDisplay.ts`, `parameterLineStyle.ts` | `test-ensemble-cumulative-gaps-0985374.mjs`, `test-appwide-line-semantics-0985374.mjs`, `test-forecast-display-persistence-0985166.mjs` | Bestands-Fixes .399/.400 nur anhand veröffentlichter Provenienz; keine neue E2E-Prüfung |
| A3 · Karten/Exporte | `MapWorkspacePanel.tsx`, `UnifiedWeatherMap.tsx`, `WmsOriginalExportControl.tsx`, `wmsOriginalMapExport.ts` | `test-dwd-wms-routing.mjs`, `test-geomet-wms-time-0985234.mjs`, `test-map-direct-time-theme-0985212.mjs`, `test-unified-map-layers-0985167.mjs` | Originalklassengleichheit, Layer-Verfügbarkeit, Druckkontur und PNG-Export noch real zu belegen |
| A4 · Einstellungen/Favoriten/Widget | `App.tsx`, `storageSafety.ts`, `WidgetGenerator.tsx`, `MapWorkspacePanel.tsx` | `test-state-integrity-contract-095327.mjs`, `test-storage-quota-resilience-093217.mjs`, `test-widget-url-exports-098413.mjs` | App-/Multitab-/Offline-/Exportparität noch offen |
| A5 · Responsive/A11y | `AppInfoPopover.tsx`, `AppPortalPopover.tsx`, vorhandene Theme-/Breakpoint-CSS | `test-appwide-touch-responsiveness-09523.mjs`, `test-c7-viewport-matrix-098525.mjs`, `test-popover-regression.mjs`, `test-c14-real-screenshot-contract-098534.mjs` | Keine physische iPhone-/iPad-/VoiceOver-/WCAG-AA-Zertifizierung |

### Semantische Kontrollmatrix – Prüfpflichten, keine behauptete Abnahme

| Parametertyp | Zeit-/Datenvertrag | Darstellung/Provenienz | Obligatorische Gegenprobe |
|---|---|---|---|
| Temperatur / UTCI / Taupunkt | Zeitpunkt; keine 1h-Akkumulation; NoData bleibt Lücke | Parameterfarbe bzw. UTCI-Rolle, zentrale Präzision; Wetterquelle nachvollziehbar | NaN/null/Infinity, 23-/25h-Kalendertag, Light/Dark |
| PoP / Niederschlagsmenge / -art | Vorwärtsslot 15min/1h; PoP ist keine Menge; vollständige und nicht doppelte Intervalle | Farbe/Phase/Legende und Quelle derselben gültigen Zeit | Zeitverschiebung, Lücken, echte 0, Mengen-/Phasenkohärenz |
| Wind / Böen / Richtung | Instantanwerte; Richtung kreisförmig; keine Nullrichtung bei Missing | `kt` statt `kn` in MID-Texten; separate Linien-/Warnrollen | 0° vs Missing, Böen≥Wind, Hitz-/Frost-/Böenfenster |
| ENS / Quantile / Akkumulation | Run/ValidTime, Mitgliederzahl/Unabhängigkeit; NaN unterbricht Kumulativpfad | Ensembleband/Mittel/Quantile, unveränderte Extremwerte | fehlerhafte Member/0 Member, Gap, Überlappung, 7d/14d |
| WMS / RUC / Karten | Run, ValidTime, Niveau, Rasterauflösung, native Originalpalette und Lizenz | GetMap/GetLegendGraphic/Export-Frame gleicher Anbieter | unavailable vs zero, falsche Layer-Zeit, Originalfarbe, Crop, PNG |
| Amtliche Warnung vs MID-Hinweis | Amts-CAP/DWD gewinnt; eigene MID-Fachhinweise streng getrennt | Warnfarben ausschließlich amtlich, MID nutzt Parameterfarben | Quellenstörung nicht Entwarnung, Warn-Gültigkeit, Unsicherheit |


## Freigaberegel

Vor einem produktiven Release zwingend: aktuellen Stable-/Main-Abgleich und SHA-/Blob-Herkunft wiederholen; alle Konflikte mit Parallel-PRs klären, coherent neue Buildversion samt sämtlichen Spiegeln und Changelogs erstellen; gezielte Tests und komplette Pflicht-Source-Gates erfolgreich auf finalem PR-SHA; erst dann kontrollierter SHA-Bot → serverseitiges ZIP → `install-mid.yml` → Worker/Pages/Finalize → Stable-Promotion. Weder dieser Draft noch reine Code-Checks bestätigen Browser-, physische iOS- oder VoiceOver-Tests.