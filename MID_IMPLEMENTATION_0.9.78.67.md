# MID 0.9.78.67 – kalibrierte Vorhersagekonfidenz der 14-Tage-Übersicht

Grundlage ist MID 0.9.78.66. Dieses Release ersetzt die bisher zu konservative, weitgehend durch den schwächsten Einzelparameter bestimmte 14-Tage-Konsistenzbewertung durch eine robuste, vorlaufabhängige Prognosekonfidenz mit separat ausgewiesener Datenqualität.

## Fachlicher Kern

Die sichtbare Bewertung bleibt ausdrücklich **keine Trefferwahrscheinlichkeit in Prozent**. Der interne Index von 0–100 beschreibt die relative Prognosekonfidenz aus Ensemble-Spread, unabhängigen Modellfamilien, Vorlauf und – soweit belastbar vorhanden – lokaler Rückblickgüte.

### Robuste Mehrparameter-Aggregation

Die Tagesbewertung wird nicht mehr vom schlechtesten Parameter allein bestimmt. Verwendet werden:

- Niederschlag: 32 %
- Temperatur: 28 %
- Wind/Böen: 28 %
- relative Sonnenscheindauer: 12 %

Mehrere schwache Kernparameter reduzieren die Gesamtbewertung zusätzlich. Ein einzelner schwacher Parameter bleibt dagegen sichtbar, ohne einen ansonsten konsistenten Tag automatisch auf „gering“ zu drücken. Die Sonnenscheindauer kann die Tageskonfidenz nicht allein dominieren.

### Niederschlagswahrscheinlichkeit und Unsicherheit

Ein Ereignisanteil um 50 % bedeutet einen offenen Ereignisausgang, aber keine schlechte probabilistische Prognose. Die Wet-/Dry-Aufteilung wird deshalb nicht mehr als eigenständige Konfidenzstrafe verwendet. Die meteorologische Konfidenz ergibt sich aus dem Ensemble-Spread der Niederschlagsmenge; ein ungefähr 35–65-%-Ereignisanteil wird separat als offener Ausgang gekennzeichnet.

### Vorlaufabhängige Spread-Normalisierung

Die P10–P90-Breiten werden gegen mit dem Vorlauf ansteigende Referenztoleranzen bewertet. Derselbe absolute Spread wird an Tag 10 daher anders eingeordnet als an Tag 2. Gleichzeitig begrenzen Vorlauf-Caps unrealistisch hohe Langfristkonfidenz:

- bis 72 h: maximal 96/100
- bis 120 h: maximal 92/100
- bis 168 h: maximal 88/100
- bis 216 h: maximal 84/100
- bis 264 h: maximal 80/100
- bis 312 h: maximal 77/100
- darüber: maximal 74/100

Die Basistoleranzen am kurzen Vorlauf bleiben 4/8 K für Temperatur, 3/10 mm für Niederschlag, 8/16 kt für Wind, 12/24 kt für Böen und 25/50 Prozentpunkte für relative Sonnenscheindauer.

### Datenqualität getrennt von meteorologischer Konfidenz

MID bewertet die Datenbasis separat als `gut`, `eingeschränkt`, `schwach` oder `nicht ausreichend`. Fehlende oder ältere Läufe verschlechtern deshalb primär die Datenqualität und nicht unmittelbar die meteorologische Modellübereinstimmung.

Erwartete Ensemblefamilien werden parameterweise bestimmt. Eine Modellfamilie, die einen Parameter strukturell nicht liefert, wird für diesen Parameter nicht mehr als ausgefallene Quelle gezählt. Ein Einzelmodell-Bootstrap bleibt weiterhin als vorläufige Datenbasis erkennbar und darf keine normale Mehrmodell-Konfidenz erhalten.

Bei schwacher Datenbasis wird die sichtbare Gesamtaussage vorsichtig begrenzt; bei weniger als zwei belastbaren Kernparametern bleibt die Tageskonfidenz nicht bewertbar.

### Lokale Skill-Kalibrierung

Die bereits vorhandene MID-Prognoseverifikation wird als kleine, stark geschrumpfte Korrektur genutzt:

- nur bei mindestens fünf belegten Rückblicktagen,
- nur bis ungefähr 96 h Vorlauf,
- getrennt nach 24-/48-/72-h-Segmenten, sofern vorhanden,
- Temperatur, Niederschlagsmenge, Böen und Sonnenscheindauer über bestehende Fehlermaße,
- Niederschlagswahrscheinlichkeit über den vorhandenen Brier-Fehler,
- maximale Korrektur je Parameter ungefähr −6 bis +5 Indexpunkte.

Kurzfristige lokale Skillwerte werden ausdrücklich nicht auf die zweite Prognosewoche extrapoliert.

## UI

- 14-Tage-Cockpit und Ensemblemodul verwenden denselben zentralen `assessEnsembleDay`-Pfad.
- Füllfarbe/Index repräsentieren die meteorologische Prognosekonfidenz.
- Ein separater Datenqualitäts-Außenring kennzeichnet eingeschränkte oder schwache Datengrundlage.
- Detailtexte erläutern Vorlaufnormalisierung, Datenbasis und lokale Kalibrierung.
- Die Anzeige vermeidet die Bezeichnung einer gemeinsamen „Trefferwahrscheinlichkeit“.

## Regressionspflege

Drei ältere Tests wurden an den neuen, fachlich stärkeren Vertrag angepasst, ohne Produktionslogik zurückzubauen:

- `test-cockpit-fourteen-day-character-094017.mjs` akzeptiert den neuen Kalibrierungsparameter des 14-Tage-Serienpfads.
- `test-cockpit-fourteen-uncertainty-date-09153.mjs` prüft die kalibrierte Konfidenzzusammenfassung einschließlich Datum.
- `test-ensemble-fast-availability-097836.mjs` prüft den Einzelmodell-Bootstrap über die neue getrennte Datenqualitätslogik statt über eine alte Quelltextform.

## Umfang

Keine Änderung an amtlichen Warntexten, Skybar-Klassifizierung, Favoritenlogik, Druckachse, Radar/Nowcast oder Cloudflare-Ressourcen. Der Worker erhält nur die normale Versionssynchronisierung; seine Fachlogik wird nicht verändert.
