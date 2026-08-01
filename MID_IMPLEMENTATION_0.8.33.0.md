# MID v0.8.33.0

## Ziel
MOSMIX wird nicht als weiteres Rohmodell, sondern als stationsbezogenes statistisches Postprocessing in die adaptive Mehrquellen-Prognose eingebunden. Der bestehende Best-Match-Start bleibt unverändert schnell.

## MOSMIX-Qualitätslogik
- Aktivierung derzeit für Standorte in Deutschland.
- Abruf über DWD Open Data via Bright Sky im Cloudflare-Worker.
- maximal zehn Vorhersagetage beziehungsweise 240 Stunden.
- Auswahl eines ausreichend nahen und höhenkompatiblen MOSMIX-Punkts.
- harte Grenzen: maximal 55 km Entfernung, maximal 450 m Höhendifferenz und Mindestqualität 0,42.
- MOSMIX zählt nicht als unabhängige Modellfamilie, weil es auf ICON und IFS basiert.
- Einsatz nur, wenn die unabhängige Mehrquellen-Fusion bereits mindestens drei Modellfamilien und ausreichenden Konsens erreicht.
- stärkste Nachkorrektur an Tag 1–2, danach abnehmend; ab Tag 11 keine MOSMIX-Wirkung.

## Kurzfristvorhersage
- Direkte stündliche Korrekturen für Temperatur, Taupunkt, Feuchte, Luftdruck, Wind, Böen und Regenwahrscheinlichkeit.
- Niederschlagsmengen in den ersten sechs Stunden nur sehr vorsichtig angepasst.
- Radar- und Gewitternowcast werden anschließend angewandt und behalten damit Vorrang.
- Quellenbadge zeigt bei aktiver Anwendung „MID Mehrquellen + MOSMIX“.

## 7- und 14-Tage-Ausgabe
- Die adaptive Tagesfusion fließt in die 7-Tage-Vorhersage und in die Best-Match-Linien/-Balken der 14-Tage-Ensembleansicht ein.
- MOSMIX wirkt nur bis Tag 10; Tag 11–14 bleiben adaptive Modellfusion ohne MOSMIX.
- Ensemble-Streuungen und Quantile bleiben unverändert echte Ensembleinformationen.

## Messbarer Zusatznutzen
- Der Wetterzwilling archiviert „MID Prioritätsfusion ohne MOSMIX“ und „MID Prioritätsfusion + MOSMIX“ getrennt.
- Dadurch kann die lokale Verifikation zeigen, ob MOSMIX am konkreten Standort, in der Wetterlage und im jeweiligen Vorhersagehorizont tatsächlich verbessert.

## Responsivität
- Best Match wird weiterhin sofort dargestellt.
- Der Worker ruft Modellfusion und MOSMIX parallel ab.
- nur ein kompakter MOSMIX-Abruf pro Standort; Worker- und Browsercache verhindern Wiederholungen.
- kein zusätzlicher Abruf durch Kurzfrist- oder Ensemblemodule; alle Ansichten verwenden denselben Fusionsergebnis-Cache.
