# MID Design 1.12 · Modellspanne performant und responsiv, ohne meteorologische Semantikänderung

Die folgenden Scope-Angaben beschreiben den Design112-Spezialpatch aus #913. Der gemeinsame Release integriert auch #916 und #917.

**17. November 2026 · Spezial-Handoff an LC/LW · ausschließlich QA DRAFT, NO RELEASE**

## 0 · Kanonische Provenienz und sichere Integration

`MeteoMartini/MID`, verifiziert `main=mid-stable=9fe4dfbcdfd5a1f8fec55efa868e22110a612953` / `v0.9.85.488`, alle drei Mirrors `package.json`, `MID_BASELINE.json`, `contracts/index.json` synchron, fünf aktive Schutz-Rulesets. Gelesen: `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_PARAMETER_COLOR_CONTRACT.md`. Eine ältere ZIP-/Chat-/Replit-Basis wird nicht verwendet. Gleichzeitig offene Design-#906 (Settings und Ansichten), #909 (Konfidenz-Details), #912 (Info-Portals), LC #902 (Release), Karten #908 und alte Sammel-#868 geprüft. Keine dieser aktiven Spezialdateimengen berührt die beiden hier geänderten Produktdateien. Vor Integration erneut SHA-/Hunk-/CI-/Branch-Drift prüfen; auf LC-Branch nichts überschreiben.

## 1 · Vergleich führender Wetter-Produkte — Übertrag statt Nachbau

- **meteoblue MultiModel:** mehrere Modelle und ihre divergierenden Prognosen getrennt von der wahrscheinlichsten Ortsprognose präsentieren; dokumentiert Modellauflösung und Unsicherheit. Original: https://content.meteoblue.com/en/private-customers/website-help/forecast/multimodel
- **Windy:** zuerst das Kartenprodukt wählen, dann die Zeit auf einer gemeinsamen Timeline steuern. Original: https://www.windy.com/-why-should-you-watch-the-windy-weather-academy-on-youtube/articles/38548
- **Apple Weather (iOS 26):** stündliche Details und Parameter auf Abruf vertiefen statt alle Instrumente dauerhaft in den Hauptbildschirm zu stellen. Original: https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26
- **Meteoblue iOS Designupdate:** schnelle Radar-/Meteogramm-Zugriffe und Layouts mit benutzerdefinierten Schriftgrößen. Original: https://www.meteoblue.com/blog/article/show/40560

MID besitzt bereits getrennte Prognose-/Modellspannen, 7d/14d, Karten und eine gemeinsame Bottom-Bar. Daher **kein neuer zweiter Modus, keine kopierte Navigationsstruktur und keine neue Palette**. Kleinster nachweisbarer Mehrwert: bestehende Modellspanne robuster und günstiger rendern, die erklärende Legende zugänglich halten.

## 2 · P1/P2 bewusst beim Leitchat

- P1: Settings-Unterbäume aus #906 nur nach LC-`App.tsx`-Eigentümer- und Git-Blob-Abgleich integrieren; keine parallele Bearbeitung.
- P2: Produktive 7d/14d-A/B/C-Ansichten, Skybar, Kurzfrist/24h und Desktop-Rail behalten. Legacy-Ansichten nur nach gesichertem Import-, Storage-/Backup-, Settings-Routen- und realem Browsernachweis qualifiziert entfernen.
- Die Änderungsmenge dieses PR betrifft **keine** Settings-/App-/Startup-/Map-/Worker-Datei.

## 3 · P3 realer source-patch

**`src/ForecastRangeGuide.tsx`:** Bisher wurde für jede Tageskarte eine `days.flatMap(adaptiveForecastRanges)`-Referenztabelle erstellt; beim Rendern jedes einzelnen Bands wurden Temperaturpeers oder andere Parameter separat gefiltert und `Math.min`/`Math.max` über neue `map`-Arrays gerechnet. Das erzeugt wiederholte Daten-/Zwischenarray-Scans bei 7d/14d-Mount, Favoriten-, Einheiten-, Ansicht- oder Theme-Re-Renders. Jetzt ermittelt `forecastRangeScaleDomains(days)` die Domain für jedes vorhandene Element in **einem linearen Durchlauf** über validierte Bereiche; kein zusätzlicher Store, globaler Cache, Timer, Listener, Fetch oder Worker.

Fachinvarianten: `adaptiveForecastRanges` bleibt unverändert; nur gültige vollständige Quantilfolgen, mindestens zwei Modelle oder Mitglieder; `Tmin` und `Tmax` verwenden eine gemeinsame `temperature-pair`-Skala; Böen und Niederschlag behalten die **originalen** Minima/Maxima (einschließlich 0 mm, wenn wirklich belegt); Missing Data, NaN, unsupported members, inkonsistente Quantile werden nie als 0 betrachtet; Prozentpositionen und tatsächliche Mediane bleiben unverändert. Domain-Fallback berücksichtigt auch ein ausgewähltes Element, das nicht in der Referenzliste steckt. Die Domain wird auf jedem Render frisch aufgebaut, um bei rezyklierten, mutierten Arrays keine veralteten Wetterwerte aus einem referenziellen Cache anzuzeigen. **Keine behauptete INP-/Heap-Reduktion ohne A/B-Profiler.**

