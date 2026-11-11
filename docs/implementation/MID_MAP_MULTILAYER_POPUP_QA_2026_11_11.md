# MID-Karten 1.5 – Mehrfach-Layer-Popup (isolierter QA-Draft)

Stand: 11.11.2026. Quellbasis: **main = mid-stable = `7272a54ef9a9bd02fa1b6523f0cbf352b9412963`**, Version **0.9.85.455**. Keine Versionserhöhung, kein Release, kein Deployment. Diese Änderung wird nur als isolierter, SHA-gebundener QA-Kandidat geprüft.

## Ursache im veröffentlichten Code

`src/UnifiedWeatherMap.tsx` registriert bei `winter-berge` zwei `ModelMapProbe`-Komponenten (1-h-Niederschlag und 2-m-Temperatur), bei `sommer-gewitter` ebenfalls zwei (1-h-Niederschlag und 10-m-Böen). Bisher wurden zwei separate `map.on('click')`-Listener, zwei Marker, zwei Mittelpunkt-Buttons und zwei unabhängig fokussierende `AppPortalPopover` angelegt. Das erklärt, warum bei identischem Klick nur eine der überlagerten Wertanzeigen wahrnehmbar sein kann (z. B. Temperatur).

## Korrektur ohne Überschneidung mit parallelem PR #755

`src/mapProbeGroup.ts` koordiniert pro MapLibre-Karte alle **aktiven** bestehenden Modell-Probes. Ein Klick erhält eine gemeinsame Koordinate, einen Abbruchcontroller und voneinander getrennte Einträge; die erste Probe zeichnet das einzige sichtbare Popup und den einzigen Mittelpunkt-Button. Beim Kontextwechsel (Termin, Parameter, Modellauswahl), Schließen oder Kartenverschieben werden offene Abfragen abgebrochen und veraltete asynchrone Rückläufe ignoriert. Bei Entfernen der ersten Probe übernimmt die nächste aktive Probe den sichtbaren Steuerungsanteil. Die bestehende `AppPortalPopover`-Fokus-, Escape-, Outside-Tap-, Safe-Area- und Responsive-Mechanik bleibt erhalten.

Winter: **Niederschlag (mm, vorangegangene 1 h)** und **2-m-Temperatur (°C)**. Sommer: **Niederschlag (mm, vorangegangene 1 h)** und **10-m-Böen (km/h)**. Der tatsächliche Böen-Statistikzeitraum stammt weiterhin nur aus geprüften Indexmetadaten; `intervalHours=0` wird **nicht** als meteorologischer Nullstundenzeitraum umgedeutet. Die Spalten sind reine Anzeige vorhandener, über `seasonalMaskedPair` gemeinsam geprüfter Originaldaten, keine neue Modellfusion. Jeder Eintrag behält Label, Einheit, Quelle und eigenständigen Missing-Status. Reale 0 bleibt 0; NaN/Infinity und fehlende Felder sind NoData. Keine Phase, Schneegrenze, Gefahrenschwelle oder amtliche Warnung wird ergänzt.

Nicht verändert werden `src/UnifiedWeatherMap.tsx`, `src/nativeSeasonalComposite.ts`, `scripts/verify-unified-map-browser-0985167.mjs`, `tests/unit/unified-seasonal-catalog.test.ts` oder `src/unifiedMapCatalog.ts`. Somit keine Dateiüberschneidung mit dem parallelen Flaggen-/Sortierungs-Draft #755 und dem älteren Karten-Saison-Draft #741. Kein Rebase, Reset oder Import alter Chatkopien.

## Abnahme

- Neue `tests/unit/map-multilayer-probe.test.ts` prüfen das gemeinsame Popupmodell mit beiden echten Rasterwertarten (0 mm / negative Temperatur, Sommerböen), gleicher Koordinate, Source pro Eintrag, ungültigen Zahlen, fehlenden Daten, asynchronem Fehler, Terminwechsel, Abbruch und Wechsel des Popup-Besitzers.
- Pflicht für eine Integration: Vitest/Types, Source-PR-Core/Heavy, echtes MapLibre-Browser-QA in 320/390/844/1440 px mit Light/Dark, Erreichbarkeit per Tippen und Tastatur, genau ein Popup/Marker/Mittelpunkt-Button, korrekte Ausgangs- und Wechselwerte, unveränderte Favoriten-/PNG-/SVG-Werte, zwei unabhängige Originalfelder mit korrekter NoData-Schnittmaske, UI/Worker-Semantik und unveränderte JS/CSS-Budgets.
- Andere simultane Karten-Popups (z. B. Radar-Echo oder MapLibre-Konturlabel) sind andere Darstellungswege; sie sind durch diese Änderung **nicht** pauschal als gemeinsame numerische Messung qualifiziert. Eine spätere Zusammenführung darf nur mit dokumentierter Provenienz und Feld-/Zeitsemantik erfolgen.
- **Keine Releasefreigabe:** erst nach geordnetem Lead-Chat-Handoff und dokumentiertem Review/CI über den etablierten MID Source-PR-Gate → kontrollierten SHA-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. Der offene Review-Sicherheitsfall #740 bleibt unangetastet. 
