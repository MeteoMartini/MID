# MID 0.9.85.113 · Design- und Funktionsaudit

Basis: `MeteoMartini/MID`, `mid-stable` `dc1975c3ccf99e9b749393874a48147618f6e73e`.

## Umgesetzt

- Kurzfrist: der ausgewählte Detailbereich bleibt im Next-Design sichtbar und lässt sich schließen.
- Karten: Playback, „Jetzt“ und „Neu laden“ messen mindestens 44 × 44 px.
- 14 Tage: Szenarioübersicht wechselt unter 620 px auf zwei Spalten und unter 420 px auf eine Spalte. Labels besitzen 11 px Schrift und dürfen umbrechen.
- GeoJSON: Tooltip-Informationen lassen sich zusätzlich durch Klick oder Tippen öffnen; das Standortlabel ist in der Wetterkarte über ein bedienbares Details-Element zugänglich. Dynamische Ortsnamen werden vor HTML-Ausgabe maskiert.
- Bottom-Bar: Screenreader erkennen die Hauptnavigation als Navigations-Landmark.

## Prüfmatrix

- Viewports: 320 × 568, 390 × 844, 430 × 932, 667 × 375, 834 × 1194 und 1440 × 900, jeweils Light/Dark sowie mit Ortsauswahl.
- Kurzfrist-Zeitpunkt auswählen, Detail lesen und schließen; Kartenmarker per Maus und Touch aufrufen, Standortdetails mit Tastatur öffnen.
- Karten-Playback und Zeitachse auf schmalen Ansichten auf Überlauf prüfen, Szenariolabels vollständig lesen und Navigations-Landmark im Screenreader prüfen.

Replit hatte Meteogramm-Überlauf, Radar-Legendenüberdeckung und Warnkontrast nicht reproduziert. Diese Beobachtungen bleiben für die gerenderte Prüfung offen. Die behaupteten sechs Bottom-Bar-Spalten und 8,2-px-Labels werden durch später geladene Regeln überschrieben.
