# MID v0.9.78.45

## Befund
Die v0.9.78.43-Piktogrammzentralisierung hatte das große Tagespiktogramm korrekt an `dayWeatherCharacter` gebunden, die sichtbare Beschreibungspille der 7-Tage-Cockpitkarte jedoch weiterhin aus `dayRegime`/`regimeLabel` erzeugt. Dadurch konnte ein meteorologisch gemischter Tagescharakter wie `Wolkig, oft sonnig` als grobes Regime `sunny` erkannt und sichtbar nur mit `Sonnig` beschriftet werden, obwohl Piktogramm und Skybar mehr Bewölkung zeigten.

## Umsetzung
- Sichtbarer Text der 7-Tage-Tageskarte kommt jetzt aus `dayWeatherCharacter(...).label`.
- Das kleine Symbol in derselben Pille nutzt denselben `dayVisual`-Code und dieselben Cloud-Layer-Werte wie das große Tagespiktogramm.
- `regimeText` bleibt erhalten, steuert aber nur noch sekundäre UI-/Farbmetadaten und den Diagnose-Tooltip.
- Der klassische 7-Tage-Pfad war bereits konsistent und bleibt unverändert.

## Ergebnis
Beschreibung, großes Tagespiktogramm und kleines Pillenpiktogramm stammen nun aus demselben Tagescharakter. Die Skybar bleibt als zeitlicher Verlauf bewusst detaillierter, ohne aus einer konkurrierenden Datenquelle zu stammen.
