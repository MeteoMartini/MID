# MID v0.9.85.129

## Gesundheitswetter kompakter
- Pollenflug erscheint im Standardzustand jetzt als sehr kompakter Gesundheitswetter-Block mit heutiger Belastung, Region und DWD-Stand.
- Direkt sichtbar sind nur Pollenarten mit tatsächlicher heutiger Belastung. Die erste geöffnete Detailstufe zeigt höchstens vier Pollenarten mit der höchsten relevanten 3‑Tage-Belastung.
- Die vollständige Übersicht aller acht DWD-Pollenarten wird erst nach „Alle 8 Pollenarten anzeigen“ eingeblendet.
- Die mobile 3-Tage-Ansicht passt ohne abgeschnittene dritte Spalte oder erzwungene horizontale Mindestbreite in die Karte.

## Fachliche Korrektur
- DWD-Zwischenstufen wie „keine bis gering“, „gering bis mittel“ und „mittel bis hoch“ werden nicht mehr fälschlich als „keine Belastung“ behandelt.
- Grundlage bleiben die sieben Belastungsstufen des amtlichen DWD-Pollenflug-Gefahrenindex; DWD-Datenquelle, Regionen und Vorhersagewerte bleiben unverändert.

## Bedienung
- Der Hauptschalter bleibt mindestens 44 px hoch, tastaturbedienbar und mit aria-expanded/aria-controls versehen.
- Region und Aktualitätsstand werden platzsparend dargestellt; geöffnete Details erhalten sicheren Abstand zur festen Bottom-Bar.
