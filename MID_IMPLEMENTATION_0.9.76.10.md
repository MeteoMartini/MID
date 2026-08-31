# MID v0.9.76.10 – 24-h-Wetterprofil nach Tagesansichtsprinzip

## Ziel

Der grafische Anteil des 24-h-Wetterprofils wird auf die klare Hierarchie der
Tagesansicht umgestellt, ohne Parameter oder Fachlogik zu verlieren.

## Umsetzung

- Rollendes Zeitfenster bleibt exakt `jetzt` bis `jetzt + 24 h`.
- Das SVG nutzt die tatsächlich verfügbare Breite; die frühere mobile
  Überbreite mit nachträglicher Verkleinerung wurde entfernt.
- Alle Parameterbahnen sind an `profileXForEpoch()` und damit an denselben
  vertikalen Zeitschritten ausgerichtet.
- Einheitliche Parameter-/Einheitenspalte und sparsamere Skalen bei Temperatur,
  Niederschlag, Wind und Luftdruck.
- DWD-Böenwarnschwellen werden direkt aus `DWD_WIND_THRESHOLDS_KMH` übernommen
  und als dezente Warnbänder/-linien im Windfeld dargestellt.
- Die Windskala reicht mindestens bis zur ersten DWD-Warnschwelle, auch bei
  ruhigem Wetter.
- Nachtstunden erhalten ein dezentes dunkles Schraffurband über die gesamte
  grafische Story-Achse.
- Sonnenaufgang und Sonnenuntergang bleiben exakt zeitlich verankert und werden
  zurückhaltend markiert.
- `JETZT` erhält eine eigene dezente vertikale Markierung; am unteren Rand wird
  dieselbe Zeitachse nochmals kompakt wiederholt.
- Wolken bleiben als vier achsenlose Intensitätsstreifen Gesamt/H/M/L erhalten.
- Der bestehende Einzeldaten-/Tooltip-Pfad und die 1-h/3-h-Umschaltung bleiben
  erhalten.

## Plattformvertrag

Die Änderung liegt ausschließlich im gemeinsamen React/Vite-Fachkern und den
kanonischen Styles. Browser, PWA und iOS-WebView nutzen dieselbe Umsetzung.
Es wurde kein iOS-Fork und keine Worker-Fachänderung erzeugt.

## Regression

`scripts/test-weather-profile-modern-dayview-097610.mjs` schützt:

- rollendes 24-h-Fenster,
- gemeinsame Zeitgeometrie,
- responsive Breite ohne mobile SVG-Verkleinerung,
- DWD-Windwarnschwellen,
- Nachtmarkierung,
- Sonnenauf-/untergang,
- Jetzt-Linie und untere Zeitreferenz,
- CSS-/Baseline-Verträge.