**`src/radarForecastReadability.css`:** Ausschließlich die native `ForecastRangeLegend` bekommt `font-size:.75rem` statt `12px` und die `summary`-Fläche `min-height:44px` plus `padding-block:10px`. Das normale `details/summary`-Keyboard-/Semantikverhalten und der Marker bleiben erhalten. Keine zusätzliche CSS-Datei, kein appweiter !important-Override; alle kanonischen `--param-*`-Farben und Diagrammspuren bleiben identisch.

## 4 · P4 Regression / Browser-Abnahmematrix

**Neu:** `tests/unit/mid-design112-ensemble-domain-reflow.test.ts` prüft sechs konkrete Verträge:
1. Gemeinsame Tmin/Tmax-Skala über sehr große negative und positive Temperatur-Extrema.
2. Genuine `0 mm` und gleichzeitige vollständige Ablehnung nicht belegter Regen-/Böenquantile.
3. Unvollständige Mitglieder oder physikalisch inkonsistente Quantilordnungen werden verworfen.
4. Exakte numerische Gleichheit der neuen Domains zur bisherigen `flatMap → filter → min/max`-Referenz für alle gültigen Parameter.
5. Frische statt gecachter Domains bei Datenwechsel; Original-`P10–P90`, P25–P75 und echte Mediane bleiben im SSR.
6. Native, per `rem` skalierende `details/summary`-Legende mit 44-px-Mindesthöhe und unverändertem Hinweis, dass Modellübereinstimmung **keine Trefferwahrscheinlichkeit** ist.

**Bestehende** Browser-QA `scripts/verify-compact-ensemble-browser-0985143.mjs` besitzt bereits 160 gerenderte Fälle für 7d/14d, 4 Wind-Einheiten, trocken/nass, 320/390/768/1024/1440 CSS px in beiden Themes sowie Prüfung auf Clipping, echte Medianstriche, Einheiten, gemeinsamen Temperaturmaßstab und Missing Data. **Nicht duplizieren.** Auf dem späteren LC-Kandidaten erneut ausführen, um exakt gleiche Balken-/Pixelpositionen gegen Stable zu qualifizieren; zusätzlich 200-%-Text, 360/430/834 px, quer, iOS-/WKWebView und VoiceOver beurteilen. Optional A/B-Profiler am exakt gleichen Modellfixture: Scripts-/React-Renderzeit, DOM/Heap und INP, keine vorzeitigen Leistungszahlen.

Erst nach tatsächlichem CI-Readback am **aktuellen Commit** gezielte Regressionen/Vitest als erfolgreich deklarieren. Für Source/Core/Heavy/Browser/ZiP/Installer/Worker/Pages/Stable gilt unabhängig der volle MID-Pfad; Draft-Skip ist kein grünes Release-Gate. Der bekannte #902 npm-Audit-Advisory darf nicht umgangen werden.

## 5 · Referenznormen

W3C WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

W3C Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

React Rendering/Performance-Guidance: https://react.dev/reference/react/useMemo

## 6 · 18.11.2026: Focus-Visible-Ergänzung für die geteilte Modell-Legende

In der bereits geänderten `src/radarForecastReadability.css` hat die native `details > summary`-Schaltfläche nun explizit `touch-action:manipulation` und einen per Tastatur sichtbaren `:focus-visible`-Indikator: `3px solid var(--primary)` mit `outline-offset:2px`. Die vorhandene `summary`-Pfeilmarkierung, Klick-/Enter-/Leertasten-Nativfunktion und die 44-px-Touchhöhe bleiben unverändert; es entstehen weder zusätzliche Listener noch ein selbstgebauter Disclosure-Controller. Der bereits existierende App-Farbtoken `--primary` wird verwendet, keine lokale Palette eingeführt.

Der Regressionstest wurde auf **acht** Fälle erweitert. Neu wird zusätzlich sichergestellt, dass extreme einzelne gültige Ensemble-Mitglieder bei Änderung der Tagesreihenfolge nicht abgeschnitten oder geglättet werden (unter anderem -95 °C, +114 °C, 600 mm und 310 kt als ausdrücklich synthetische Testextreme). Das ist ein algorithmischer Robustheitsnachweis, **keine Behauptung realistischer Vorhersagewerte** und keine Freigabe dieser synthetischen Fälle für die UI.

W3C Focus Visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
W3C Fokus-Technik G195: https://www.w3.org/WAI/WCAG22/Techniques/general/G195
web.dev INP / Layout-Thrashing: https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing

Zusätzliche **statische Kontrastregression**: Der Test liest direkt die kanonischen `--primary`-, `--bg`-, `--surface`- und `--s2`-Werte aus `src/styles-src/00-foundation.css` und berechnet den WCAG-Kontrast in beiden veröffentlichten Theme-Basissätzen. Die Outline muss gegenüber allen drei Standardflächen mindestens **3:1** erreichen; Fehler schlagen fehl. Rechnerische Tokenprüfung ersetzt weder den Browser-Computed-Style-Test noch die Bewertung weiterer Transparenz-/High-Contrast-Ebenen oder VoiceOver. Diese **realen Light-/Dark-/High-Contrast-/Browser-/Screenreader-Nachweise bleiben offen**. Kein Source-/Release-Gate wird dadurch ersetzt.

**Ergebnis:** isolierte Produkt-/QA-Änderung mit vollständigem Besitzer-Handoff, keine neue Produktentscheidung und keine Stable-Veröffentlichung.
