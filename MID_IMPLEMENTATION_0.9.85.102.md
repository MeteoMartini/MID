# MID 0.9.85.102 · Bottom-Bar-/Forecast-Horizon-Stabilisierung

## Anlass
Beim Wechsel aus einem anderen Hauptbereich auf „Heute“ konnte das gemeinsame Forecast-Cockpit neu gemountet werden, nachdem das bisherige imperative Horizon-Ereignis bereits gesendet worden war. Das Ereignis ging dann verloren. Das Cockpit stellte anschließend seinen zuletzt gespeicherten Horizont wieder her und konnte dadurch unmittelbar „7 Tage“ an die Hauptnavigation zurückmelden. Sichtbar sprang „Heute“ dadurch auf „Vorhersage“.

## Umsetzung
- Der aktuell gewünschte Forecast-Horizont wird aus dem übergeordneten Navigationszustand direkt an das Forecast-Cockpit übergeben.
- Beim Mount hat ein expliziter Navigationswunsch Vorrang vor dem gespeicherten Cockpit-Horizont.
- Auch ein bereits gemountetes Cockpit synchronisiert nachfolgende explizite Navigationswechsel deterministisch.
- Der gespeicherte Horizon bleibt als Fallback für einen normalen Wiedereinstieg erhalten.
- Es werden keine Verzögerungs-/Timeout-Hacks eingeführt; History, Deep Links und bestehende Horizon-Ereignisse bleiben kompatibel.
- Die Bottom-Bar-Geometrie bleibt bei fünf gleich breiten Zielen, Safe-Area-Abständen und den bestehenden Touch-Mindesthöhen unverändert.

## Prüfung
- Neue Regression: `scripts/test-bottom-bar-forecast-horizon-race-0985102.mjs`.
- Geschützt sind insbesondere „Vorhersage → Aktuell → Heute“, „Heute → Karten → Vorhersage“, Mount/Remount sowie die responsive Touch-Geometrie.
- Der Source-PR-Gate führt Produktionsbuild und sämtliche automatisch erkannten Regressionstests aus.
