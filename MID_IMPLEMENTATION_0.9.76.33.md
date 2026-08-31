# MID v0.9.76.33 – Tagesdetail-Stundenwechsel und 24-h-Profilpolitur

## Ziel
Zwei gemeldete UI-Regressionspunkte werden ohne Architekturbruch im gemeinsamen React/Vite-/iOS-Fachkern behoben:

1. Die unteren Schrittpfeile in der Tagesdetailkarte dürfen beim Wechsel über Mitternacht nicht auf den Mittags-Fallback des Folgetags springen.
2. Im 24-h-Wetterprofil sollen die Wolkenbänder in die obere Kopfzone unter die Wetter-Piktogramme rücken; außerdem sollen Temperatur- und gefühlte Temperaturkurve feiner wirken.

## Umsetzung

### 1) Robuster stundenweiser Tageswechsel
- In `src/App.tsx` wurde die bisherige nackte Stunden-Ref durch `requestedClockSelectionRef` ersetzt.
- Vorgemerkt wird nun **Datum plus Zielstunde** statt nur einer isolierten Stundenzahl.
- Beim Tageswechsel priorisiert der Selektions-Effekt diese vorgemerkte Zieluhrzeit ausdrücklich für den neu gewählten Tag.
- Die Vormerkung wird erst gelöscht, wenn der gewünschte Slot tatsächlich selektiert ist. Dadurch bleibt 23:00 beim Weiterklicken korrekt auf **00:00 des Folgetags** und kann nicht mehr vom allgemeinen Nicht-heute-Fallback **12:00 Uhr** übersteuert werden.
- Dieselbe Queue-Logik wird außerdem beim sprungweisen Tageswechsel und beim Öffnen eines anderen Tages aus der 7-Tage-Liste genutzt.

### 2) 24-h-Wetterprofil neu geordnet
- In `src/ForecastCockpit.tsx` wurden die Layoutkoordinaten des Profils neu gestaffelt.
- Die **Wolkenbänder direkt unter die Wetter-Piktogramme** verlegt, sodass die visuelle Reihenfolge jetzt lautet: Wetterkopf → Wolkenstruktur → Temperatur → Thermik → Niederschlag → Wind → Luftdruck → Hazards.
- Der obere Hintergrundbereich des Wetterkopfs wurde entsprechend vergrößert, damit Piktogramme und Wolkenbänder wieder als zusammenhängender Kopfbereich erscheinen.
- Die Wetterpiktogramme wurden leicht nach oben verdichtet, damit zwischen Symbolreihe und Wolkenband ausreichend Luft bleibt.

### 3) Dünnere Temperaturkurven
- In `src/styles-src/30-modern.css` sowie dem synchronisierten `src/styles.css` wurden für das 24-h-Wetterprofil die Strichstärken reduziert:
  - Temperaturkurve: `3.35 → 2.75`
  - gefühlte Temperatur: neue explizite Profil-Override-Stärke `1.9`
- Ziel ist eine ruhigere Darstellung bei unverändert guter Ablesbarkeit.

## Regressionen
Neu ergänzt:
- `scripts/test-weather-profile-stepper-layout-097633.mjs`

Aktualisiert:
- `scripts/test-mid-09150-shortterm-hourly-thunder-changelog.mjs` berücksichtigt die neue Queue-Logik für den tagesübergreifenden Stundenwechsel.

## Worker
Keine fachliche Worker-Änderung. Durch die Release-Synchronisierung wird das gekoppelte `MID-worker.zip` erneut erzeugt, **ein manueller Worker-Upload ist für v0.9.76.33 jedoch nicht erforderlich**.
