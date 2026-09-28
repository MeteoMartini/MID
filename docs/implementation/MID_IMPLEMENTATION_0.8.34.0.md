# MID v0.8.34.0

## Kohärente Wettermodellbündel und horizontabhängige Quellenwahl

### Ausgangsproblem

Bis v0.8.33.17 konnten Niederschlagsmenge, Niederschlagswahrscheinlichkeit, Wettercode, Bewölkung und Sonnenschein auf mehreren Verarbeitungsebenen unabhängig voneinander verändert werden. Technisch korrekte Einzelwerte konnten dadurch zu einer meteorologisch widersprüchlichen Stunde zusammengesetzt werden, etwa:

- 0,1 mm Regen bei nur 10 % Wahrscheinlichkeit an Tag 5,
- „leichter Regen“ bei heiterem Tagescharakter und langen Sonnenanteilen,
- eine Tagesmenge ohne tatsächlich vorhandene Niederschlagsstunden,
- Niederschlag aus MOSMIX zusammen mit Bewölkung und Wettercode eines anderen Modells.

Open-Meteo Best Match stellt außerdem nicht für jede einzelne Variable und Stunde die konkrete interne Modellherkunft bereit. Die frühere Darstellung konnte deshalb das Ursprungsmodell eines solchen Kleinstsignals nicht belastbar ausweisen.

## Neue Architektur

### 1. Wetterbündel statt Parameterkreuzung

Folgende Parameter bilden jetzt je Stunde ein unteilbares Wetterbündel und stammen gemeinsam aus genau einem Modell:

- Niederschlagsmenge,
- Regen,
- Schauer,
- Schnee,
- Niederschlagswahrscheinlichkeit,
- WMO-Wettercode,
- Gesamtbewölkung,
- tiefe Bewölkung,
- CAPE,
- Sonnenscheindauer.

Das Bündel wird vollständig übernommen oder vollständig verworfen. Eine Mittelung beziehungsweise Kombination einzelner Wetterparameter aus unterschiedlichen Modellen findet nicht mehr statt.

### 2. Quellenwahl für Deutschland nach Vorhersagehorizont

| Vorhersagehorizont | Primäres Wetterbündel | Geregelte Fallbacks |
|---|---|---|
| bis etwa 54 Stunden | DWD ICON-D2 | ICON-EU, Best Match, ECMWF IFS/AIFS |
| etwa 54 bis 132 Stunden | DWD ICON-EU | ECMWF IFS, Best Match, ECMWF AIFS, ICON Global |
| ab etwa 132 Stunden | ECMWF IFS | Best Match, ECMWF AIFS, GFS, ICON Global |

Die Grenze orientiert sich an der real verfügbaren Reichweite der hochaufgelösten Regionalmodelle. Ein Modell wird nur verwendet, wenn für die konkrete Stunde ein vollständiges Bündel einschließlich Niederschlagswahrscheinlichkeit und Bewölkung vorliegt.

ECMWF IFS und AIFS gehören zur selben Modellfamilie. Sie dürfen als Alternativen beziehungsweise Fallbacks dienen, werden aber nicht als zwei unabhängige Zentren doppelt gewichtet.

### 3. Zulässige unabhängige Nachkorrekturen

Temperatur und Wind dürfen weiterhin separat konsens- oder MOSMIX-korrigiert werden, weil diese Parameter fachlich getrennt postprozessiert werden können. Dabei gelten feste Grenzen:

- MOSMIX darf keinen Niederschlag erzeugen,
- MOSMIX darf keine Niederschlagswahrscheinlichkeit liefern oder ableiten,
- MOSMIX darf keinen Wettercode, keine Bewölkung und keinen Sonnenschein ersetzen,
- Temperatur, Taupunkt und relative Feuchte bleiben als thermodynamisches Bündel konsistent,
- Taupunkt wird niemals oberhalb der Temperatur zugelassen,
- relative Feuchte wird nach der Korrektur aus Temperatur und Taupunkt neu berechnet,
- Böen bleiben mindestens so hoch wie der Mittelwind.

