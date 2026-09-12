# MID 0.9.84.66 – Extremwetter-Ausblick: Lesbarkeit und Touchstandardisierung

## Ziel
Der komponentenweise Design-/Konsistenzaudit wird im sicherheitsrelevanten Extremwetter-Ausblick fortgesetzt. Ziel sind bessere Lesbarkeit, konsistente Touchziele und eine einheitliche MID-Typografie ohne Änderung der probabilistischen Fachlogik, Schwellen oder Datenquellen.

## Verifizierte Arbeitsbasis
Zu Beginn der Bearbeitung lief die Promotion des bereits gelieferten v0.9.84.65 noch. Vor Erstellung des ZIP wurde erneut geprüft: GitHub `main` und `mid-stable` stehen beide auf dem erfolgreich installierten Release v0.9.84.65 (`84de3cfd38ae33fa77674175f68d397e4952c3eb`). Dieser identische lokale v0.9.84.65-Stand mit den bereits geprüften UI-Audits für Istwetter, Reise-Center sowie Kopfzeile/Suche/Favoriten wurde als Delta-Basis verwendet.

## Befund
- Der Extremwetter-Ausblick verwendete in vielen sichtbaren Fachinformationen noch historische 7–9-px-Schriften, u. a. für Kartenlegende, Regionsdetails, Treiber, Schwellenwerte und Methodik.
- Der Methodik-Info-Button war nur 28 × 28 px groß.
- Karten-Zoomtasten, Gefahren-/Aktualisieren-Schaltflächen und Regionszeilen lagen unter der heute im übrigen MID verwendeten Touchzielgröße.
- Spätere historische CSS-Overrides aus der 0.9.66-Reihe machten die Kartenlegende wieder besonders klein.

## Umsetzung
- Sichtbare Extremwetter-Texte auf die bestehenden semantischen MID-Typografietokens `micro/xs/sm/meta` überführt.
- Gefahrenarten mindestens 40 px, Zeitraum 44 px; auf groben Touch-Pointern Gefahren/Aktualisieren 44 px.
- Regionsauswahl mindestens 44 px, auf Touchgeräten 48 px.
- MapLibre-Zoomsteuerung im Extremwetter-Modul 36 px, auf Touchgeräten 40 px.
- Methodik-Info 36 px, auf Touchgeräten 40 px.
- Kartenlegende und Flächenlabel moderat vergrößert, ohne die meteorologische Fläche unnötig zu verdecken.
- Methodik, Schwellentabelle, Wahrscheinlichkeitserklärung, Quellen- und Treiberangaben besser lesbar.

## Funktionsschutz
Unverändert bleiben insbesondere Gefahr-/Zeitraumauswahl, manueller Refresh, 48-h-Horizont, I1–I4-Intensitätsstufen, Wahrscheinlichkeitsbänder, Schraffur unter 60 %, modellierte Flächen, Regionsauswahl, Standortmarker, amtliche Warntrennung, DWD-nahe Begrifflichkeit, Kartenquellen, Datenabruf und Worker-Fachlogik.

## Regression
Der neue Pflichtvertrag `scripts/test-extreme-outlook-readability-098466.mjs` schützt die Mindestgrößen, semantische Typografie, Touchflächen, wissenschaftliche Einordnung, zentrale Interaktionen und die bytegleiche Synchronität von `src/styles.css` mit den fünf kanonischen Styles-Modulen.
