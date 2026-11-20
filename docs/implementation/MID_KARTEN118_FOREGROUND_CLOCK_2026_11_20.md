# MID-Karten 1.18 – Sichtbarkeitsgebundene Umfeld-Uhr (QA-Draft)
**20.11.2026 · PR #937 · NO READY / NO MERGE / NO RELEASE**

## Verifizierte Basis
- Vor der Mutation `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, Version `0.9.85.497` in `package.json`, `MID_BASELINE.json`, `contracts/index.json`, fünf aktive Rulesets.
- Ausgangs-Draft `#937`, HEAD `7f5106c1b6e786a9b1fffd8018872fc625e506dd`; unveränderter Originalcode für Post-fit-Viewport, DWD-RV-EPSG:3857, OPERA/NoData.
- Parallel-Draft `#889` steuert bereits `mapPaused` für GPU/Ansicht. Das hier ist **kein Ersatz** dafür. Vor Aufnahme beider Änderungen im Leitchat den `CurrentSurroundings.tsx`-Uhr-Effekt selektiv verbinden und die QA wiederholen.

## Problem und begrenzter Fix
Die komprimierte Umfeldkarte führte bisher alle 30 Sekunden `setNow(Date.now())` auch dann aus, wenn die Web/PWA-Seite im Hintergrund war. Das verursacht unnötige React-Reconciliation und kann die mobile Laufzeit belasten, ohne neue Nutzinformation zu liefern. **Keine behauptete, gemessene Energieersparnis.**

- `src/surroundingsVisibleClock.ts`: nur **ein** aktiver 30-s-Timer im sichtbaren Dokument, keinerlei Timer bei `hidden` oder `prerender`; sofortiges Ablesen der echten aktuellen Zeit nach Vordergrund-Rückkehr; idempotente `visibilitychange`-Ereignisse und Cleanup.
- `src/CurrentSurroundings.tsx`: ersetzt ausschließlich den vorher unbedingten 30-s-Timer durch diese pure, testbare Steuerung. Keine neue Wetterlogik, Quellenanfrage, Zeitinterpolation, Datenrevision, Animation oder Persistenz.
- `tests/unit/surroundings-visible-clock.test.ts`: falsche Dauer, versteckter Start, Hintergrundpause, unmittelbarer Resume, doppelte Events, Unmount-Cleanup und tatsächliche React-Effekt-Verdrahtung.

## Fachliche Abgrenzung
`Date.now()` ist ausschließlich die lokale Anzeige-/Auswahl-Uhr. DWD-RV-/OPERA-Originalzeit, UTC-Modellrun, gültiger Termin, Radar-/Satelliten-Originalframes, NoData und Warnungen bleiben unverändert. Ein Timer-Stopp darf einen alten Radarstand niemals als frisch ausgeben: die weiterhin getrennt datierten Quellfelder werden beim Vordergrund entsprechend dem erneuerten Wandzeitwert selektiert. Der WMS-/Composite-Katalog-Refresh bleibt ein unabhängiger Lebenszyklus.

## QA und Übergabe
- Diese Änderung ist gezielt testbar, aber bevor GitHub die neue Commit-SHA geprüft hat, **keine Erfolgsbehauptung**.
- Source-PR-Gate, Review, Core/Heavy, echte Chromium/WebKit-/iOS-Geräteprüfung und ZIP-/Installer-/Worker-/Pages-/Stable-Gates werden nicht ersetzt.
- Performance-Abnahme mit sichtbarer und hintergründiger Karte: Requestzahlen, 30-s-React-Ticks, Frame- und Speichernutzung messen; bei 320/390/430/768/1024/1440px und Light/Dark Originaldaten-Zeitsemantik prüfen.
- Reale Native-iOS-/VoiceOver-Abnahme kann ein Headless-Browser nicht ersetzen.

## UI-/API-Referenzen
- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
- RainViewer historische Frames, keine freie Zukunfts-Nowcasts: https://www.rainviewer.com/api/transition-faq.html
- Ventusky Zeitachse/Quellsemantik: https://www.ventusky.com/help
