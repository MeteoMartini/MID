# MID v0.9.78.72 – Webarchiv-Prüfung Kurzfrist, Wetterzwilling und Schneefallgrenze

## 1. Nächste 90 Minuten

Die erste sichtbare Kachel wird unterdrückt, wenn sie nur ein Restintervall von weniger als fünf Minuten bis zum nächsten regulären 15-Minuten-Zeitpunkt repräsentiert. Der Datenpunkt bleibt intern erhalten; nur die redundante Kurzzeitkachel entfällt.

## 2. Wetterzwilling

Die lokale Lernlogik normalisiert Prognosen bereits über `stableModelIdentity` und verteilt Gewichte über Unabhängigkeitsgruppen. Eine identische DWD-ICON-EPS-Bezeichnung darf daher nicht als zweite unabhängige Stimme interpretiert werden. Die UI aggregiert identische Labels innerhalb derselben Unabhängigkeitsgruppe defensiv, auch wenn ältere Archivstände unterschiedliche technische IDs enthalten.

## 3. Schneefallgrenze / Niederschlag

Die regelmäßigen vertikalen Streifen waren keine Aussage über periodisch auftretenden Niederschlag, sondern entstanden aus der Abbildung jedes 3-/6-h-Schneefallgrenzenpunkts auf ein Tages-/Fenstersignal. Ab dem Ende der stündlichen Höhenprognose gilt jetzt:

- vorhandene 6-h-Ensemblefenster bestimmen die zeitliche Markierung,
- eine Tageswahrscheinlichkeit wird nicht auf jedes Teilintervall kopiert,
- nicht zeitlich aufgelöste Tageswahrscheinlichkeit erscheint als ein zusammenhängendes Tagesband,
- zusammenhängende aktive Punkte werden zu einem Niederschlagsband verschmolzen,
- der Übergangstag wird am letzten stündlichen Datenzeitpunkt beschnitten, um Doppelangaben zu verhindern.

Der Open-Meteo-/MID-Ensemblevertrag, Modellfamilienvertrag und die in v0.9.78.70 übernommenen KMA-/Ensemble-API-Änderungen bleiben unverändert.
