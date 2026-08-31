# MID v0.9.76.17 – Feinschliff DWD-Ortsausschnitt und 24-h-Wetterprofil

Stand: 2026-08-31

## Ausgangslage

Parallel zu den Wartungsänderungen aus v0.9.76.15/v0.9.76.16 blieb ein eigener
UI-Feinschliff-Strang offen:

1. Im DWD-Originalprodukt „Wolken + Niederschlagsart“ blieb der gewählte Ort bei
   höheren Zoomstufen nicht immer sauber zentriert; Marker und Legende
   verdeckten zudem noch etwas zu viel Bildinformation.
2. Im rollenden 24-h-Wetterprofil war auf Mobilgeräten weiterhin seitlich zu viel
   ungenutzter Raum vorhanden. Außerdem wirkten obere Zeitmarker, Nachtbänder,
   Skalenabstände und die Wetterpiktogramme noch nicht ruhig bzw. effizient
   genug.

## Umgesetzte DWD-Verbesserungen

- Der Ortsausschnitt nutzt weiterhin ausschließlich das unveränderte amtliche
  DWD-Originalbild inklusive Originalpixel-Auswertung und Originallegende.
- Die Zentrierlogik wurde robuster gemacht: nach Bild-/Zoom-Updates wird der
  Zielpunkt nicht nur in einem einzelnen Frame, sondern mehrfach nachgeführt,
  sodass die Ansicht auch nach Reflow/ScrollWidth-Änderungen zuverlässig um den
  Standort zentriert bleibt.
- Der Standortmarker ist kleiner und transparenter, damit er die meteorologische
  Bildinformation weniger verdeckt.
- Die fest eingeblendete Originallegende am Ausschnittsrahmen wurde weiter
  verkleinert, bleibt aber weiterhin dauerhaft sichtbar und stammt unverändert
  aus demselben DWD-Bild.

## Umgesetzte Profil-Verbesserungen

- kompaktere Seitenränder schaffen nochmals mehr echte Nutzbreite auf mobilen
  Geräten;
- „Therm. Empfinden“ ist zweizeilig gesetzt, wodurch die Diagrammfläche weiter
  nach links und rechts ausgedehnt werden kann, ohne Beschriftungen zu
  überdecken;
- die obere Zeitachse liegt visuell näher an der eigentlichen Profilachse;
- Niederschlags-, Wind- und Luftdruck-Skalen stehen mit größerem Abstand von den
  Achsen und lesen sich dadurch analog zur Temperaturspur ruhiger;
- Nachtstunden werden als zusammenhängende, hellere Bänder statt als unruhige
  Einzelstreifen hervorgehoben;
- Wetterpiktogramme werden vollständig pro Schritt dargestellt, etwas kleiner
  positioniert und durch stärkere Kontur-/Schattenführung besser lesbar gemacht.

## Architektur-/Plattformvertrag

Alle Änderungen liegen vollständig im gemeinsamen React/Vite-Frontendkern.
Browser, PWA und iOS verwenden weiterhin denselben Code; es gibt keinen
iOS-Fork. Die Worker-Fachlogik bleibt unverändert.

## Regression

Die bestehenden DWD- und Wetterprofil-Regressionen wurden auf den verfeinerten
Darstellungsvertrag aktualisiert, insbesondere für:

- robustere Zentrier-/Zoom-Nachführung im DWD-Ortsausschnitt,
- kleinere/transparente Marker- und Legendengeometrie,
- nochmals verdichtete Profil-Seitenränder,
- ruhigere Nachtmarkierung und näher geführte obere Zeitmarker,
- kleinere, vollzählige Wetterpiktogramme und mit Abstand gesetzte Skalen.
