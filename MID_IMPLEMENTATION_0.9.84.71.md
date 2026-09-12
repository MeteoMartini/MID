# MID 0.9.84.71 – Implementierung

## Ausgangsbasis
Direkte Fortsetzung von MID 0.9.84.70. Der GitHub-Release-Installer für 0.9.84.70 lief vollständig erfolgreich: reproduzierbare Abhängigkeitsinstallation, Produktionsbuild, Regressionstests, iOS-Sync, Pages-Veröffentlichung, Worker-Diffprüfung und Stable-Promotion waren erfolgreich. `mid-stable` wurde auf Commit `fa6f15dd72bbfa63cca4efe6021fc5d576c30dd4` mit `Install MID v0.9.84.70` promotet.

## Änderungen
1. `src/styles-src/30-modern.css`: Visualisierungs-Audit Block 2 ergänzt.
2. Wasser/Tide: Status-, Kennwert-, Tide- und Quellenbeschriftungen auf semantische MID-Mindesttypografie angehoben; Timeline auf mindestens 132–136 px breite Scroll-Snap-Karten umgestellt.
3. Flugmeteorologie: Bedien-/Quellentexte standardisiert; SVG-Achsen und fachliche Standardwerte gezielt auf 8,5–10,5 px angehoben, ohne die Cross-Section-Geometrie zu ändern.
4. Routenwetter: Karten-Tooltip und Such-/Kontrolltexte lesbarer; Touchziele auf groben Zeigern 44 px.
5. Events/Reise: verbliebene 7–9-px-Status-/Bedien-/Kartenbeschriftungen auf semantische Typografie gehoben; Reise-Tageskarten auf 108–112 px verbreitert statt weiter zu verdichten.
6. Warn-/Gefahrenansichten: Gültigkeits-/Stufenbeschriftungen lesbarer; Windwarnschwellen im 24-h-Profil moderat angehoben.
7. Radar/Komposit/Karten: kompakte Legende, Layer-/Basemaptexte sowie DWD-/KONRAD-/Druckzentrum-Tooltips nachgezogen.
8. iPad Split View: Wasser/Tide, Reise und Flugbriefing erhalten gezielte 600–1024-px-Regeln gegen zu starke Kachelverdichtung.
9. Neue Regression `scripts/test-visualization-readability-2-098471.mjs`; `src/styles.css` aus allen fünf kanonischen CSS-Modulen neu aufgebaut.
10. Releaseversion auf 0.9.84.71 synchronisiert. Worker-Domainlogik unverändert; nur `WORKER_VERSION` geändert.

## Nicht geändert
Keine Wetterdatenlogik, keine Modellfusion/-gewichtung, keine Warn-/Hazardschwellen, keine Tide-/Strömungsberechnung, keine Fluggefahrenberechnung, keine Event-/Reiseberechnung, keine Radar-/Nowcastdatenlogik und keine Piktogramm-/Parameterfarblogik.