### 4. Keine erfundenen Niederschlagsstunden

Tagesmengen werden nicht mehr auf vermeintlich wahrscheinliche Stunden verteilt. Bei vollständiger Stundenabdeckung wird der Tageswert ausschließlich aus den finalen Stunden aggregiert.

Eine Tageswahrscheinlichkeit darf ohne deterministische Stundenmenge bestehen bleiben. Sie wird dann als probabilistisches Risiko gezeigt, erzeugt aber weder Niederschlagsbalken noch Regensymbol oder Regenwortlaut.

### 5. Horizontabhängige Stützung kleiner Signale

Kleine deterministische Mengen bis einschließlich 0,35 mm benötigen folgende Mindestwahrscheinlichkeit:

- bis 24 Stunden: mindestens 10 %,
- 24 bis 72 Stunden: mindestens 15 %,
- danach: mindestens 20 %.

Bei fehlender Stützung wird nur die deterministische Menge samt Wettercode entfernt. Die ursprüngliche Wahrscheinlichkeit bleibt sichtbar. Es findet keine zeitliche Glättung statt.

### 6. Physikalische Regen-/Schauerprüfung

Stratiformer Regen benötigt eine tragfähige Schichtbewölkung, beispielsweise:

- hohe Gesamtbewölkung,
- hohe tiefe Bewölkung,
- sehr hohe Feuchte,
- kaum Sonnenschein.

Bei aufgelockerter Bewölkung, Sonnenschein und konvektiver Unterstützung wird ein vorhandenes Regensignal als Schauer klassifiziert. Fehlt sowohl stratiforme als auch konvektive Unterstützung, wird ein schwaches Signal unterdrückt.

Für den beanstandeten Freitag bedeutet dies:

- 0,1 mm bei 10 % an ungefähr Tag 5 wird nicht mehr als „leichter Regen“ ausgegeben,
- 0,3 mm Tagesmenge bei 13 % bleibt ohne gestützte Stunden nicht als deterministische Tagesmenge stehen,
- die Wahrscheinlichkeit kann weiterhin als geringe Unsicherheit sichtbar bleiben,
- ein tatsächlich gestütztes Niederschlagsereignis bei Auflockerungen erscheint als Schauer statt als Dauerregen.

### 7. Transparente Herkunft

Die Stunden-Detailansicht zeigt nun das tatsächlich verwendete Wetter-/Niederschlagsbündel, beispielsweise:

> Wetter-/Niederschlagsbündel: DWD ICON-EU · kohärent aus einem Modell

Damit lässt sich künftig unmittelbar erkennen, aus welcher expliziten Modellquelle ein Signal stammt. Für einen reinen Best-Match-Fallback wird dies ebenfalls ausgewiesen.

## Betroffene Sektionen

Die gemeinsame finale Wetterstundenreihe versorgt unter anderem:

- Aktuelles Wetter,
- Kurzfristvorhersage,
- 7-Tage-Vorhersage,
- Tagesdetaildiagramm und Stundenkarten,
- Wettertexte und Piktogramme,
- Hazards,
- Gewitter- und Wassersportauswertung,
- Ensemble-Best-Match-Referenz,
- Widgets und PNG-Export,
- Favoritenregeln,
- Worker-Fusion und Modelllaufvergleiche.

## Regression

Der neue Vertrag wird durch `scripts/test-coherent-weather-bundles-08340.mjs` geschützt. Geprüft werden insbesondere:

- horizontabhängige Modellquelle,
- vollständige Kopplung des Wetterbündels,
- keine Niederschlagsübernahme aus MOSMIX,
- keine künstliche Tages-zu-Stunden-Verteilung,
- Tag-5-Spuren mit 0,1 mm/10 %,
- Regen-/Schauerklassifikation anhand der Bewölkungs- und Konvektionslage,
- thermodynamische Konsistenz von Temperatur, Taupunkt und Feuchte,
- transparente Quellenanzeige.
