# MID Test Report 0.9.84.66

## Verifizierte Basis
- GitHub `main` und `mid-stable` unmittelbar vor ZIP-Erstellung: erfolgreich installierter Stand v0.9.84.65, Commit `84de3cfd38ae33fa77674175f68d397e4952c3eb`.
- Fortgesetzter lokaler Wartungsstand: derselbe v0.9.84.65-Stand mit den bereits geschützten UI-Audits für Istwetter, Reise-Center sowie Kopfzeile/Suche/Favoriten.
- Neuer Wartungsstand: v0.9.84.66.

## Bestanden
Gezielt erfolgreich geprüft wurden:
- neuer Extremwetter-Lesbarkeits-/Touchvertrag `test-extreme-outlook-readability-098466.mjs`,
- DACH-/Mitteleuropa-Extremwetter-Grundvertrag,
- Worker-Fallback und Abrufbudget des Extremwetter-Ausblicks,
- kompakte Kartenlegende und Vordergrund-Kontext,
- Methodik-Info-Popover,
- Extremwetter-Abstände,
- erweiterte ICON-D2-RUC/RUC-EPS-Integration,
- UI-Designsystem und Interaktionsstandardisierung,
- UI-Audit 0.9.84.62, Reise-Center 0.9.84.64 und Header/Favoriten 0.9.84.65,
- Einstellungsdesign und iOS-Safe-Area-Kopfzeile,
- Codequalitätsvertrag,
- Versionsschema und Release-Lineage,
- Worker- und Service-Worker-JavaScript-Syntax,
- bytegleiche Synchronität von `src/styles.css` mit den fünf kanonischen Styles-Modulen.

## Lokal nicht ausführbar
Einige ältere Extremwetter-Regressionen importieren `typescript-strada` bzw. `esbuild`. In der isolierten Arbeitsumgebung ist bewusst kein `node_modules` vorhanden und der npm-Cache ist leer. Diese Tests wurden daher nicht als fehlgeschlagen gewertet; sie werden im bestehenden GitHub-Release-Installer nach dem reproduzierbaren `npm ci` ausgeführt. An Abhängigkeiten oder Fachlogik wurde in diesem Wartungsstand nichts geändert.

## Funktionsschutz
Geändert wurden ausschließlich Extremwetter-CSS, ein statischer Regressionstest, Changelog/Implementierungsnachweis und Release-Metadaten. Die Worker-Dateien unterscheiden sich fachlich nicht von v0.9.84.65; nur `WORKER_VERSION` wurde synchronisiert. Keine Datenquelle, Warnschwelle, Wahrscheinlichkeitslogik, Modellgewichtung oder Kartenquelle wurde geändert.

## ZIP-Nachprüfung
Der unversionierte Professional-ZIP wurde nach der Erstellung vollständig in ein frisches Verzeichnis entpackt. Aus diesem entpackten Stand bestanden der neue Extremwettervertrag, DACH-/Worker-/Legenden-/Methodik-/RUC-Verträge, die appweiten Design-/Interaktionsverträge, die drei vorherigen UI-Audit-Verträge, Versionierung/Release-Lineage sowie Worker-/Service-Worker-Syntax. Die ZIP-CRC-Prüfung meldete keinen fehlerhaften Eintrag.
