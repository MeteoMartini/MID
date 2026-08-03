# MID v0.9.0.2 – Synoptik: Winddrehung, Balkenlegende und Isobarenkontrast

## Ausgangsbasis

- Verbindlicher Branch: `mid-stable`
- Verifizierte Ausgangsversion: `0.9.0.1`
- `package.json` und `MID_BASELINE.json` vor der Änderung geprüft

## Änderungen

### Wind beim Frontdurchgang

Die Vorher–Während–Nachher-Darstellung berücksichtigt neben Wind- und Böengeschwindigkeit jetzt ausdrücklich:

- Windrichtung je Phase mit Richtungspfeil, Gradwert und Himmelsrichtung
- kleinste zirkuläre Richtungsänderung über 0°/360°
- rechtsdrehende und rückdrehende Änderung
- Einstufung in gering, beachtlich und markant
- Einbindung in Wetterwechsel-Kurztext, allgemeine Auswirkungen, persönliche Auswirkungen und Analogsignatur

### Balken

Die zuvor unbeschrifteten Balken sind unmittelbar erklärt:

- Grau: Böengeschwindigkeit in kt
- Blau: Regenwahrscheinlichkeit in Prozent

Jeder Balken besitzt nun Bezeichnung und Zahlenwert; die Bedeutung ist zusätzlich als barrierearmes `aria-label` hinterlegt.

### Isobaren

Die Isobaren werden auf der hellen Kartengrundlage doppelt gezeichnet:

- 5,4 px weiße Freistellung
- 2,35 px dunkelblaue Hauptlinie
- nahezu volle Deckkraft
- Drucklabels mit `hPa`, dunklem Hintergrund und weißem Rand
- angepasster Legendenschlüssel

## Regression

- Neuer Test: `scripts/test-synoptic-wind-isobars-09002.mjs`
- 252/252 automatisch erkannte Regressionstests bestanden
- Worker-Syntaxprüfung bestanden
- Versions- und Baselineprüfung bestanden

## Worker

Keine funktionale Workeränderung. `worker.js` wurde ausschließlich auf `0.9.0.2` versionssynchronisiert.
