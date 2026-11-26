# MID Atmospheric Precision – appweiter Design-Evolution-Blueprint · 23.11.2026

**Status: INTEGRATION CANDIDATE / PRODUCT DIRECTION FOR REVIEW, NOT IMPLEMENTED; NO RELEASE.**
**Parent / Leit-Chat-Intake:** [#1003](https://github.com/MeteoMartini/MID/issues/1003); historischer appweiter Design-Owner [#523](https://github.com/MeteoMartini/MID/issues/523). Reine Design-/Implementierungsdokumentation auf dem bereits vorhandenen isolierten Design-CSS-QA-Branch; **keine** Runtime-Styles, Komponenten, Versionen, Tools/Build-Gates oder amtlichen Warnungen geändert.

## Verifizierter GitHub-Ausgangspunkt (23.11., 20:33 MEZ)
- `mid-stable` veröffentlicht v0.9.85.513, SHA `331fffff081303e1c597badddfa4ae41c4b4e0f0` (Package/Baseline).
- `main` vorbereitet v0.9.85.514, SHA `f6b4856ed1e2de8d659aa15383a2e06aac526bc0`; **2 Commits ahead**, noch nicht Stable.
- Offener P0-Recovery-PR [#1004](https://github.com/MeteoMartini/MID/pull/1004) benennt einen fehlgeschlagenen `.514`-Installer; kein `.515`-Release unterstellen, keine Produktionschanges/Release-Train-Umgehung.
- Gelesene Verträge: `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_PARAMETER_COLOR_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md`.
- Bereits umgesetzte Ansichtseigentümer: `src/App.tsx`, `src/SelectedPlaceBar.tsx`, `src/ForecastCockpit.tsx`, `src/SevenDayDesignModes.tsx`, `src/FourteenDayDevelopment.tsx`, `src/HorizonSignalChart.tsx`, `src/ForecastConfidence.tsx`, `src/UnifiedWeatherMap.tsx`, `src/WeatherMapsPanel.tsx`, `src/AppPortalPopover.tsx`, `src/parameterLineStyle.ts`, `src/styles-src/00-foundation.css` und `src/styles-src/presentation-order.json`.
- `DESIGN.md` im Root des freigegebenen Stable **nicht auffindbar**; diese Konzeptdatei ist weder zweite Token-Quelle noch stilles neues Produktgesetz. Ein Root-`DESIGN.md` erst nach verifizierter Systementscheidung, synchronisiert mit bestehenden Tokens und Verträgen. **Original-PNG-Pixelreferenzen liegen nicht vollständig SHA-geprüft im Repository**; keine behauptete Bildtreue.

## 1. Unveränderte Nutzerentscheidungen aus den historischen MID-Design-WE-Unterlagen
Die ursprünglichen Bild-/Kompositionsentscheidungen sind nicht bloß Inspiration:
- Freigegebene Stable-Unterlage: `docs/design/MID_DESIGN_WE_TODAY_CANDIDATE.md` (älterer Entwurf, **nicht** aktuelle Browserabnahme). Ergänzend **historischer, nicht gemergter DRAFT** [#661](https://github.com/MeteoMartini/MID/pull/661) @ `chatgpt/v0.9.85.432-design-we-original-references`: `docs/design/MID_DESIGN_WE_1_1_TO_1_3_DECISIONS_AND_VISUAL_QA_2026-11-05.md`. Dessen Bildasset-Index ist ausdrücklich keine Roh-PNG-/SHA-Ablage.
- **Heute / 24h**: ruhiger Zeitachsen-Fokus B + sichtbar zugängliche **nächste 90 Minuten** A + selektive, **funktionierende** C-Datensteuerung. Pflichtfolge im DOM / in der Darstellung: **Wetter/Skybar → Gesamt-/H/M/L-Bewölkung → Temperatur/UTCI/Taupunkt → Niederschlagsmenge und PoP → Wind/Böen → Luftdruck → Hazards**. Wetter- und Wolkenzeilen stehen oberhalb der Temperaturkurve, nicht per visuellem CSS-Trick nachgeordnet. 90-min-Segmente mit 15-min-Verfügbarkeit bleiben einklappbar, keine erfundene zeitliche Auflösung.
- **7 Tage**: existierende durchgehende Wetter-/Skybar-Zeitreihe oben bewahren; dann echte Ansichten **Übersicht** (7 kompakte horizontale Tageszeilen und täglicher Original-Drilldown), **Diagramme** (genau 5 vertikale, synchronisierte Fachachsen: Temperatur/ENS, Tagesmenge, Tages-PoP, Wind/Böen, Sonnenscheindauer), **Tabelle** (echte Tages-/Periodenmatrix mit morgendlichen/mittäglichen/abendlichen/nächtlichen Zeilen **nur soweit Daten verfügbar**, innerer horizontaler Scroll auf Mobilgeräten). Menge und PoP niemals gemeinsam künstlich skalieren.
- **14 Tage**: **eine** prominent zuerst sichtbare Hauptgrafik mit realen Temperatur-/Ensemble-Spannen, darunter kompakte Wochenstreifen, Wetterphasen nachgeordnet; keine 14 übergroßen Karten, keine zweite Ensemble-Hauptgrafik, kein rein kosmetisches Reordering. Der stabile .513-Code ist hierzu bereits teilweise weiterentwickelt – **Ist-Zustand im Browser verifizieren, nicht Blind-Nachbau**. P10/P90/P25/P75 niemals austauschen oder erfinden.
- Keine dauerhaft sichtbaren Konzeptbuchstaben „A/B/C“. Bestehende benannte Modi, Speicher-/Persistenzschlüssel, Deep-Links, Detailöffnungen und Nutzerpräferenzen bleiben erhalten.

## 2. Die drei ursprünglichen Designrichtungen bilden EINE Anwendung
**A · Atmospheric Precision (visuelle Identität / standardmäßig)**: ruhiger Instrumentenraum, klarer Ortskontext, Wetter als zeitliche Entwicklung, visuelle Gewichtung nach Relevanz. Kein Lifestyle-Fotoskin, keine generischen Kachelberge, keine künstlichen Daten-Qualitätswerte.
**B · Scientific Instrument Deck (Detailstufe, kein zweites Theme)**: präzise typografische Datenebenen; Achsen, Grad-/mm-/kn-/hPa-/UTC-Semantik, Modelle, Ensemble-Unsicherheit, Linien-/Symbolsemantik. Bestehende Fachdiagramme bleiben kanonisch.
**C · Immersive Weather Atlas (Kartenarbeitsplatz, kein zweites Theme)**: Panorama der echten Raster/Modelle, Kartenfläche zuerst, Werkzeuge nur kontextuell sichtbar, eine bedienbare Zeitführung mit klarer Quellen-/Gültigkeitsanzeige. Keine zusätzliche WebGL-Engine.

**Wiedererkennbares Signaturmotiv:** ein durchgängiger, **segmentierter Wetter-Zeitfaden** als Orientierung zwischen Beobachtung (realer Zeitstempel), Nowcast (wirklich belegte Kurzfristfelder), Modellprognose (Modelllauf und ValidTime) und Ensemble (Spanne und Abdeckung). Er verwendet bereits vorhandene Zeitachsen/Statuskomponenten, **keine** zweite globale Timeline oder neue Fetch-Pipeline. Segmentwechsel sind **explizit** und fehlen sauber, wenn kein Beleg vorhanden ist. Kein visuell nahtloses Farbband, das unbekannte Werte als beobachtet vortäuscht.

## 3. Visuelle Grammatik – Kandidaten, keine produktive Palette
**Semantische Farben über den bereits kanonischen Runtime-Owner** `src/styles-src/00-foundation.css`. Kein neues Theme-Overlay und keine globale Design-Datei.

| Rolle / vorhandene CSS-Variable | Light-Kandidat | Night-Kandidat |
|---|---|---|
| `--bg` Hintergrund | `#F3F7FB` | `#081729` |
| `--surface` Kartenfläche | `#FFFFFF` | `#10253B` |
| `--s2` ruhige Unterfläche | `#E8F0F6` | `#183249` |
| `--text` Haupttext | `#10283E` | `#F0F7FD` |
| `--muted` Metadaten | `#526678` | `#BCD0DE` |
| `--primary` interaktiver Akzent | `#0B528B` (weiße Aktionsschrift) | `#59BEE8` (Schrift `#062536`) |
| `--accent` zurückhaltende aktive Markierung | `#007FA8` | `#59BEE8` |

**Kontrastvorkontrolle des bisherigen Entwurfs:** Light-Haupttext/Hintergrund ca. **13,98:1**, Light-Sekundärtext/Hintergrund **5,53:1**, weiße Aktionsschrift/Light-Primary **8,10:1**. Night-Haupttext/Hintergrund **16,68:1**, Night-Sekundärtext auf `#10253B` **9,79:1**, Night-Primary/Dark-Aktionsschrift **7,51:1**. Dies sind Einzelpaarberechnungen, **keine** WCAG-2.2-AA-Gesamtfreigabe.

**Rahmen strikt nach Funktion:** ursprünglicher dezenter Light-Dekorrahmen `#C8D9E4` auf Weiß nur ca. **1,45:1** und deshalb **kein** alleiniger Kontrollrand. Für aktive Steuerelemente Kandidat `#768899`, der auf `#E8F0F6` ca. **3,17:1** erreicht; Dark `#647F93` auf `#183249` ca. **3,14:1**. Nur in tatsächlich benötigten bestehenden CSS-Regeln einsetzen; nicht blind alle Borders dunkler machen. Fokusring, Fehler- und Warnzustände separat pro Surface und Theme testen.
**High-Contrast `src/midHighContrast.css` ausdrücklich erhalten**, nicht von Night ableiten. **Alle `--param-*`, `--model-series-*`, `--apparent-line`, DWD-Warnstufen, Temperaturwertpaletten und native Wetterkartenskalen behalten ihre vertragliche Bedeutung.**
**Typografie:** bestehende Inter-/Systemschrift, keine weitere Webfont-Downloadlast; Messwerte numerisch gut ausgerichtet (`font-variant-numeric:tabular-nums` nur bei nachgewiesenem Nutzen), kurze datenbezogene Überschriften, stufenweise ruhigere Metadaten. Layout-Rhythmus anhand bestehender MID-Touch-/Spacing-/Radius-Tokens, nicht aus zweitem Tokenpaket. Keine seitenweiten Filter/Blur-/Schatten-Overlays; fotografische/animierte Atmosphären nur dort, wo sie keinen Daten- und Rendernachteil erzeugen.

## 4. Appweiter Soll-Zustand: konkrete Ansichten und Source-Owner

| Ansicht | Oberste Informationspriorität | Konkret zu integrierender Unterschied | Verbindliche vorhandene Owner / Ausschlüsse |
|---|---|---|---|
| **Shell / Navigation** | Ort, Such-/Favoritenkontext, aktueller Abschnitt und getrennte amtliche Warnungen | Ortsname und lokaler Zeitkontext visuell klar vor sekundären Controls; bestehende Bottom-Tabs/Drawer nicht durch zweite Navigation ersetzen; progressive Headerdichte | `App.tsx`, `SelectedPlaceBar.tsx`; behalten: Such-, Favoriten-, Deep-Link-/Scroll-/Persistenzverhalten; Fokusprojekt #1001 separat |
| **Aktuell** | direkt lesbarer Istzustand + reale Wetteraktualität + relevante Änderung | identifizierbare Wetter-Signatur/Typografie in bestehendem `.hero.current-compact`; eine Statuszeile mit tatsächlich belegter Observation-/Nowcast-Quelle/Zeit, ohne doppelte Warn-/Status-Chips | `App.tsx`, bestehende Aktuell-/Skybar-Komponenten; CSS-Owner zuerst an `.current-weather-facts`, `.current-weather-icon`, `.hero.current-compact` auswerten |
| **Heute / 90 min / 24 h** | Skybar vor Wolken vor Fachkurven; nächste 90 min erkennbar | ein vertikaler Wetter-Storyflow mit stabiler Datums-/Stundenachse, echten Fokus-/Touchzuständen, ohne separaten neuen Chart-Renderer | `ForecastCockpit.tsx`, `ShortTermForecast.tsx`, bestehende Stundenplot-Owner; historischer WE-Today-Vertrag |
| **7 Tage** | durchgehende 7d-Skybar, 7 kompakte Zeilen oder 5 Fachdiagramme oder Tabelle | echte Ansichtswahl und Tagesdrilldown direkt am ausgewählten Tag, auf Mobilgeräten kein Body-Horizontalscroll | `SevenDayDesignModes.tsx`, `ForecastCockpit.tsx`, `HorizonSignalChart.tsx`; keine erfundenen Sonnenscheindaten |
| **14 Tage** | echte Ensemble-Temperaturentwicklung als erster visueller Anker | Hauptgrafik vor Wochenstreifen/Phasen, deutliche Unterscheidung Best Match/ENS und Lücken, keine zusätzliche Meta-Karte vor Plot | `FourteenDayDevelopment.tsx`, `ForecastConfidence.tsx`, `HorizonSignalChart.tsx`; #952 und #975 bleiben separate Owner |
| **Karten / Umfeld** | maximale Originalkartenfläche + ausgewählte Quelle/Feld/Gültigkeitszeit | Layer/Feld = **was**, Zeitleiste = **wann**, Quelle/Modelllauf = **woher**. Zeitsteuerung und Legende dauerhaft erreichbar, Details kontextuell, ohne überlagerte Mehrfach-Toolbars | `UnifiedWeatherMap.tsx`, `WeatherMapsPanel.tsx`; #937/#988 CRS-/Karten-QA und GPU-Owner nicht duplizieren |
| **Mehr / Fachmodule** | sinnvolle Gruppen und wiedererkennbare Statussprache | niedrigere visuelle Dichte für seltene Einstellungen, hohe Dichte für tatsächlich wissenschaftliche Fachwerkzeuge. Vorhandene Profile/Preferences und Zustände unverändert | vorhandene Modul-/Settings-/App-Owner; #508 Persistenz getrennt |
| **Widgets / URL-/PNG-/SVG-Exporte / iOS** | gleiche Parameteridentität und fachlich ehrliche Quellen-/Zeitinformation | dieselben bestehenden Token- und Datenrollen bei verkürzter Informationsdichte; kein eigener paralleler Renderer oder iOS-Fachfork | `MID_CROSS_PLATFORM_CONTRACT.md`, `MID_PARAMETER_COLOR_CONTRACT.md`; native WebView/VoiceOver erst gesondert abnehmen |

### Wichtige Statusdarstellung ohne Scheinvertrauen
Nur bereits wirklich belegte Rollen: `Beobachtung`, `Nowcast`, `Modellprognose`, `Ensemble`; Zustände `aktuell`, `verspätet`, `teilweise`, `nicht verfügbar` **nur wenn nach vorhandenen Provider-/Zeit-/Coverage-Verträgen nachweisbar**. Kein pauschaler "99%-Genauigkeit"-Chip, keine Farbumschreibung amtlicher Warnungen, keine Gleichsetzung von Offlinecache und Echtzeitbeobachtung. Detaillierte Datenquelle, Modelllauf, Gültigkeitszeit und Akkumulationsfenster bleiben bei Bedarf auf einem Tap über **bestehende** `AppInfoHint`-/`AppPortalPopover`-Wege zugänglich; kritische Unverfügbarkeit bleibt sichtbar.

## 5. Responsive Layout und Progressive Disclosure (kein zweites Rendering)
**320–430 CSS px:** eine echte Inhaltskolonne, respektierte Safe Areas und Sticky-/Bottom-Navigation; `Aktuell` direkt sichtbar, keine horizontale Dokumentbreite, lange Ortsnamen umbrechend; Heute-Skybar zuerst und 90-min-Zugriff ohne vollständige Kontextverdrängung; Kompakt-7d als **eine Zeile pro Tag** plus erreichbarer Drilldown. Mindestens bestehendes MID-44px-Touchziel.
**768–1024 CSS px:** mehr Luft für nebeneinander sinnvolle Zusammenfassungen, aber Diagrammachsen/7d-Fachgrafiken bleiben bedienbar und logisch **einspaltig**, wenn die historische Entscheidung es verlangt. Tablet hoch/quer und Side-by-Side testen.
**≥1200 CSS px:** Orts-/Status-/Hauptinhaltshierarchie entlang derselben Komponenten; größere Chart-/Kartenarbeitsflächen, keine vergrößerten leeren Karten; 7d-Diagramme bleiben fünf vertikal synchronisierte Plots; Hilfsdetails dürfen danebenstehen, solange sie keinen neuen dauerhaft eingenommenen Karten-/Chartbereich erzwingen.
**A11y:** 200% Text, WCAG-2.2-AA-Ziel, Screenreader-Beschriftungen, Tab-Reihenfolge entsprechend tatsächlichem DOM, `Escape` und Fokus-Rückgabe aus kanonischen Popovern; reduzierte Bewegung ohne informationsverlustige Übergänge. Diese Punkte sind **Prüfkriterien**, keine durch Quell-Lektüre erteilte Abnahme.

### Textuelle Wireframes – reine Hierarchie, keine bereits gerenderte UI
**Phone (Aktuell → Heute):**
```text
[Logo] [Ort/Suche] [Menü]
[ausgewählter Ort • echte lokale Zeit]
[amtliche Warnung, wenn vorhanden – getrennt]
[Aktuell: Wettericon | zentraler Wetterwert]
[Beobachtung/Nowcast: belegte Quelle und Zeit]
[Nächste 90 Minuten: kompakter echter Verlauf]
[Heute: Skybar und Wolken H/M/L]
[Temperatur & UTCI] [Menge & PoP] [Wind & Böen] ...
[vorhandene Bottom-Navigation]
```
**Tablet/Desktop (Karten):**
```text
[vorhandener App-Header: Ort, Suche/Favoriten, Navigation]
[Kartenname | Parameter/Modellquelle | Stand/ValidTime]
[                    Originalkarte                    ][kontextuelle Legende]
[     EINE bestehende zeitliche Kartensteuerung / echte Framezeiten     ]
[fachliche Detail-/Quelleninfo über vorhandenes Popover]
```
Beide Wireframes sind Orientierungsmodelle und werden nur mittels bestehender Modul-Owner umgesetzt, ohne nicht belegte Datenblöcke zu erzwingen.

## 6. CSS- und Runtime-Integrationspfad: vorhandene Regeln ersetzen
**Nicht verhandelbar aus Nutzerentscheidung 23.11.:** keine dritte Theme-Datei, kein `html[data-mid-design='next']`-Nachkleben, keine zusätzlichen globalen `!important`-Overrides, keine zweite `DESIGN.md`-Token-Wahrheit. Bestehende `presentation-order.json` hat 68 eager Quellen; `src/midPresentation.css` ist ein generiertes Artefakt, **nicht** direkter Edit-Owner.
- `P0a`: aus tatsächlichen Stable-/Candidate-Builds `artifacts/build-budget.json`, physischen `dist`-CSS-Dateien und `scripts/audit-css-ownership-0985484.mjs` einen belegten Vorher-/Nachher-Vergleich ziehen. Bereits bereitgestellter, **nicht integrierter** QA-Kandidat auf `chatgpt/v0.9.85.515-design-css-netzero-qa`: CSS-Byte-Gate, Artefakthashes, Kaskadensignal-Deltas, 34 lokale Unit-Falltests; reine JSON-Aussagen sind unzureichend.
- `P0b`: ausgewählte `.hero.current-compact`-Overrides in mehreren **tatsächlichen** Media-/State-Kontexten lokalisieren; im selben Commit aktive kanonische Deklarationen aktualisieren **und** nach Browserparität obsolete spätere Regeln entfernen. Eine zweifache Regel kann für Dark/Touch/Breakpoint legitim sein und ist ohne Computed-Style-Nachweis keine Löschfreigabe.
- `P1a`: Tokens/Shell/erster Aktuell-Slice, gemessener CSS-Netto-Null- oder besser-Zustand. Keine Laufzeitabhängigkeit oder zusätzliche eager JS. Nicht produktives Design nachträglich durch zusätzliche CSS-Cascade "retten".
- `P1b`: Heute exakt WE-Hierarchie, dann 7d/14d-Strukturen mit echten Daten/Quantilen. Kein CSS-Grid-Order-Trick, der Screenreader-DOM-Reihenfolge divergieren lässt.
- `P2`: Kartenarbeitsplatz nach #937/#988-Release-Qualifikation; Widgets/Exporte und seltene Fachmodule via vorhandene Besitzer.
- Offene integrierende Owner: [#344](https://github.com/MeteoMartini/MID/issues/344) CSS-Performance, [#815](https://github.com/MeteoMartini/MID/pull/815) Lazy-Start, [#1001](https://github.com/MeteoMartini/MID/pull/1001) Fokus, [#952](https://github.com/MeteoMartini/MID/issues/952) 14d-Achsen/Exports, [#975](https://github.com/MeteoMartini/MID/issues/975) 14d-Sichtbarkeit, [#661](https://github.com/MeteoMartini/MID/pull/661) historische Bildassets. Kein zweiter PR oder derselbe Fix auf fremdem Owner.

## 7. Abnahme / Definition of Done pro Slice
1. **Gleicher meteorologischer Fixture-Zustand** (Ort, Beobachtungszeit, Modelllauf, UTC/Zeitzone, 23/25-h-Tag, WMO-Code, akkumulierte Niederschlagsintervalle, Ensemble-Members, Warnungen, Userpräferenzen). Nachher **identische** Datenwerte, Einheiten, NoData, Quellen und echte Extreme.
2. **Sichtbarkeit/Bedienung:** echte Before/After-Screens und DOM-/Computed-Style-Snapshots für 320×568, 360×780, 390×844, 430×932, 768×1024, 834×1194, 1024×768, 1440×900, 1920 Desktop; Light, Dark, High-Contrast, Standard/Erweitert, Orientation, Reduced Motion, Zoom/Dynamic Type, erster Touch, Keyboard und Scroll-/Portal-Verhalten.
3. **Technisches Nichtwachstum:** zwei verifizierte Build-Head-SHAs und Toolchain-Snapshots; initial/alle CSS-Assets raw+gzip+Brotli ≤ original Stable, source-owned `!important`-/Kollisions-Delta ≤ Base oder begründet blockiert, keine neuen globalen CSS-Quellen. Lazy-CSS nicht nur verstecken, offline/erste Öffnung beweisen.
4. **Performance-Browser-RUM getrennt:** LCP p75 ≤2,5s, INP p75 ≤200ms, CLS ≤0,1 **nur Ziele**, keine gegenwärtig erhobenen Messwerte; Style-Recalc, Paint, CPU und Heap auf kleinen Smartphones und Desktop belegen, Karten/GPU in getrennten spezialisierten Gates.
5. **A11y und Fachkonformität:** WCAG 2.2 AA als Ziel, Kontrast text/non-text/focus an echten Oberflächen, Touch/Safe-Area, Blindzustände, Chart-Zugriff ohne Hover, WMO/DWD und Warnprovenienz. Browser/Simulator ≠ echte native iOS-/VoiceOver-Abnahme.
6. **Release-Vertrag:** erst verifizierte Source-SHA / aktuelle Rulesets / vollständige Regression / Source-PR-Review / regulärer Merge / Release-ZIP / `install-mid.yml` / Worker/Pages / Stable-Promotion. Bei Failed-Installer #1004 oder ungeklärtem SHA-/Design-Owner **fail closed**. Kein eigenmächtiger Merge, Dispatch oder Produktivstart.

## 8. Externe Referenzen – Prinzipien, keine Komponenten- oder Screenshotkopie
- **meteoblue MultiModel**, https://content.meteoblue.com/en/private-customers/website-help/forecast/multimodel : Modellnamen und räumliche Auflösung nachvollziehbar neben zugeordneten Modellfarben; MID behält seine eigenen `--model-series-*`-/Linienvertragsfarben.
- **Windy.app Guide**, https://media.windy.app/windyapp_guide_new?tab=0 : Layer steuern **WHAT**, Zeitregler steuert **WHEN**; MID nutzt seine vorhandene Kartenzeitsteuerung und deren Metadaten, ohne Kartenfunktionen anderer Anbieter zu kopieren.
- **Weathergraph**, https://weathergraph.app/ : kohärente Wetterzeitachsen; MID bewahrt getrennte Einheiten, PoP, H/M/L-Wolken und Lücken.
- **Apple Support iOS Weather**, https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/26/ios/26 : Orts-/Jetzt-/Stunden-/Tageshierarchie und stufenweise Tiefe; MID bleibt wissenschaftlich ausführlicher.

**Bottom line / Leit-Chat:** zuerst die **echte original gewählte Informationshierarchie** und das Segmentprinzip auf bestehenden DOM-/CSS-Ownern belegen, dann kleine design- und größenneutrale Ersatz-PRs. Das ist eine visuelle und funktionale Design-Evolution, nicht nur ein CSS-Budget-Projekt; gleichzeitig darf die Oberfläche nicht durch zusätzliche CSS-Kaskaden und Requestlast erkauft werden.
