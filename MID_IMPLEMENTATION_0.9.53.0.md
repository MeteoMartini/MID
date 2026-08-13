# MID v0.9.53.0 – Events, Bergwetter, Hyperlokalität und amtliche Fachquellen

## Ausgangsbasis

Verbindliche Basis ist MID v0.9.52.4 auf `mid-stable`. Der Funktionsumfang bleibt erhalten; die Änderungen erweitern bestehende Module und Quellenpfade.

## I. Event Center

- Gespeicherte aktive Events werden bei sichtbarer App alle 30 Minuten im Hintergrund neu bewertet.
- Nach Wiederaufnahme der PWA bzw. bei Fokus werden überfällige Aktualisierungen nachgeholt.
- Im Glocken-Popover gibt es `Neu laden` für eine sofortige Neuberechnung der gespeicherten Events.
- Der Event-Center-Vertrag nutzt eigene Refresh-/Done-Events, damit Menü und Hintergrundmanager synchron bleiben.

## II. DWD-Schneefallgrenze

- Neue zentrale Funktion `dwdSnowfallLimit()`.
- Bevorzugt werden Temperatur und tatsächliche geopotentielle Höhe der 850-hPa-Fläche.
- Als Näherung gilt ein feuchtadiabatischer Gradient von 0,65 K je 100 m; für die Schneefallgrenze wird die +2-°C-Näherung verwendet.
- Ensemble-Mittelmodelle können dadurch auch dann eine vergleichbare Schneefallgrenze liefern, wenn keine native `snowfall_height`-Variable bereitsteht.
- Unsicherheiten aus T850- und Z850-Spread werden in einen Höhen-Spread übertragen.
- Ein Freezing-Level-Fallback bleibt für Quellen ohne Druckniveauwerte erhalten.

## III. Gezeiten

- Benutzertexte verwenden `Flut` und `Ebbe` statt `Hochpunkt` und `Tiefpunkt`.

## IV. Eventplaner

- Das zusätzliche Wort `Zeitraum` wurde in der Niederschlagsdarstellung entfernt.
- In den Details ersetzt ein Niederschlagsart-Symbol den Text `PoP`: Regen, Schnee bzw. konvektiv/Gewitter passend zur Eventlage.
- Die zugrunde liegende Event-Zeitraumwahrscheinlichkeit und Intervalllogik bleiben fachlich unverändert.

## V. Hyperlokale Analyse

- Die erweiterte Ansicht bleibt auf dynamische Ergebniswerte fokussiert.
- Methodische und nicht-dynamische Erklärungen liegen im appweiten `InfoHint`-Popover.
- Darin werden Modellhintergrund, lokale Restfeldkorrektur, Netze, Gelände, Oberflächenkontext und dynamische Exposition erklärt.

## VI. ICON-D2-RUC

- MID kennt DWD ICON-D2-RUC weiterhin als direkte amtliche Verfügbarkeitsquelle.
- Neu ist ein optionaler numerischer Worker-Punktadapter über `MID_DWD_RUC_POINT_ENDPOINT` und optional `MID_DWD_RUC_POINT_TOKEN`.
- Der Adapter kann RUC-Punktwerte in den Forecast-Fusion-Pfad einspeisen, ohne einen schweren GRIB-/Dreiecksgitterdecoder im Cloudflare Worker einzubauen.

## VII. Copernicus CLMS

- Direkte Abfrage von CLMS LCM10 über Copernicus Data Space/Sentinel Hub Statistical API integriert.
- OAuth2 Client-Credentials werden im Worker verwendet; erforderlich sind `MID_CDSE_CLIENT_ID` und `MID_CDSE_CLIENT_SECRET`.
- LCM10 wird als GIS-Oberflächenkontext in die lokale Repräsentativitäts-/Rauigkeitslogik eingebracht und hat Vorrang vor dem OSM-Proxy, sofern verfügbar.

## VIII. Dynamische Expositionskorrektur

- DEM-Umfeld wird in acht Windsektoren analysiert.
- Je Richtung werden Geländeproben in 700 m und 2.200 m Entfernung berücksichtigt; zusätzlich bleibt der nähere Morphologiekontext erhalten.
- Für die aktuelle Modellwindrichtung wird die Exposition zwischen benachbarten Sektoren interpoliert.
- Die Wind-/Böen-Restfeldkorrektur berücksichtigt dynamisch Geländeexposition und Oberflächenrauigkeit und bleibt bewusst konservativ begrenzt.

## IX. DWD-Synoptikvokabular

- Der Worker liest die aktuellen DWD-Synoptischen Übersichten Kurz- und Mittelfrist aus Open Data.
- Aus den Texten werden ausschließlich kontrollierte meteorologische Fachbegriffe erkannt; MID kopiert keine Textpassagen.
- Die Synoptikanalyse kann damit DWD-typische Fachrahmen wie Trog/Rücken, Frontogenese, Luftmassengrenze, Advektion, Hebung/Absinken oder Zwischenhocheinfluss passend zur eigenen dynamischen Analyse verwenden.
- DWD-Texte bleiben Terminologie-/Großwetterlagenreferenz und ersetzen keine lokale Punktprognose.

## Konfiguration

### CLMS

- `MID_CDSE_CLIENT_ID`
- `MID_CDSE_CLIENT_SECRET`
- optional `MID_CLMS_LCM_YEAR=2020`

### ICON-D2-RUC Punktwerte

- `MID_DWD_RUC_POINT_ENDPOINT`
- optional `MID_DWD_RUC_POINT_TOKEN`

## Regression

Neue Required-Regression: `scripts/test-mid-nine-step-integration-09530.mjs`. Sie schützt alle neun Integrationsverträge einschließlich Event-Refresh, DWD-Schneefallgrenze, Gezeitenbegriffe, Event-Niederschlagssymbole, Hyperlokal-Info, RUC-Adapter, CLMS, dynamische Exposition und DWD-Synoptikvokabular.
