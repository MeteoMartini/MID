# MID 0.9.85.149: Kartenskalen und temporäre Ortswerte

Basis: veröffentlichte .148, main = mid-stable = c578a947e02a6d06638870d5d762c16ecb9be8bf. Isolierter codex-Branch; parallele Navigation und fremde Worktrees bleiben erhalten.

## Skalen

Beide Modi runden nach außen in der eingestellten Einheit mit 1/2/5-Schritten. Alle gültigen Extrema bleiben enthalten. Raster, Legende und SVG/PNG verwenden dieselbe Skala und tatsächliche Wertpositionen. Absolute Farbanker bleiben physikalisch unverändert; relative Farbverläufe nutzen die gerundeten Grenzen. Animationen behalten die feste Skala. Kategorien bleiben diskret, trockene Niederschlagszellen transparent und Datenlücken fehlen ausdrücklich. Rohdaten bleiben unverändert.

## Ortswerte

Ein MapLibre-Marker verankert den bestehenden AppPortalPopover geografisch. Kein kopierter globaler Dismiss-Listener. Ein Klick fragt den dargestellten Rasterpunkt ab; eine 44-px-Mittelpunkttaste erlaubt Tastaturbedienung. Werte verschwinden nach sechs Sekunden, beim Bewegen, Außenklick, Escape, Schließen oder Kontextwechsel. Laufende Abfragen werden abgebrochen; verspätete Antworten erscheinen nicht erneut. Laden ist auf zehn Sekunden begrenzt. Animationen erlauben keine veralteten Ortswerte. Favoriten erhalten konsistente Auswahlzustände, Exporte eine sichtbare Fortschrittsmeldung.

DWD-WMS-Ortswerte werden über whitelisted GetFeatureInfo abgefragt, nicht aus Bildfarben geschätzt. Unterstützt sind Temperatur, Luftdruck und Niederschlag mit kanonischen Property-Namen und Einheiten. Metadaten müssen Queryable bestätigen. Termin, Referenzlauf, Höhe, Koordinaten und Einheit werden server- und clientseitig geprüft. Anbieterhosts sind fest vorgegeben; Antworten sind zeitlich und auf 64 KiB begrenzt. Nicht skalare Wind-, Symbol- und Wahrscheinlichkeitsprodukte liefern keine erfundenen Ortswerte. Tatsächliche DWD-Antworten wurden für EU/Global-T2M, T850, QFF/PMSL und Niederschlag geprüft, einschließlich echter Nullwerte.

## Validierung und Veröffentlichung

Bestehende 899 Pflichtregressionen bleiben erhalten und erfassen zusätzlich gerundete Grenzen, vier Windeinheiten, Exportgleichheit, sichere Punktantworten und Metadaten. Die echte Browserprüfung umfasst fünf Bildschirmbreiten und beide Themes, native/Total/Observed/WMS-Karten, Keyboard, Außenklick, Escape, Timer, verspätete Antworten und fehlende Werte. Lazy-Karten-CSS nutzt vorhandene Theme-Tokens; globale CSS-Datei und Budgetgrenzen bleiben unverändert. Keine neuen Produktionsabhängigkeiten oder Änderungen an CI-/Schutzregeln.

Lokale Abschlussprüfung: npm run verify (899/899), vollständige Karten-/WMS-Browserprüfung und npm run audit:dependencies erfolgreich.

Veröffentlichung ausschließlich über Source-PR Gate, externen MID Release Bot und Installer mit Worker-Verifikation, Pages-Deployment und Stable-Promotion. Kein manuelles ZIP oder Stable-Push.
