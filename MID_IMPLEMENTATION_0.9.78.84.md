# MID v0.9.78.84 — Synoptik-Buildfix

- Behebt den GitHub-Actions-TypeScriptfehler in `RadarPanel.tsx`: `smoothFactor` ist kein Bestandteil des von MID verwendeten `PathOptions`-Vertrags.
- Die beiden ungültigen `smoothFactor`-Eigenschaften wurden aus den Polyline-Optionen entfernt.
- Die optische Linienglättung bleibt vollständig erhalten, da MID Isobaren und Isohypsen bereits vor dem Rendern selbst über `cleanContourPath` + `chaikinContour` + `smoothContourPath` glättet.
- Die zuletzt ergänzten Linienfarben, getrennten Isobaren-/Isohypsenfarben, Schnellwahl auf der Karte, Major/Minor-Abstufung und die robustere Sat/Rad-Wiedergabe bleiben unverändert erhalten.
- Keine fachliche Workeränderung; lediglich die Releasekennung wird versionssynchronisiert.
