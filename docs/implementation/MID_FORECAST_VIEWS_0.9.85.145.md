# MID-C12 · v0.9.85.145 · Unterschiedliche Prognoseansichten

Verifizierte Ausgangsbasis: main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91, veröffentlichte .144. Alle 45 Quelldateien des vorangegangenen C12-Release im endgültigen Stable-Tree hashidentisch geprüft; Live version.json zeigt .144. PR #228 und Installer 37015730292 erfolgreich. Der reguläre RUC-Lauf 37015743154 verwendet exakt diese Stable-Basis und baut die Kartenaufbereitung mit dem RELHUM-Fix.

## Autorisierte Nutzerkorrektur

Spurenmenge „<0,1 mm“ wird bisher in der kompakten 14d-Metazeile durch overflow:hidden / text-overflow:ellipsis abgeschnitten. Beide Ansichten müssen Menge und Einheit vollständig zeigen. P25/P75-Kürzel vor sichtbaren Zahlen entfallen; die Werte bleiben reale Quantilgrenzen, keine umgedeuteten Minima/Maxima. Die ausführliche Legende und zugängliche Beschreibung erklären weiterhin die fachliche Spanne. In 7d gehören Tmin und Tmax sichtbar zusammen, einschließlich beider Unsicherheiten und echter Mediane auf gemeinsamer Temperaturskala. 14d bleibt eine eigenständige langfristige Ensemble-/Trendansicht. Funktionale Layoutunterschiede, keine nur dekorativen Überschriften.

## Integration und Prüfung

Replit erhält ausschließlich einen unprivilegierten UI-/Test-Handoff auf der obigen Basis. Provenienz, erlaubte Pfade, exakter Head und read-only Gate werden vor finaler Integration geprüft. Ein neuer Codex-Worktree bewahrt den vorherigen lokalen .144-Stand samt QA; keine vorhandene Arbeit verworfen. Keine Governance-, Modell-/Worker-Fachcode- oder Datenbudgetänderungen durch Replit.

Status: Handoff in Bearbeitung. Gemeinsame Browserprüfung muss vollständige 7d-/14d-Komponenten bei 320/390 px, Tablet/Desktop und Hell/Dunkel umfassen; Spurenmengen, große Werte, Windeinheiten und erhaltene Mediane prüfen. Historische UI-Pins werden nur bei dem ausdrücklich geänderten Darstellungsvertrag angepasst. Veröffentlichung ausschließlich über Source-PR-Gate, kontrollierten Release Bot, Installer/Pages und Stable-Promotion.
