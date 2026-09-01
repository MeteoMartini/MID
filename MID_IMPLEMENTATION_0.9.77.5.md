# MID Implementation v0.9.77.5

## Hotfix für GitHub Actions Run #811

Der Upload des unversionierten `MID-professional-replacement.zip` wurde korrekt erkannt, sicher entpackt und per `npm ci` reproduzierbar installiert. Run #811 scheiterte erst im TypeScript-Gate des Produktionsbuilds.

## Behobene Buildfehler

1. **WindUnit-Vertrag vereinheitlicht**
   - `SubseasonalTrendPanel` verwendet wieder den kanonischen MID-Typ aus `weather.ts`.
   - Der interne Typwert `kt` wurde entfernt; MID verwendet intern `kn` und zeigt weiterhin `kt` an.
   - Damit ist die Übergabe aus `LongRangePanel.tsx` wieder typsicher.

2. **Lucide-Exports korrigiert**
   - nicht vorhandenes `Rain` ersetzt durch das im Projekt bereits verwendete `CloudRain`.
   - Tmin nutzt `Snowflake`.
   - Windböen nutzen `WindIcon`, sodass kein ungesicherter zusätzlicher Lucide-Export nötig ist.

3. **Lucide-Komponententyp korrigiert**
   - Metrik-Icons werden mit `typeof ThermometerSun` typisiert und damit mit den tatsächlichen Lucide-ForwardRef-Komponenten kompatibel gehalten.

4. **TypeScript-Nullability korrigiert**
   - `meanValue` wird vor der Klimadifferenz explizit auf `number` eingegrenzt.

## Fachfunktion bleibt erhalten

Keine Rücknahme von v0.9.77.4:
- EC46-Klimamittel über Wochen-Zeitachse,
- Tmin/Tmax,
- Wind + Windböen soweit verfügbar,
- Klick-/Tipp-Tooltip,
- appweiter Parameter-Farbvertrag,
- Wochenblöcke Tag 15–46.

## Worker

Keine fachliche Worker-Änderung. Nur die gemeinsame Release-Version wird durch den kanonischen Versionssync aktualisiert.
