# MID v0.9.85.4

Stand: 15. September 2026

## Extern

- Der zuletzt bereits installierte MID-Funktionsstand wird nun konsistent als **v0.9.85.4** geführt.
- Wetterfunktionen, Datenquellen und Darstellung werden durch diesen Release-Schritt nicht fachlich verändert.
- Die sichtbare Versionsanzeige und die Update-Erkennung sollen nach erfolgreicher Veröffentlichung denselben Stand melden.

## Intern

- `package.json` ist die kanonische Versionsquelle für **0.9.85.4**.
- Der bestehende `sync-version`-Schritt synchronisiert daraus beim Build App-, Baseline-, Service-Worker-, Worker- und iOS-Metadaten.
- Veröffentlichung erfolgt erstmals über den source-basierten ChatGPT/Codex-PR-Pfad; das Release-ZIP wird nach erfolgreichem Gate serverseitig erzeugt.
- Der zugrunde liegende App-Code entspricht dem zuletzt installierten Archiv vom 15. September 2026; dessen frühere Kennzeichnung `0.9.85.0` war nicht auf den vorgesehenen Releasewert fortgeführt worden.
