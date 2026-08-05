# MID v0.9.16.1 – Cockpit-Querformat und Widget-Lesbarkeit

## Umgesetzt

- Die 14-Tage-Karten kapseln ihren Inhalt jetzt zuverlässig innerhalb der jeweiligen Kachel. Der Kopf nutzt eine feste Zweispaltenstruktur aus Wetter-/Datumsblock und Konsistenzfeld.
- Konsistenzfelder bleiben unabhängig von Displaybreite und Prozentwert immer einzeilig.
- Auf Smartphone- und schmalen Tabletbreiten werden die drei Messzeilen innerhalb einer Karte platzsparend zweistufig angeordnet: Bezeichnung und Wert oben, der zugehörige Balken darunter. Dadurch ragen Niederschlags-, Wind- oder Konsistenzangaben nicht mehr in Nachbarkarten.
- Der Widget-/PNG-Generator verwendet eine etwas breitere, weiterhin horizontal scrollbare Exportfläche und deutlich größere Schriften für Kopf, Tagesdaten, Wettertext, Temperaturen, Metadaten, Hazards und Fußzeile.
- Im Widget werden nur Hazards der höchsten für den jeweiligen Tag vorhandenen Warnstufe gezeigt. Mehrere gleichrangige Hazard-Arten bleiben sichtbar; niedrigere Stufen werden ausgeblendet.

## Regression

- Neue Regression `scripts/test-cockpit-landscape-widget-09161.mjs` schützt Kartenkapselung, einzeilige Konsistenzfelder, die mobile Messzeilenanordnung, die größeren Widget-Schriften und die Auswahl ausschließlich der höchsten Hazard-Stufe.

## Worker

- Keine funktionale Workeränderung. Der Worker wird ausschließlich auf v0.9.16.1 versionssynchronisiert.
