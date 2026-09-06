# MID 0.9.78.81 – Satellit und Wiedergabe

Basis: MID-professional-replacement(20260906-121350).zip, 0.9.78.80. Die zwischenzeitlichen Gesamtapp-Änderungen bleiben erhalten.

## Ursachen und Korrekturen

1. Satellitenbilder wurden am Radar-Zielzeitpunkt nach sechs Minuten Toleranz plus fünf Minuten Ausblendung unsichtbar. Im Livebetrieb bleibt jetzt das vom Worker als verfügbar gemeldete jüngste Satellitenbild sichtbar, auch wenn es später als das Radar geliefert wird. Sein tatsächlicher Beobachtungszeitpunkt wird ausgewiesen.
2. Der bisherige 900-ms-Intervalltimer wechselte unabhängig vom Kachelladen. Der neue Timer beginnt die Anzeigedauer erst bei Bereitschaft der benötigten Ebenen. Langsam: 4,8 s; Normal: 2,4 s; Schnell: 1,2 s. Am letzten Bild zusätzlich 1,2 s Pause. Die Auswahl gilt für die laufende Sitzung.
3. Das geladene Satellitenbild bleibt während des nächsten Abrufs sichtbar; die Beschriftung folgt weiterhin dem dargestellten Bild. Nach dem Laden blendet die neue Ebene über 350 ms ein. Die vorherige Ebene bleibt kurz darunter erhalten. Es werden keine meteorologisch errechneten Zwischenbilder suggeriert.
4. Geladene Rasterquellen melden ihre Bereitschaft unabhängig vom globalen Karten-Idle. Aktuelle Callback-Referenzen verhindern, dass verspätete Ladeereignisse einen inzwischen überholten Zeitpunkt aktivieren.
5. Satellit und die Kombination Radar + Satellit spielen bestätigte Satellitenbeobachtungen innerhalb des 90-Minuten-Fensters ab. Die reine Radaransicht behält ihre Nowcast-Zeitstände. Es werden keine Satellitenprognosen oder zukünftigen Beobachtungsbilder erfunden.
6. Bei 20 s erfolglosem Warten pausiert die Wiedergabe mit einem Hinweis, statt unbemerkt weiterzuspringen. Play oder die manuelle Zeitwahl bleiben verfügbar.

## Zeitraum richtig lesen

−1:30 bis beispielsweise −0:40 bedeutet: der jüngste vom Dienst gemeldete Beobachtungsstand liegt 40 Minuten zurück. 0:00 darf erst angeboten werden, wenn tatsächlich ein entsprechendes Bild vorliegt. Der jüngste verfügbare Quellenzeitpunkt wird deshalb separat ausgewiesen. Dieser Clientfix garantiert keine geringere Lieferlatenz des Satellitendienstes.

## Prüfung und Installation

Neuer ausführbarer Regressionstest prüft die tatsächliche Bildauswahl bei 40 Minuten Lieferlatenz, das Verbot zukünftiger Satellitenbilder, Ladeabbruch, alle Geschwindigkeiten, die Schleifenpause sowie Raster-Callbacks und Bereitschaft ohne globales Idle. Bestehende Historienprüfung schützt weiterhin den tatsächlichen angezeigten Zeitstempel bei Pufferung.

Frontendänderung; keine fachliche Workeränderung gegenüber 0.9.78.80. Worker mit den Zeitparser-/Synoptikfixes aus mindestens 0.9.78.75 erforderlich. Der versionsgleiche Worker liegt als Backup bei. Kein Deployment durchgeführt. Touch-/Safari-Endgerätetest nicht durchgeführt; automatisierte Zustands- und Buildprüfungen ersetzen diesen nicht.

## Aktuelle Quellenprobe

EUMETSAT GetCapabilities am 06.09.2026 um 13:23:06 UTC: MTG GeoColour letzter Stand 12:50 UTC; IR10.5 letzter Stand 13:00 UTC. Beide Produkte melden PT10M als Zeitschritt. Dies belegt in dieser Probe etwa 33 bzw. 23 Minuten Lieferabstand; daraus lässt sich keine feste zukünftige Latenzgarantie ableiten. Quelle: https://view.eumetsat.int/geoserver/wms?service=WMS&request=GetCapabilities
