# MID 0.9.66.3 – geglättete Gefahrenkonturen statt Rasterrechtecken

## Befund

Version 0.9.66.2 machte die zuvor verdeckten Flächen zuverlässig sichtbar, zeichnete dafür jedoch die technischen 55–90-km-Modellstützfelder unmittelbar als Rechtecke. Diese Geometrie war ein Zwischenstand zur Absicherung des Renderpfads, aber keine geeignete Enddarstellung für eine professionelle regionale Gefahrenprognose.

## Umsetzung

- Ein kompaktes räumliches Stützfeld wird auf einer neunfach unterteilten geographischen Arbeitsmatrix ausgewertet. Direkt und diagonal benachbarte Signale gleicher Intensität werden zu zusammenhängenden Gebieten gruppiert.
- Aus der kontinuierlichen Stützfunktion werden geschlossene Außenkonturen gewonnen und zweistufig geglättet. Einzelne Signale erscheinen dadurch als abgerundete Gebiete; Cluster bilden unregelmäßige, zusammenhängende Flächen statt einer Ansammlung von Rechtecken.
- Die Konturen bleiben georeferenziert und werden bei Zoom, Bewegung und Größenänderung vollständig neu auf die MapLibre-Karte projiziert. Ihre Ausdehnung bleibt auf das Umfeld der tatsächlich oberhalb der Darstellungsschwelle liegenden Modellstützpunkte begrenzt.
- Farbe kennzeichnet weiterhin I1–I4, Deckkraft und Prozentmarker die Wahrscheinlichkeit. Gebiete mit einer mittleren Wahrscheinlichkeit unter 60 % erhalten zusätzlich eine dezente diagonale Schraffur; ab 60 % werden sie vollflächig dargestellt.
- Eine helle Außenkontur mit farbigem Kern hält die Gebietsgrenze auf hellen und dunklen Kartenteilen lesbar. Die unsichtbaren Popup-Flächen verwenden nun 24-seitige, abgerundete Treffergebiete statt Rasterrechtecke.
- Die Karte bezeichnet die Darstellung ausdrücklich als geglättete Isoplethen aus dem Regionalraster. Es handelt sich um interpolierte Prognosegebiete, keine amtlichen Warnpolygone und keine gemeindescharfe Aussage.

## Funktionsschutz

DACH-Abdeckung, 117 Modellstützpunkte, Perioden, Datenquellen, Cache, P-/I-Klassen, Mehrparameter-Gewitterdiagnostik, Regen-, Wind-, Schnee- und Eisregenbewertung sowie appweite Einheiten und Zeitdarstellung bleiben erhalten. Die meteorologischen Schwellen und Diagnosen bleiben unverändert. Der Worker erhält ausschließlich die gekoppelte Versionsnummer 0.9.66.3; es entstehen keine zusätzlichen Datenabrufe oder Kosten.
