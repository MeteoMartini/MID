# MID v0.9.84.1 · neues Bedienkonzept

## Umsetzung

- Das bisherige Beta-Design ist im Modus `bottom-tabs` auf fünf eindeutige Arbeitsbereiche ausgerichtet: **Heute**, **Vorhersage**, **Karte**, **Planen** und **Mehr**.
- Auf Smartphone-Hochformat bleibt die kompakte Tab-Leiste erhalten; im Querformat wird sie dichter gesetzt.
- Auf Desktop und breiten Tablets wird dieselbe Navigation als feste vertikale Seitenleiste dargestellt.
- Nicht ausgewählte Module werden im neuen Konzept nicht zusätzlich untereinander gerendert. Das verhindert lange Scroll-Strecken und macht die Arbeitsfläche fokussiert.
- Seltene Expertenfunktionen bleiben unter **Mehr** und werden dort progressiv nach Themen gruppiert.
- Der klassische Navigationsmodus bleibt unverändert als Fallback verfügbar.
- Navigation und letzter Bereich bleiben über die vorhandenen lokalen Persistenzschlüssel wiederherstellbar.

## Technische Leitplanken

- Keine GitHub-Workflow- oder YAML-Änderung.
- Vorhandene Datenquellen, Module, Favoriten, Einstellungen und Deep-Link-Ziele bleiben erhalten.
- Der IntersectionObserver ändert die aktive Auswahl im neuen Modus nicht mehr ungefragt beim Scrollen.
- Der neue Vertrag wird mit `scripts/test-modern-five-workspaces-09841.mjs` geprüft.

## Prüfung / Übergabe

```bash
npm run test:modern-five-workspaces
npm run verify:types
npm run build
npm run test:regressions
npm run release:preflight
npm run release:pack
```

Das zugehörige Übergabedokument enthält die Reihenfolge für ein unmittelbares Fortsetzen nach einer Unterbrechung.
