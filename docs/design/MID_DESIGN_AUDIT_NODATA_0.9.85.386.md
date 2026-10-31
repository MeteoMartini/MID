# MID .386 · Designaudit #523 – NoData-Konsistenz in Kurzfrist und Ensemble

## Provenienz / Arbeitsstatus

- Ausgangsbasis main=mid-stable v0.9.85.384 @ 4901049d973b14015959ee576ede49a9de6a6489, fünf aktive Schutzrulesets.
- Die bestehende parallele .385-Entwicklung wurde nicht verändert. .386 ist ein versionierter Entwicklungs-Draft; produktive Veröffentlichung steht aus.

## Meteorologischer Fachvertrag

- Echte 0 mm und 0 % sind gültige Beobachtungs-/Prognosewerte; null, undefined, NaN, Infinity, Strings, negative Mengen und PoP außerhalb 0..100 sind nicht verfügbar, niemals implizit trocken.
- 15-min-/Stundenmengen werden nur bei gültigem Zeitslotanteil skaliert. Für vorhandene beitragenede Slots ist eine Summe nur gültig, wenn alle Mengen endlich und nichtnegativ sind. Ein PoP-Maximum erfordert vollständige gültige beitragende PoP-Werte.
- Nicht vorhandene *gesamte* Zeitslots können anhand einer reinen Aggregation vorhandener Punkte nicht entdeckt werden. Provider-/Raster-/Zeitachsen-Vollständigkeit bleibt gesondert zu qualifizieren; diese Tranche behauptet keine vollständige +24h-Abdeckung.
- Kompakte Ensemble-Texte unterscheiden echte Trockenheit von geringer Niederschlagsmenge, bekannter kleiner PoP und fehlenden Eingängen; ohne konkrete meteorologische Phase wird keine Gewitterart erfunden.
- Kein Eingriff in amtliche DWD-Warnfarben, WMO-Codes, Modellgewichte, Extremwertglättung, RUC-Preprocessing oder vorhandene Intervalldatierung. Bereits veröffentlichte 14d-Quantil- und NoData-Linienregeln aus .378 bleiben erhalten.

## Verbraucher- und QA-Matrix

| Ansicht / Ausgabe | Geänderte fachliche Verbraucher | Abnahmegrenze |
|---|---|---|
| Aktuell/Heute – Kurzfrist | Einzelrate / PoP / Menge | Fokustest neu, reale Browser-Screenshots ausstehend |
| 24h | aggregierte vorhandene Slots, anteilige Menge und PoP | Fokustest neu, fehlende ganze Slots ausstehend |
| 7d | nicht verändert | Farb-/Legenden-/Zeitabgleich ausstehend |
| 14d Ensemble | kompakter Niederschlagsstatus, Trocken-/Wetterart-/Mengenlabel | Fokustest neu, Browser-/Exportabgleich ausstehend |
| Karten, Mehr, Favoriten, Widget, URL/PNG/SVG | nicht verändert | appweiter Audit #523 offen |
| 320 / 390 / 430 / 768 / 1024 / 1440 / 1920 Pixel | keine echte Geräte-/Viewport-Screenshotabnahme | offen |
| Light/Dark, Touch/Keyboard, VoiceOver/iOS und Dynamic Type | kein physischer Gerätenachweis | offen |

Normative Grundlage: MID_PRECIPITATION_INTERVAL_CONTRACT.md, MID_PARAMETER_DISPLAY_PRECISION_CONTRACT.md, MID_PARAMETER_COLOR_CONTRACT.md, MID_UI_ARCHITECTURE_CONTRACT.md; WCAG 2.2 SC 1.4.11 und SC 2.5.8. Keine statischen Tests als Screenreader- oder physische iOS-Abnahme ausgeben.

## Erweiterte NoData-SVG-Sicherheit

Die 24h-Wahrscheinlichkeitslinie wird an ungültigen Werten segmentiert; nicht verfügbare Werte dürfen keine verbindende Linie, keine PoP-Punkte/Säulen und keine Niederschlagsbalken erzeugen. Im 90-Minuten-Raster und den 24h-Titeln wird ein fehlender Wert ausdrücklich benannt, statt zu 0 mm/0 % zu werden. Noch nicht als reale Browser-/iOS-Abnahme nachgewiesen.

## Vollständigkeit der Zeitachse und 7d-Kurve (PR-Completion)

Zusätzlich zu Rohwertverfügbarkeit validiert `completePrecipitationIntervalCoverage` die lückenlose und überschneidungsfreie Folge der im 24h-Aggregat enthaltenen Intervallkanten. Fehlt ein 15-min-Beitrag innerhalb des angezeigten Gruppenintervalls, ergeben die Menge und das PoP-Maximum `NaN`, nicht eine plausibel wirkende zu kleine Summe oder 0 %. Eine vollständig entfernte 24h-Gruppe bleibt weiterhin eine gesonderte Provider-/Achsenprüfung. Die 7d-Stundenniederschlagskurve kennzeichnet fehlende Gesamtmengen dezent gestrichelt und lässt sie nicht unbemerkt als trockenen Nullbalken erscheinen; der Tooltip erhält gültige PoP oder einen Missing-Hinweis. Umfang: reiner Fachvertrag und fokussierte Regression, noch keine echte Browser-/iOS-Abnahme.

## Kompakte 14d-Ensemble-Visualisierung

Für ein ruhendes kompaktes Niederschlags-Piktogramm werden fehlende Gesamtmenge oder fehlende PoP als eigener neutraler `unknown`-Zustand mit kleinem Fragezeichen in kontrastreichem Kreis dargestellt. Ein fehlendes Symbol wäre optisch nicht von trockenen Intervallen unterscheidbar. Nur bestätigte 0 mm und 0 % dürfen die inaktive Trocken-Visualisierung ohne Marker ergeben; der zugängliche Tooltip benennt die unvollständige Datenlage. Bei unabhängig aktiven eindeutigen Niederschlags-WMO-Signalen bleibt die ursprüngliche Phase sichtbar und die fehlende Best-Match-Menge wird weiterhin im Text erklärt. Symbol ist ein MID-Hinweis, keine amtliche DWD-Warnung. Strukturtests ergänzt, echte Light/Dark-/Phone-/VoiceOver-Screenshots stehen aus.

## Freigabegrenze

Erst neue Stable-SHA-Prüfung, saubere .385-Reihenfolge bzw. Versionskoordination, vollständige Source-PR-Gates, SHA-Bot-Merge, serverseitiges ZIP, Installer und betroffene Worker/Pages-Gates, anschließend bestätigte Stable-Promotion. Bis dahin bleibt der PR im Draft. Issue #523 bleibt offen.
