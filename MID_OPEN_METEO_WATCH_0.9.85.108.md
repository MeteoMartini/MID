# MID v0.9.85.108 · Open-Meteo MID Watch · 27.09.2026

## Verifizierte Änderung

Die aktuelle Open-Meteo Weather Forecast API stellt im Daily-Bereich zusätzlich `moonrise`, `moonset` und `moon_phase` bereit. MID fordert diese drei Felder ab v0.9.85.108 im kanonischen Kernforecast und im Worker-Core-Forecast an.

`moon_phase` wird als normierter Zykluswert 0…1 behandelt: 0/1 Neumond, 0,25 erstes Viertel, 0,5 Vollmond, 0,75 letztes Viertel.

## MID-Integration

- Open-Meteo `moonrise` und `moonset` werden für den lokalen Kalendertag der Wetterdaten primär verwendet.
- Open-Meteo `moon_phase` wird als primärer normalisierter Phasenwert übernommen.
- Die bestehende lokale Astronomieberechnung bleibt als Fallback für fehlende/null Werte, Offline-/Fallback-Datenquellen und Sonderfälle erhalten.
- Lokale Berechnung von Mondbeleuchtung, Mondalter, Phasenbezeichnung/-symbol, Zeit bis Neu-/Vollmond und standortbezogenen Finsternissen bleibt bestehen.
- Der Worker-Core-Cache wurde auf Schema `v4` angehoben, damit ältere gecachte Kernforecasts ohne Mondfelder nicht als vollständiger neuer Payload weitergereicht werden.

## Modell-/API-Audit

Die heutige Prüfung ergab keinen belastbaren Breaking Change für die von MID genutzten DMI-HARMONIE-, CMC/GEM- oder übrigen bereits validierten Kernmodellkennungen. Es wird deshalb keine Modellkennung auf Verdacht geändert.

## Regression

`scripts/test-open-meteo-lunar-daily-0985108.mjs` schützt die neuen Request-Felder, Worker-Durchreichung, lokale Datumszuordnung, 0…1-Validierung und die Fallback-Kette.
