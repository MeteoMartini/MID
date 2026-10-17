# MID v0.9.85.278 · Skybar an tatsächlichen Sonnenzeiten ausrichten

- Die durchgehende Skybar unterscheidet jetzt auch innerhalb eines Stunden- oder Viertelstundenabschnitts präzise zwischen Nacht und Tageslicht. So verschwinden scheinbare Lücken unmittelbar nach Sonnenaufgang und gelbe Wolkenlücken enden rechtzeitig bei Sonnenuntergang.
- Die exakten Sonnenzeiten werden aus dem vorhandenen astronomischen Orts-/Zeitzonenmodell übernommen. Bewölkung bleibt eine eigene Modellgröße; ein gelbes Wolkenlückenband wird nicht als gemessene Sonnenscheindauer ausgegeben.
- Niederschlag bleibt mit unveränderter Menge, Phase, Farbgebung und Gültigkeitszeit auf seiner ursprünglichen Zeitachse. Auch klare Nächte und echte Datenlücken behalten ihre bisherige Bedeutung.
- Skybar-Kurven der Kurzfristansicht, des 24-Stunden-Profils, der Tageskarten und der 7-Tage-Kurvenübersicht verwenden denselben geprüften Intervallhelfer. Stundenquadrate bleiben diskrete Stunden-/Viertelstundensymbole; eine visuelle Minutenteilung findet nur im durchgehenden Band statt.

# MID v0.9.85.277 · Satellit→Modell-Zeitachse und optionale Isobaren

- Das neue „Modell-Wolkenbild“ in der gemeinsamen Kartenzeitachse erscheint nur an bestätigten Modellterminen. Während tatsächlicher Satelliten-/Radarbeobachtungen oder Nowcast bleibt das Modell-Wolkenoverlay ausgeblendet. Nutzer können die vorhandene Satellitenebene zur Betrachtung des Beobachtungs→Modell-Übergangs zuschalten; es werden keine Zwischenbilder erfunden.
- Für „Wolken und signifikantes Wetter“ lassen sich zusätzlich **Isobaren (hPa)** einschalten. Die erste Ausbaustufe verwendet ausschließlich geprüfte DWD ICON-D2-Druckkonturen desselben Modelllaufs und Gültigkeitszeitpunkts. Die Auswahl bleibt gespeichert und wird in SVG-/PNG-Exporten berücksichtigt. Bei Modellen ohne passende verifizierte Konturen (derzeit insbesondere GDPS) werden keine Isobaren vorgetäuscht.
