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

## Wiederverwendete Regression

`scripts/test-dwd-warning-markers.mjs` erweitert das bestehende Pflichtskript (kein Entfernen oder Ersetzen von Tests). Neue adversarielle Fälle: 6-h-Starkregen mit fehlender Stunde, vollständiger 6-h-Starkregen, 6-h-Neuschnee mit fehlender Stunde, vollständiger Schnee, fehlende Windrichtung sowie echte Nordrichtung 0 Grad. Die bestehenden DWD-/Schwellen- und Darstellungsfälle bleiben erhalten. Aussage `grün` erst nach tatsächlichem Lauf auf genau dem neuen Head.

## A0–A5: vorläufige Prüfmatrix

| Bereich | Belegte Quellen-/Codeprüfung | Noch notwendige Abnahme |
|---|---|---|
| A0 Hauptseiten & Inventar | Aktuelle AGENTS/Baseline/Source-of-Truth, 1059 Tests, fünf aktive Rulesets; Issue #523 | Vollständige Verbraucher-/E2E-Matrix |
| A1 Aktuell / Heute | Vorwärtsintervallvertrag, modellierte Warnzeit und NoData-Helper gelesen; korrigierter Source-Kandidat | 90-min-/24-h-Realrender, Warn- und Niederschlagszeit an DST/Übergängen, Screenshotmatrix |
| A2 Vorhersage | 7-/14d-/Saison-NoData-Fixes .399/.400 dokumentiert; Regressionsschutz | Ensemble-Quantile, Regen/PoP/Phase, Tooltip-/Kurvenparität mit realen Daten |
| A3 Karten | WMS-Originallegenden/-Export und Modelllauf-/ValidTime-Verträge .390–.396 vorhanden | Provider-Originalklassen, Kartenkombinationen, Layer, Isolinien, Exportbild-Prüfung |
| A4 Mehr & Querschnitt | Persistenz-, Storage-/Favoritenverträge und Audit-Drafts gelesen | Multi-Tab, blockierter Speicher, Fachmodule, Widgets, PWA, URL-/PNG-/SVG-Export |
| A5 Responsive/A11y | Vorhandene responsive und Linien-/Kontrastvertragsregressionen gesichtet | 320–1920 px, Landscape/Portrait, Touch, Dynamic Type, tatsächliche iOS-/VoiceOver-Abnahme |

## Freigaberegel

Vor einem produktiven Release zwingend: aktuellen Stable-/Main-Abgleich und SHA-/Blob-Herkunft wiederholen; alle Konflikte mit Parallel-PRs klären, coherent neue Buildversion samt sämtlichen Spiegeln und Changelogs erstellen; gezielte Tests und komplette Pflicht-Source-Gates erfolgreich auf finalem PR-SHA; erst dann kontrollierter SHA-Bot → serverseitiges ZIP → `install-mid.yml` → Worker/Pages/Finalize → Stable-Promotion. Weder dieser Draft noch reine Code-Checks bestätigen Browser-, physische iOS- oder VoiceOver-Tests.