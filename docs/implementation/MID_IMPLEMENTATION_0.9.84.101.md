# MID v0.9.84.101 – Implementierungsbericht

## Ausgangslage

Der Release-Kandidat v0.9.84.100 wurde vom GitHub-Installer **#1055** (Run `34842845051`, Commit `72dc88002f3b446002b408c0ad7ec7b5200bc81f`) korrekt entpackt. Node 22, Lockfile-Prüfung, reproduzierbares `npm ci` und Dependency-Audit liefen erfolgreich. Der Lauf stoppte anschließend ausschließlich im TypeScript-Gate mit:

`src/RadarPanel.tsx(135,10): error TS6133: 'compositeFrontDash' is declared but its value is never read.`

Der letzte erfolgreich veröffentlichte kanonische Stand bleibt bis zum nächsten erfolgreichen Installer **v0.9.84.98** auf `mid-stable` (Commit `e90ac3e0210ddda50249b92787a1ab050bc2e1a2`). v0.9.84.101 setzt den fachlichen Kandidaten v0.9.84.100 fort.

## Korrektur

`compositeFrontDash` war ein übrig gebliebener Helper des inzwischen entfernten parallelen Front-Renderpfads. Die Funktion besaß keine Aufrufer mehr. Sie wurde vollständig entfernt. Weder `noUnusedLocals` noch andere TypeScript-Sicherheitsregeln wurden verändert oder umgangen.

Damit bleiben die fachlichen Änderungen aus v0.9.84.99/v0.9.84.100 unverändert:

- selbst gerenderte, geglättete 500-hPa-Isohypsen in Gold/Amber, gestrichelt und mit gpdm-Beschriftung,
- DWD-WMS-Isobaren als robuster amtlicher Linienpfad,
- qualitätsgefilterte Frontalzonen ohne redundante Doppelrenderer,
- restriktivere thermodynamische Freigabe gefrierender/fester Niederschlagsphasen,
- verständlicheres Regen+Eis-Symbol statt der früheren Spiralform,
- bereinigte Desktop-Wetterpiktogramme ohne vertikale Randartefakte.

## Worker

Keine fachliche Worker-Logik wurde verändert. Versionsfelder werden regulär auf v0.9.84.101 synchronisiert; ein separater manueller Worker-Upload ist nicht erforderlich.
