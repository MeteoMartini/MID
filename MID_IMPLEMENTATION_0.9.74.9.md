# MID v0.9.74.9 – iOS Light-Splash PNG-Integritätshotfix

## Ausgangslage

Der verbindliche Light-/Dark-Logo-Stand aus v0.9.74.8 war fachlich integriert. Die drei hellen nativen iOS-Splashdateien im `Splash.imageset` waren jedoch auf Dateiebene abgeschnitten: der PNG-Datenstrom endete innerhalb eines IDAT-Chunks und besaß keinen vollständigen IEND-Abschluss. Die bisherige Branding-Regression las nur die IHDR-Abmessungen und konnte diese Beschädigung deshalb nicht erkennen.

## Umsetzung

- Die drei hellen `2732 × 2732`-Splashdateien wurden deterministisch aus dem bereitgestellten finalen Light-Splash `1290 × 2796` neu erzeugt.
- Die Geometrie entspricht dem bestehenden Dark-Splash-Vertrag: Cover-Skalierung auf 2732 px Breite mit zentriertem vertikalem Zuschnitt, ohne Verzerrung der Marke.
- Dark-Splash, App-Icons, Web-/PWA-Branding und React/Vite-Fachkern bleiben unverändert.
- Neuer Regressionstest `scripts/test-logo-png-integrity-09749.mjs`: prüft PNG-Signatur, vollständige Chunkgrenzen, CRC jedes Chunks, terminalen IEND ohne Nachlaufdaten sowie erfolgreiche IDAT-Dekompression für sämtliche nativen Light-/Dark-Splash- und AppIcon-Dateien.
- Alle sechs Splashdateien werden zusätzlich als verpflichtende Baseline-Dateien geschützt.

## Releasewirkung

Reiner Asset-/Regression-Hotfix. Keine fachliche Workeränderung, keine neue Apple-Capability, kein iOS-Fork und keine Änderung des nächsten macOS-/Xcode-Qualitätsgates.
