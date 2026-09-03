# MID Implementation v0.9.78.4

Datum: 2026-09-03

## Anlass

Nach der Korrektur des Release-Installers wurden im neuen 7-Tage-Cockpit noch zwei UI-Nachschärfungen gefordert:

1. Die Tagesbreite des oberen Piktogramm-/Tageskopfs sollte exakt mit dem zugehörigen 00–24-h-Abschnitt im Diagramm übereinstimmen.
2. Die Tmin/Tmax-Badges in 7 und 14 Tagen sollten optisch ruhiger werden; im 7-Tage-Modus sollten die Zusatzlabels „Min“ und „Max“ entfallen.

## Umsetzung

### 1. Exakte Geometrie zwischen Tageskopf und Diagramm

`SevenDayCurveOverview` verwendet für den Tageskopf nun dieselben relativen linken und rechten Plotränder wie das SVG-Diagramm (`42/700` bzw. `10/700` der Gesamtbreite). Diese Werte werden als CSS-Variablen gesetzt und für das obere 7er-Tagesraster verwendet.

Ergebnis:

- jeder Tageskopf besitzt dieselbe effektive Breite wie der darunterliegende Diagramm-Tag,
- 00–24 h eines Kalendertags liegen optisch genau unter dem zugehörigen Piktogrammblock,
- die Ausrichtung bleibt auch bei responsiver Breite erhalten.

### 2. Schwächere Tmin/Tmax-Hintergründe

Die Temperatur-Badge-Töne wurden zentral entschärft:

- `ecmwfTemperatureTone()` erhielt eine schwächere Hintergrundmischung für den 7-Tage-Modus,
- `dailyTemperatureTone()` erhielt reduzierte Hintergrund- und Randanteile für den 14-Tage-Modus.

Dadurch bleiben die Zahlen besser lesbar, ohne die thermische Einordnung zu verlieren.

### 3. „Min“/„Max“ im 7-Tage-Modus entfernt

Im Forecast-Cockpit sowie in der klassischen 7-Tage-Liste zeigen die Tmin/Tmax-Badges jetzt nur noch die Werte, nicht mehr die zusätzlichen Textlabels „Min“ und „Max“.

## Ergebnis

v0.9.78.4 ist ein reiner UI-/Darstellungs-Hotfix für die 7-/14-Tage-Prognose. Fachlogik, Datenquellen, Forecast-Fusion und Workerlogik bleiben unverändert.
