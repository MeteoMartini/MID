# MID 0.9.84.67 – Kurzfrist, 90 Minuten, Komposit und 24-h-Profil: Lesbarkeit und Bedienkonsistenz

## Ziel
Der komponentenweise Design-/Konsistenzaudit wird in den datenreichen Kurzfrist- und Kartenflächen fortgesetzt. Ziel ist eine modernere, besser lesbare Darstellung auf iPhone/iPad und Desktop, ohne meteorologische Dichte, Zeitauflösung oder Fachfunktionen zu reduzieren.

## Verifizierte Arbeitsbasis
Zu Beginn der Bearbeitung standen GitHub `main` und `mid-stable` noch auf v0.9.84.65, während der unmittelbar zuvor erzeugte und geprüfte lokale Professional-ZIP bereits v0.9.84.66 enthielt. Unmittelbar vor der ZIP-Erstellung wurde erneut geprüft: `main` und `mid-stable` stehen inzwischen beide auf dem erfolgreich installierten v0.9.84.66-Commit `bf5df36951ae81c3983c3b6238c3dc9b68e58414`. Damit ist die bearbeitete v0.9.84.66-Basis nun auch kanonisch auf GitHub bestätigt.

## Befund
- Kurzfristkarten nutzten für Wind/Niederschlag/Gewitter und Detailmetadaten noch mehrere historische 7,5–9-px-Einzelwerte.
- Der 90-Minuten-Nowcast enthielt Wetter-, Niederschlags- und Windmetadaten von 7–9 px; auf sehr schmalen Displays wurden einzelne Werte nochmals kleiner.
- Komposit-Tabs, Layeruntertitel, Kartenstatus, Zeitlinienmetadaten und die minimierte Legende lagen teilweise bei ca. 5,9–8 px.
- Im gleitenden 24-h-Profil wurden einige Achsen-, Zeit-, Wolken- und Warnschwellenbeschriftungen bis auf ca. 5,1–6,5 px reduziert.
- Mehrere kompakte Info-, Legenden- und Profilbedienelemente blieben unter dem inzwischen in MID verwendeten Touchstandard.

## Umsetzung
- Kurzfristansicht auf die vorhandenen MID-Typografietokens `micro/xs/sm` weitergeführt; Wind-/Niederschlags-/Gewitterangaben und Detailmetadaten angehoben.
- Schließen-/Info-Ziele im Kurzfrist-/Nowcastbereich auf 36 px, bei grobem Touch-Pointer auf 40 px angehoben.
- 90-Minuten-Nowcast: Zeit, Wetter, Niederschlag und Wind mindestens auf die semantische Mikro-/XS-Skala gebracht; mobile Schrumpfwerte überschrieben.
- Stunden-Vorschau: Tagesmarker, Wettertext und Metazeilen lesbarer, ohne die kompakte Stundenmatrix aufzugeben.
- Komposit: Tabs, Layeruntertitel, Advanced-Felder, Kartenstatus, Zeitlinie, Standortzusammenfassung und Legenden typografisch vereinheitlicht.
- Komposit-Tabs mindestens 44 px hoch; Live-/Ortungs-/Legendenaktionen auf robuste Touchhöhen angehoben.
- 24-h-Profil: sichtbare UI-Metadaten auf die MID-Skala gebracht; SVG-Achsen-/Zeit-/Wolken-/Warnlabels nur moderat vergrößert, damit die wissenschaftliche Diagrammdichte erhalten bleibt.
- Profil-Auflösung und Info-/Toggle-Ziele 36 px, auf groben Touch-Pointern 40 px.

## Funktionsschutz
Unverändert bleiben insbesondere 15-/60-Minuten-Zeitlogik, 90-Minuten-Nowcast, Wettercodes/Piktogramme, Niederschlagsphasen und -farben, Wind-/Böenlogik, Radar-/Satelliten-/Nowcast-Layer, Komposit-Presets, Timeline/Live-Follow, Layer-Transparenzen, Karteninteraktion, 24-h-Profilkurven, Temperatur-/Taupunkt-/Wind-/Böen-/Luftdruck-/Bewölkungsdaten, Warnschwellen und Datenquellen.

## Regression
Der neue Pflichtvertrag `scripts/test-shortterm-composite-readability-098467.mjs` schützt die Mindestlesbarkeit, Touchflächen, kanonische CSS-Synchronität und den Fortbestand der zentralen Kurzfrist-, Komposit- und Profilinteraktionen.
