# MID v0.9.84.0 – Audit ICON-D2-RUC / RUC-EPS

## Ziel

ICON-D2-RUC und RUC-EPS sollen dort eingesetzt werden, wo ihre stündliche Aktualisierung, hohe räumliche Auflösung und Kurzfristhorizont bis +14 h einen echten Mehrwert liefern. Sie dürfen keine Datenfamilie doppelt gewichten, keine nicht vorhandene Ensemblegröße vortäuschen und beobachtungsnahe Radar-/Blitz-/Stationsdaten nicht verdrängen.

## In v0.9.84.0 erweitert

| Bereich | Umsetzung | Fachlicher Vertrag |
| --- | --- | --- |
| Hyperlokale Niederschlagsfusion | RUC-EPS liefert neben PoP nun signifikante PoP und Q75. Ein isoliert zu nasser deterministischer RUC wird zusätzlich gegen das RUC-EPS-Q75 plausibilisiert. | Q75 ist keine harte Mengenobergrenze. Radar/Nowcast und lokale Beobachtungen bleiben nachgelagert höher priorisiert. |
| Extremwetter · Stark-/Dauerregen | Voraggregierte RUC-EPS-I1–I4-Überschreitungswahrscheinlichkeiten kalibrieren die kurzfristige ICON-D2-EPS-Gefahrenwahrscheinlichkeit begrenzt aufwärts und abwärts. | Eine bereits ensemblegestützte I-Stufe kann durch einen einzelnen Kurzfristlauf nicht einfach gelöscht werden; deterministischer RUC stützt Intensität nur bei echter Schwellenüberschreitung. |
| Extremwetter · Gewitter | RUC-EPS-Niederschlagsstützung moduliert die vorhandene RUC-CAPE/CIN-/Konvektionsdiagnostik. | Keine Gewitterstufe aus RUC allein ohne Ensemblegrundsignal; Radar/KONRAD3D/Blitz bleiben beobachtungsnahe Bestätigung. |
| Extremwetter · Schnee | RUC-Temperatur, Schneefallgrenze, Nullgradgrenze und native Schneefallphase werden mit RUC-EPS-Niederschlagswahrscheinlichkeit gekoppelt. | Nur konsistente Phasen-/Kältesignale dürfen bestehende Schneegefahr stärken; warme Widersprüche senken Vertrauen vorsichtig. Keine ungestützte hohe Intensitätsstufe. |
| Extremwetter · Eis | RUC-Temperatur, Nullgradgrenze, Regenphase und Feuchte werden mit RUC-EPS-Niederschlagswahrscheinlichkeit gekoppelt. | Keine neue Eisgefahr ohne bestehendes EPS-Signal, da keine direkte RUC-EPS-Freezing-Rain-Verteilung vorliegt. |
| Transparenz | Extremwetterdetails zeigen RUC-EPS-Memberzahl, PoP, signifikante PoP, Q75 und Schnee-/Eis-Phasenstützung; Modellcockpit nennt die Q75-Ausreißerplausibilisierung. | Die UI macht sichtbar, ob Kurzfrist-RUC/RUC-EPS die Aussage stützt oder kalibriert. |

## Bereits vorhanden – bewusst keine zweite RUC-Gewichtung

Diese Bereiche beziehen die kanonischen `displayHours`, `displayMinutes15` oder die Forecast-Fusion bereits nach der RUC/RUC-EPS-Kalibrierung. Eine zusätzliche RUC-Mischung würde die DWD-Familie doppelt gewichten:

- Hauptprognose / hyperlokale Analyse / 90-min- und 24-h-Darstellung
- Tages-/7-Tage-Darstellung innerhalb des RUC-Horizonts
- Widget
- Eventplaner für den aktuellen Ort
- Wassersportanalyse
- Wetterzwilling / Prognoseverifikation
- Prognoseänderungs-Push
- Lüftungsassistent
- Berg-/Wintersport-Gewitterdiagnostik über `rapidMinutes15`

## Weitere Einsatzszenarien geprüft

### Niederschlagsbeginn-Push – sinnvoll, aber nicht in v0.9.84.0

