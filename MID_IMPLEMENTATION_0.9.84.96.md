# MID v0.9.84.96 – Implementierungsstand

## Basis

- Kanonische Ausgangsbasis: `mid-stable` v0.9.84.95, Commit `bc4c0100f6d7034ee2d1c46461d51dcc1865c139`.
- Letzter erfolgreicher Installer vor diesem Kandidaten: GitHub Actions `MID-Release aus ZIP installieren und veröffentlichen` #1049.
- DWD-RUC-Vorverarbeitung nach der Installation: Lauf #541 erfolgreich.
- Release-Ziel: v0.9.84.96.

## 1. Isohypsen und Fronten

Die sichtbaren gpdm-Beschriftungen ohne zugehörige Isohypsenlinien wurden auf einen Renderer-Konflikt zurückgeführt: Der historische Leaflet-/SVG-artige Pfad ist innerhalb der aktuellen MapLibre-Kompatibilitätsschicht nicht in allen Fällen zuverlässig sichtbar.

Für 500-hPa-Isohypsen wird deshalb der bereits vorhandene DWD-ICON-WMS-Pfad als bevorzugte Darstellung benutzt. Das Komposit fordert bei `Isohypsen` bzw. `beide` das DWD-Produkt `Icon_reg025_fd_pl_GH` für 500 hPa an. Solange der native WMS-Stand noch nicht bereit ist, rendert MID die vorhandenen Vektorkonturen über einen eigenen `CanvasOverlay`-Fallback. Der Fallback ist geglättet, gold/amberfarben und gestrichelt und bleibt von Leaflet-SVG unabhängig.

Fronten erhalten denselben Robustheitsansatz. Objektiv diagnostizierte Frontkandidaten und regionale Frontalzonen werden zusätzlich über einen MapLibre-Canvas-Layer gezeichnet. Der bisherige Vektorpfad bleibt bestehen; der Canvas-Layer verhindert, dass die Darstellung allein an der Kompatibilitätsschicht scheitert. Die amtliche DWD-Bodenanalyse wird nicht künstlich georeferenziert oder verzerrt und bleibt als Referenzprodukt unverändert.

## 2. Schnellere hyperlokale Analyse

Auf normalen Verbindungen werden die bereits vorhandenen Aufgaben früher und stärker parallel gestartet:

- schnelle Stationsbeobachtung nach ca. 35 ms,
- Radar-/Niederschlagsabruf nach ca. 85 ms,
- vollständige Stationsanalyse nach ca. 140 ms.

Forecast, Stationsanalyse und Radarabgleich blockieren einander damit seltener. Die eigentliche Modellfusion, Datenquellen, Plausibilitätsprüfungen, Beobachtungsprioritäten und meteorologischen Berechnungen bleiben vollständig erhalten. Für langsame/datensparende Verbindungen bleibt die konservativere Staffelung aktiv.

## 3. Ceiling

Das bereits verfügbare DWD ICON-D2-RUC-Feld `CEILING` wird in die kanonische Kurzfriststunde übernommen. In `Aktuelles Wetter` gilt:

1. frischer beobachteter Stations-/METAR-Ceiling-Wert,
2. andernfalls RUC-/Kurzfrist-Modell-Ceiling, ausdrücklich als `Modell-Ceiling` gekennzeichnet.

Auch die Flug-/Eventwetteranalyse bevorzugt verfügbare RUC-Ceiling-Werte gegenüber der bisherigen reinen Druckniveau-/Feuchteschätzung. Der Datenursprung wird in der Quellenanzeige ausgewiesen. Reguläre ICON-D2-/ICON-EU-Ceiling-Pfade werden bewusst nicht noch in diesen Hotfix aufgenommen; ihre Einbindung benötigt eine breitere Broker-Erweiterung und folgt als eigener Ausbauschritt.

## Worker

Gegenüber v0.9.84.95 wurde keine neue Worker-Fachlogik ergänzt. Der vorhandene Worker stellt das DWD-WMS-Isohypsenprodukt und die benötigten RUC-Ceiling-Daten bereits bereit. Unterschiede in Worker-Dateien betreffen nur die synchronisierte Release-Version.
