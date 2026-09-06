# MID v0.9.78.82 – Konsolidierung Satellit + Skybar

Basis ist der vom Nutzer hochgeladene Stand `MID-professional-replacement(20260906-133429).zip` mit v0.9.78.81. Dieser Stand enthält bereits die gepufferte Satelliten-/Kompositwiedergabe, quellenwahre Satellitenzeitpunkte und die 14-Tage-Layoutänderungen bis v0.9.78.80. Diese Änderungen bleiben unverändert erhalten.

## Zusätzlich integrierte Änderungen aus diesem Chat

- Open-Meteo-`sunshine_duration` wird als vorausgehende Stunden-/15-Minuten-Akkumulation behandelt und wie Niederschlag vom Rohwert am Intervallende auf den sichtbaren Vorwärtsslot gelegt.
- Der Kurzfristpfad verwendet stündliche Sonnenscheindauer vom Akkumulations-/Intervallendpunkt statt vom Slotbeginn.
- Ohne bekannten Folgeslot wird keine veraltete Sonnenscheindauer in einen unbekannten Vorwärtsslot übernommen.
- Die 3-h-Tagesdetailansicht summiert die drei stündlichen Sonnenscheindauern vollständig.
- Verdichtete Wolkenfelder (Gesamt/H/M/L) werden als Intervallmittel behandelt, damit sie nicht als Maximum gegen eine aufsummierte Sonnenscheindauer stehen.
- Gesamt- und Schichtbewölkung bleiben getrennte Modellfelder; es wird keine algebraische 100-%-Beziehung erfunden.
- Der Skybar-Hinweis erläutert, dass WMO-Sonnenscheindauer nicht schlicht `100 % - Gesamtbewölkung` ist; hohe/dünne Bewölkung und direkter Sonnenschein können koexistieren.
- Die bestehende exklusive Skybar-Farbsemantik (Gelb oder Grau, kein Mix) bleibt bestehen.

## Zusammenführung

Die beiden unterschiedlichen v0.9.78.81-Arbeitszweige wurden nicht gegenseitig überschrieben. Insbesondere bleiben `MapLibreCore.tsx`, `RadarPanel.tsx`, die Playback-CSS und `test-composite-buffered-playback-097881.mjs` aus dem hochgeladenen Stand erhalten. Ergänzt wurde `test-skybar-sunshine-time-alignment-097881.mjs`; beide Regressionen sind in der Baseline verpflichtend.

## Worker

Keine fachliche Workeränderung gegenüber dem hochgeladenen v0.9.78.81-Stand; lediglich Versionssynchronisierung auf v0.9.78.82.
