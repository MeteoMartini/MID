# MID-C12 · v0.9.85.145 · Unterschiedliche Prognoseansichten

Verifizierte Ausgangsbasis: main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91, veröffentlichte .144. Alle 45 Quelldateien des vorangegangenen C12-Release im endgültigen Stable-Tree hashidentisch geprüft; Live version.json zeigt .144. PR #228 und Installer 37015730292 erfolgreich. Der reguläre RUC-Lauf 37015743154 verwendete exakt diese Stable-Basis und hat erfolgreich publiziert. Das Live-Manifest enthält acht native Kartentypen / 48 Raster; Kartenfelder und Summen aus demselben 12-UTC-Lauf. Je ein Live-T+24-Feld aller acht Typen mit HTTP, Länge, SHA256, entpackter Länge, Lauf/Termin und Einheit verifiziert. Profil 870996282 Bytes, unveränderter Deckel 900000000 Bytes.

## Autorisierte Nutzerkorrektur

Spurenmenge „<0,1 mm“ wird bisher in der kompakten 14d-Metazeile durch overflow:hidden / text-overflow:ellipsis abgeschnitten. Beide Ansichten müssen Menge und Einheit vollständig zeigen. P25/P75-Kürzel vor sichtbaren Zahlen entfallen; die Werte bleiben reale Quantilgrenzen, keine umgedeuteten Minima/Maxima. Die ausführliche Legende und zugängliche Beschreibung erklären weiterhin die fachliche Spanne. In 7d gehören Tmin und Tmax sichtbar zusammen, einschließlich beider Unsicherheiten und echter Mediane auf gemeinsamer Temperaturskala. 14d bleibt eine eigenständige langfristige Ensemble-/Trendansicht. Funktionale Layoutunterschiede, keine nur dekorativen Überschriften.

## Integration und Prüfung

Replit erhält ausschließlich einen unprivilegierten UI-/Test-Handoff auf der obigen Basis. Provenienz, erlaubte Pfade, exakter Head und read-only Gate werden vor finaler Integration geprüft. Ein neuer Codex-Worktree bewahrt den vorherigen lokalen .144-Stand samt QA; keine vorhandene Arbeit verworfen. Keine Governance-, Modell-/Worker-Fachcode- oder Datenbudgetänderungen durch Replit.

Status: Handoff in Bearbeitung. Gemeinsame Browserprüfung muss vollständige 7d-/14d-Komponenten bei 320/390 px, Tablet/Desktop und Hell/Dunkel umfassen; Spurenmengen, große Werte, Windeinheiten und erhaltene Mediane prüfen. Historische UI-Pins werden nur bei dem ausdrücklich geänderten Darstellungsvertrag angepasst. Veröffentlichung ausschließlich über Source-PR-Gate, kontrollierten Release Bot, Installer/Pages und Stable-Promotion.

## Fortsetzungsbeleg

Draft-PR #229: https://github.com/MeteoMartini/MID/pull/229. Vertrauenswürdiger Integrationsbranch codex/v0.9.85.145-distinct-forecast-layouts; Remote-Checkpoint 4eb1209a9df7c08a03edf103fce5279b049d9b98, Tree 328767b4f73a6e3d0814e987925053e274390c4e. 20 vorbereitete Versions-/Dokumentationsdateien vollständig gegen den lokalen Baum hashverifiziert. Kein dist-/ZIP-Transport.

Replit MID 7034331d-b3d4-4f2d-bd98-52435f4f7cb1, aktueller Auftrag gegen Basis 3951e8c; bei Statusnachfragen noch busy, Fragen wurden ausdrücklich nicht zugestellt. Kein .145-UI-Handoff bislang. Alle Replit-Refs über /git/matching-refs/heads/replit/ prüfen; erste Branch-Listen-Seite ist wegen vieler historischer Agent-Branches unvollständig. Letzter geprüfter Handoff bleibt .144@6f104f93d351f8d7990db60bb0b057aab7022f53. Keine parallele zweite UI-Implementierung beginnen.

Neue Browserprüfung scripts/verify-forecast-views-browser-0985145.mjs liegt vorbereitet vor: 96 vollständige 7d/14d-Fälle, sechs Breiten einschließlich 402 px, Hell/Dunkel und kn/kmh/ms/mph. Tatsächliche Textbreite und Beschneidung durch Vorfahren prüfen; keine bloße CSS-Tokenprüfung. Der alte Stand schlägt erwartungsgemäß an sichtbaren P25/P75-Präfixen fehl. Nach Handoff ggf. dessen zusätzliche CSS-Imports in die Testoberfläche aufnehmen. Beide Temperaturspannen/Mediane und sichtbare Differenzierung zusätzlich anhand voller Screenshots prüfen.

Nächste Schritte: aktuelle main-/Stable-Basis und Handoff-Provenienz/Diff/Gate prüfen; erlaubte UI-Dateien übernehmen, veraltete Layout-Assertions an den ausdrücklichen neuen Vertrag anpassen, vollständigen Build/Typecheck, fokussierte und alle Regressionen sowie volle Browser-QA ausführen. Dokumentation und Remote-Tree aktualisieren, Draft erst danach freigeben, reguläre Releasekette bis Live .145 und Stable beobachten. Bestehender optionaler Vitest-CI-Pilot bricht schon vor dem Teststart mit npm edgesOut ab (auch in .143/.144); lokale fünf Unit-Tests samt Coverage bestanden. Keine Release-/Testsicherung abschwächen.