Der reine Niederschlagsbeginn-Push verwendet derzeit Open-Meteo-15-min plus Radar und nicht die gesamte kanonische Fusion. RUC/RUC-EPS könnte den Beginn innerhalb weniger Stunden verbessern. Ein vollständiger Forecast-Fusion-Aufruf pro Favorit und Push-Prüfung wäre jedoch unnötig teuer. Empfohlen ist später ein kleiner gecachter RUC-Rapid-Onset-Adapter, der nur 5-/15-min-Niederschlag und RUC-EPS-PoP liest und Radar weiterhin Vorrang gibt.

### Flugmeteorologie entlang einer Route – hohes Potenzial, eigener Ausbau

Ein einzelner RUC-Punkt reicht für eine Flugroute nicht aus. Sinnvoll wäre ein gebatchtes, gecachtes Corridor-Sampling für Abflug, Strecke und Ankunft bis +14 h. Besonders wertvoll wären Böen, Sicht, Ceiling, Nullgradgrenze, Konvektion und Niederschlagsphase. Das gehört als eigener Flugmet-Vertrag umgesetzt, um weder Datenlast noch räumliche Repräsentativität zu verschlechtern.

### Berg-/Wintersport – potenziell wertvoll, nur höhenangepasst

Die Bergansicht nutzt RUC bereits für Gewitter-Rapid-Diagnostik. RUC-Schneefall-/Nullgradgrenze und Sicht werden bewusst noch nicht direkt auf alle Höhenstufen übertragen, weil ein einzelner bodennaher Rasterpunkt eine Hang-/Gipfelprognose verfälschen kann. Sinnvoll ist später ein höhen- und ortsbezogenes RUC-Sampling je Bergprofil.

### Extremwetter Wind – erst mit echtem Wind-RUC-EPS

Der deterministische RUC stützt Sturm bereits nur bei überschrittener Böenschwelle. Die aktuelle RUC-EPS-Vorverarbeitung enthält Niederschlagsmember, aber keine Wind-/Böenmember. Eine probabilistische RUC-EPS-Windkalibrierung wird deshalb ausdrücklich nicht synthetisiert. Sie ist erst sinnvoll, wenn echte Member-Windfelder in den Preprocessor aufgenommen werden.

### Mehrlauf-Trend / Widerspruch – sinnvoller nächster Qualitätsbaustein

Für eine Abwertung kurzfristiger Ensemblegefahren wäre ein einzelner deterministischer RUC-Lauf zu aggressiv. Wissenschaftlich sinnvoller wäre ein gecachter Trend der letzten 2–3 vollständigen RUC/RUC-EPS-Läufe. Wiederholte, räumlich konsistente Widersprüche könnten dann die Konfidenz vorsichtig reduzieren, ohne ein EPS-Signal zu löschen.

### Strahlung / PV / Thermik – Daten vorhanden, noch nicht ausreichend validiert

RUC führt direkte/diffuse/netto kurzwellige Strahlung. Eine Ableitung von Sonnenscheindauer oder PV-/Thermik-Eignung erfordert Sonnenstandsprojektion und Kalibrierung. Daher bleibt dieser Pfad bewusst diagnostisch und wird nicht nur wegen Datenverfügbarkeit aktiviert.

### Klima / Langfrist / Reisezeit – nicht geeignet

RUC endet bei +14 h und ist für klimatologische, saisonale oder langfristige Reiseplanung nicht geeignet. Dort bleibt RUC bewusst unberücksichtigt.

## Priorisierte nächste Ausbaureihenfolge

1. Leichtgewichtiger RUC/RUC-EPS-Niederschlagsbeginn-Push mit Radar-Vorrang.
2. Flugmet-RUC-Corridor-Sampling mit Batch-/Cache-Vertrag.
3. Höhenangepasstes RUC-Sampling für Berg-/Wintersport.
4. Rolling 2–3-Run-RUC/RUC-EPS-Trend für vorsichtige Kurzfrist-Konfidenzkalibrierung.
5. Echte RUC-EPS-Wind-/Böenmember nur dann, wenn sie sauber vorprozessiert und speicherverträglich bereitgestellt werden können.
