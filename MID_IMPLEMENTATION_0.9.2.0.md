# MID v0.9.2.0 – optionale Prognose-Cockpits

## Ausgangsbasis

- Verbindliches Repository: `MeteoMartini/MID`
- Verbindlicher Branch: `mid-stable`
- Vor Beginn geprüfte Stable-Version: `0.9.0.2`
- `package.json` und `MID_BASELINE.json` wurden vor jeder Änderung gelesen und abgeglichen.

## Ziel

Kurzfrist-, 7-Tage- und 14-Tage-Prognose erhalten zwei zusätzliche platzsparende Darstellungsweisen. Die bisherige Darstellung bleibt unverändert vorhanden und ist weiterhin der Standard.

Unter **Einstellungen → Ansicht → Prognose-Einstieg** stehen drei persistente Optionen zur Verfügung:

1. **Klassisch** – bisherige Module unverändert untereinander
2. **Cockpit · Register** – ein gemeinsames Prognose-Cockpit mit drei wischbaren Horizonten
3. **Cockpit · Ribbons** – drei kompakte Zusammenfassungen, von denen jeweils eine erweitert ist

## Gemeinsamer Cockpit-Vertrag

- Die vorhandenen Dashboard-Schalter für Kurzfrist, 7 Tage und Ensemble bleiben maßgeblich.
- Deaktivierte Horizonte erscheinen auch im Cockpit nicht.
- Die bisherigen drei Module werden im Cockpitmodus nicht zusätzlich parallel gerendert.
- Jede kompakte Ansicht öffnet bei Bedarf die vollständige bisherige Analyse.
- Die Auswahl eines Tages wird zwischen 7- und 14-Tage-Horizont synchronisiert.
- Der aktive Horizont und der gewählte Ensembleparameter werden lokal gespeichert.
- Best Match, lokale Korrekturen, Ensemblezustand und Aktualisierungszeit bleiben sichtbar.

## Variante 1: Cockpit · Register

- Register **Kurzfrist**, **7 Tage** und **14 Tage** mit horizonbezogener Kurzfassung
- horizontaler Wischwechsel auf Touchgeräten
- nur der aktive Horizont nimmt die größere Höhe ein
- vollständige Analyse über eine zweite, zunächst geschlossene Informationsebene

## Variante 2: Cockpit · Ribbons

- alle verfügbaren Horizonte gleichzeitig als kompakte Übersichtszeilen sichtbar
- jede Zeile enthält eine eigene Miniaturgrafik
- immer genau ein Bereich erweitert
- Wechsel ohne Verlust der Tages- oder Parameterauswahl

## Kurzfrist – adaptive 24-Stunden-MeteoRibbon

Die kurzfristige Prognose wird als zusammenhängende dreispurige Grafik dargestellt:

- Wetterzustand und Tag-/Nachtpiktogramme
- Temperaturverlauf
- Niederschlagsmenge, Wahrscheinlichkeit und Windvektoren

Die Zeitleiste priorisiert meteorologisch relevante Zeitpunkte: Beginn und Ende von Niederschlag, Wetterwechsel, Temperaturmaximum/-minimum, stärkste Böe und markante Winddrehung. Balkenhöhe beschreibt die Menge, Deckkraft die Wahrscheinlichkeit. Ein ausgewählter Zeitpunkt erhält eine kompakte vollständige Wertekarte.

## Sieben Tage – Wetterband

- sieben Tageskolonnen auf einer gemeinsamen Temperaturskala
- Wetterpiktogramm, Minimum, Maximum, Niederschlag und Wind je Tag
- zentrale DWD-Böenschwellen statt duplizierter Grenzwerte
- zusammenhängende grafische Wetterphasen
- integrierte 7-Tage-Kurzinterpretation
- gemeinsamer Tagesfokus mit der 14-Tage-Ansicht

## Vierzehn Tage – Unsicherheitshorizont

- Temperatur, Niederschlag und Wind als umschaltbare Parameter
- kleine Parameter-Vorschauen in den nicht aktiven Registern
- Best Match beziehungsweise Ensemblemittel mit Unsicherheitsband
- sichtbare Trennung zwischen Tag 1–7 und dem zunehmend unsicheren Zeitraum ab Tag 8
- abnehmende Deckkraft für den späteren Horizont
- kompakte Szenarien mit Wahrscheinlichkeitsanteilen
- Ensemblekonsistenz direkt in der Darstellung

## Responsive Umsetzung

- keine feste Desktop-Mindestbreite für das Cockpit
- touchgerechte Register und Ribbons
- adaptive horizontale Diagrammflächen auf schmalen Displays
- einspaltige Einstellungsoptionen auf Smartphones
- reduzierte Beschriftungen unter 680 beziehungsweise 420 Pixel
- Unterstützung von `prefers-reduced-motion`
- vollständige alte Analysen bleiben auch mobil aufklappbar

## Version

Die automatisch bewertete Version ist `0.9.2.0`, da zwei neue, persistente und vollständig responsive Prognoseoberflächen als eigenständige Funktionsausbaustufe hinzukommen.

## Regression

- neuer Vertrag: `scripts/test-forecast-cockpit-0920.mjs`
- klassische Darstellung bleibt Standard
- beide Cockpitvarianten und ihre Einstellungswerte geprüft
- Doppelrendering der alten Module ausgeschlossen
- adaptive Kurzfristzeitleiste geprüft
- gemeinsames 7-Tage-Wetterband geprüft
- 14-Tage-Unsicherheitshorizont und Parameter-Miniaturen geprüft
- Persistenz, gemeinsamer Tagesfokus und responsive Regeln geprüft
- zentrale DWD-Warnschwellen bleiben geschützt

## Worker

Keine funktionale Workeränderung. Der Worker wird lediglich auf `0.9.2.0` versionssynchronisiert.
