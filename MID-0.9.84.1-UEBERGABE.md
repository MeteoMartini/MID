# MID v0.9.84.1 · Übergabe

## Ausgangspunkt

Diese Version basiert auf `MID-professional-replacement(20260908-213010).zip`, Version `0.9.84.0`.

## Erledigt

1. Neues Beta-Design vollständig auf fünf Hauptbereiche ausgerichtet: **Heute**, **Vorhersage**, **Karte**, **Planen**, **Mehr**.
2. Desktop-Layout mit fester vertikaler Navigation ergänzt.
3. Smartphone-Hochformat und Querformat über bestehende responsive Regeln zusammengeführt.
4. Nur der aktuell gewählte Arbeitsbereich rendert seine großen Module; Detailfunktionen bleiben über Mehr bzw. die vorhandenen Module erreichbar.
5. Expertenbereiche progressiv gruppiert; klassischer Modus bleibt als Fallback bestehen.
6. Letzte Auswahl und vorhandene Deep-Links bleiben kompatibel.
7. Keine unnötigen YAML- oder GitHub-Workflow-Wechsel vorgenommen.

## Sofortiges Fortsetzen

Im Projektordner ausführen:

```bash
npm install
npm run test:modern-five-workspaces
npm run verify:types
npm run build
npm run test:regressions
npm run release:preflight
npm run release:pack
```

Wenn Credits oder Laufzeit in einer Sitzung enden, kann die Arbeit mit diesem Dokument und derselben ZIP-Datei unmittelbar fortgesetzt werden. Zuerst `npm run test:modern-five-workspaces`, danach die vier Prüfkommandos ausführen; anschließend nur noch die erzeugte Release-ZIP ausliefern.

## Bekannte Produktentscheidung

Die neue Navigation blendet im Beta-Modus nicht aktive Großmodule aus. Dadurch bleibt der Einstieg ruhig und touchfreundlich; die vollständige fachliche Tiefe ist weiterhin über **Mehr**, Einstellungen und die klassische Ansicht verfügbar.
