# MID v0.9.43.0

## Ziel

Event-Center und Eventplaner werden kompakter, konsistenter und für mehrere parallele Termine belastbarer. Gleichzeitig erhält der Eventplaner eine neue Aktivität **Flug** mit flugmeteorologischem Hazard-Screening.

## Mehrfachfavoriten

- Beliebig mehrere gespeicherte Events können gleichzeitig als Favorit markiert werden.
- „Favoriten prüfen“ aktualisiert sämtliche Favoriten nacheinander und vermeidet unnötige parallele Forecast-/Nowcast-Anfragen.
- Beim Ändern von Ort, Datum, Startzeit oder Titel eines geladenen Events wird ein neuer Eventschlüssel verwendet; dadurch überschreibt ein neu angelegter Favorit nicht mehr versehentlich den zuvor geöffneten Eintrag.

## Oberfläche und Texte

- Event-Center, Topbar-Popover und Ergebnisdarstellung sind für helles und dunkles Theme mit semantischen, kontrastreichen Statusfarben abgestimmt.
- Primärtexte wurden gekürzt. Methodik, automatische Aktualisierung und Modelllaufdetails liegen hinter Info-Bedienelementen.
- Änderungsbadges heißen nun z. B. „Relevant“, „Geändert“ oder „Neuer Lauf“ statt technisch wirkender Formulierungen.
- Doppelte Einschätzungsblöcke im Ergebnis wurden entfernt.

## Appweite Parameterkonsistenz

- Wind und Böen verwenden die in MID gewählte Einheit (`kt`, `km/h`, `m/s`, `mph`).
- UVI wird wie im übrigen MID über `formatUvi()` ganzzahlig dargestellt.
- Temperatur, Niederschlagswahrscheinlichkeit, Niederschlagsmenge und Sicht bleiben auf den vorhandenen MID-Formatpfaden.

## Aktivität Flug

Für `Flug` ergänzt MID die normale Eventprognose um ein separates Druckniveau-Screening. Es verwendet den vorhandenen Meteogramm-/Workerpfad beziehungsweise einen kontrollierten Open-Meteo-Fallback und wertet im Event-Zeitfenster aus:

- Gewitter und Konvektion,
- Vereisung aus Temperatur, Feuchte und Wolkensignal,
- Turbulenz aus vertikaler Windscherung und Stabilitätsindikator,
- Clear Air Turbulence (CAT) in trockeneren höheren Luftschichten,
- Wolkenuntergrenze aus feuchten/bewölkten Druckniveaus,
- Sicht,
- Böen,
- ergänzend die niedrigste Nullgradgrenze.

Die Darstellung unterscheidet **unauffällig**, **beachten** und **kritisch**. Alle Flugwetter-Hazards sind automatisierte MID-Diagnosen und ausdrücklich keine amtliche Flugwetterberatung oder Navigationsgrundlage.

## Regression

`scripts/test-event-center-flight-multifavorite-09430.mjs` schützt die neuen Verträge einschließlich Mehrfachfavoriten, Flugaktivität, Hazardfelder, Theme-Anpassung, Info-Verdichtung, UVI-Ganzzahlformat und appweiter Windeinheit.
