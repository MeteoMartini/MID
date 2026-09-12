# MID v0.9.84.77 – MRMS/CompositeSource Buildfix

## Anlass

GitHub Actions Installer #1032 (Commit `ada6ef28a6056e5ae0d3bf216ac6cb6d00cd90a2`) installierte die Abhängigkeiten erfolgreich und stoppte im TypeScript-Build mit `TS2322`: `RadarNowcast.source` enthielt den neuen Wert `mrms`, `CompositeSource` dagegen nur tatsächlich renderbare Kartenquellen.

## Korrektur

- `sourceForLocation()` gibt nur `dwd`, `opera` oder `rainviewer` an den Kartenrenderer weiter.
- Bei `analysis.source === 'mrms'` bleibt NOAA/NSSL MRMS die amtliche Standort-/Nowcast-Analyse; für die sichtbare Rasterkarte wird bis zur Implementierung eines dedizierten MRMS-Rasteradapters explizit RainViewer verwendet.
- Die Komposit-Quelleninformation weist MRMS als separate „Standortanalyse“ aus und verschweigt den Karten-Fallback nicht.
- `CompositeSource` wird nicht künstlich um `mrms` erweitert, solange kein entsprechender Raster-Layer gerendert wird.

## Fachlicher Grund

Ein reiner Typ-Erweiterungspatch hätte zwar den Compilerfehler beseitigt, aber `activeSource='mrms'` erzeugt aktuell keinen Karten-Layer. Das hätte in den USA zu einer leeren oder irreführend beschrifteten Radarkarte führen können. Die Trennung zwischen Analysequelle und gerenderter Rasterquelle verhindert dies.

## Worker

Keine fachliche Worker-Änderung. Der bestehende MRMS-Point-/Nowcast-Adapter bleibt unverändert; nur die Releaseversion wird synchronisiert.
