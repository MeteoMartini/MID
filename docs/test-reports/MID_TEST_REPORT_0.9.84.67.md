# MID Test Report 0.9.84.67

## Verifizierte Basis
- Zu Beginn: GitHub `main`/`mid-stable` v0.9.84.65; lokaler, zuvor geprüfter Fortsetzungsstand bereits v0.9.84.66.
- Unmittelbar vor ZIP-Erstellung erneut verifiziert: GitHub `main` und `mid-stable` beide v0.9.84.66, Commit `bf5df36951ae81c3983c3b6238c3dc9b68e58414`.
- Neuer Wartungsstand: v0.9.84.67.

## Bestanden
Gezielt erfolgreich geprüft wurden:
- neuer Kurzfrist-/90-Minuten-/Komposit-/24-h-Lesbarkeitsvertrag `test-shortterm-composite-readability-098467.mjs`,
- Kurzfrist-Kartenbeschriftung/Header,
- Forecast-Cockpit-Piktogramme und Windpfeile,
- Cockpit-Responsivität,
- 24-h-Meteogramm-Pro-Grundvertrag,
- Vollbreiten-/Overlay-Geometrie des 24-h-Profils,
- kompakte Einzeldaten des 24-h-Profils,
- Komposit-Sichtbarkeit/Qualität,
- saisonale Radarbewertung, Hybrid-Zugvektor und Nowcast-Objekte,
- Luftdruckspur und Hazard-Zeitfenster des 24-h-Profils,
- UI-Audit 0.9.84.62, Reise-Center 0.9.84.64, Header/Favoriten 0.9.84.65 und Extremwetter 0.9.84.66,
- Codequalitätsvertrag,
- Versionsschema und Release-Lineage,
- bytegleiche Synchronität von `src/styles.css` mit den fünf kanonischen Styles-Modulen.

## Lokal nicht vollständig ausführbar
Einige ältere Kurzfrist-/Komposit-Regressionen importieren `typescript-strada`; ein weiterer älterer Komposit-Test ruft eine TypeScript-CLI-Option auf, die ohne die projektgebundene CI-Toolchain vom System-Compiler nicht verstanden wird. Im isolierten Arbeitsverzeichnis ist bewusst kein `node_modules` vorhanden. Diese Fälle wurden daher nicht als Produktfehler bewertet; der bestehende GitHub-Release-Installer führt sie nach reproduzierbarem `npm ci` mit der Projekttoolchain aus.

## Funktionsschutz
Geändert wurden ausschließlich CSS für Kurzfrist-/90-Minuten-/Komposit-/24-h-Darstellung, ein statischer Regressionstest, Changelog/Implementierungsnachweis und Release-Metadaten. Wetterberechnung, Datenquellen, Radar-/Nowcast-Logik, Komposit-Layer, Profilwerte und Worker-Fachlogik wurden nicht verändert.

## ZIP-Nachprüfung
Der unversionierte Professional-ZIP wurde nach Erstellung in ein frisches Verzeichnis entpackt. Aus diesem Stand werden der neue Lesbarkeitsvertrag, die lokal verfügbaren Kurzfrist-/Cockpit-/Komposit-/Profilverträge, die vier vorherigen UI-Audit-Verträge, Versionierung/Release-Lineage sowie Worker-/Service-Worker-Syntax erneut geprüft. Die ZIP-CRC-Prüfung ist Teil der Abschlussprüfung.
