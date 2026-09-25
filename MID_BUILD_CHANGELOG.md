## MID v0.9.85.100 · 2026-09-25 · MID 18.2.12 · Mobile Einstellungsnavigation

- Geprüfter Replit-Handoff `e05bca0aa305a938c886b77e5062ca1c635d4994` vom Branch `replit/settings-mobile-tabs-098599`; read-only Handoff-Gate vollständig grün.
- Die mobile Einstellungsnavigation bleibt einzeilig horizontal scrollbar und führt den aktiven Bereich automatisch vollständig ins sichtbare Scrollfeld.
- Dezente linke/rechte Fortsetzungshinweise zeigen nur dann weitere Tabs an, wenn tatsächlich zusätzlicher Inhalt vorhanden ist; permanente Scrollbars entfallen.
- 44-px-Touchziele und Safe-Area-Abstände bleiben auf 360×800 und 390×844 erhalten; Light/Dark visuell geprüft.
- Neue Regression `scripts/test-settings-mobile-horizontal-tabs.mjs`; bestehender MID-18.2.7-Responsive-Test sowie Handoff-Build/Web-/iOS-Hüllenprüfung grün.
- Keine Änderung an Wetterdaten, Modellfusion, Warnlogik, Schwellen, Parameterfarben, Worker- oder iOS-Fachlogik.

## MID v0.9.85.99 · 2026-09-25 · MID 18.2.11 · Responsive Forecast-Horizontnavigation

- Geprüfter Replit-Handoff dcdfc8c18b1fcc84c19547a8f4d85c163ce07960 über den read-only Handoff-Gate übernommen.
- navigateToDashboardSection verwendet bei modernen Forecast-Modulen die unmittelbar vor dem Modul liegende Horizontnavigation als Scrollziel.
- Mobile Forecast-Horizontnavigation erhält Safe-Area-Scroll-Margin und Abstand zum nachfolgenden Forecast-Modul.
- Neue Regression scripts/test-modern-forecast-horizon-viewport.mjs; Handoff-Build und Web-/iOS-Hüllenprüfung grün.

## MID v0.9.85.99 · 2026-09-25 · MID 18.2.11 · Forecast-Horizontnavigation responsive stabilisiert

- Replit-Handoff aus geprüftem SHA `dcdfc8c18b1fcc84c19547a8f4d85c163ce07960` übernommen; Handoff-Gate vollständig grün.
- Bottom-Tab-Forecastnavigation scrollt bei Prognosemodulen auf die unmittelbar zugehörige Horizontleiste statt den darunterliegenden Modulcontainer, sodass die Leiste nicht oberhalb des Viewports verschwindet.
- Mobiler/Querformat-Abstand und Scroll-Margin berücksichtigen Safe Areas; keine Sticky-/Fixed-Navigation eingeführt.
- Neue Regression `scripts/test-modern-forecast-horizon-viewport.mjs`; vorhandener MID-18.2.7-Responsive-Test und Produktionsbuild grün.
- Reale Sichtprüfung 360×800 Light bestätigt; weitere Zielgrößen sind zusätzlich regressionsgeschützt, die Replit-Browserautomation war dort nicht zuverlässig genug für eine behauptete Sichtabnahme.

## MID v0.9.85.98 · 2026-09-24 · MID 18.2.10 · 90‑Minuten-Skybar mit Nachtkennzeichnung

- ForecastCockpit.ShortTermRibbon leitet now90StartEpoch/now90EndEpoch aus den realen 15‑Minuten-Intervallen ab und nutzt solarTimelineWindow gemeinsam mit Aktuell/24 h.
- now90NightBands werden auf die 120×16-Skybar-Geometrie projiziert und vor SkyBarSegmentsSvg/SkyBarHourCellsSvg gerendert; MID-Nachtfarbe und 14/86-%-Fade entsprechen Aktuell.
- Neue Regression scripts/test-mid-18-2-10-now90-night-098598.mjs schützt Solarquelle, Layer-Reihenfolge, Fade, Farbe und Baseline-Vertrag.

## MID v0.9.85.98 · 2026-09-24 · MID 18.2.10 · 90‑Minuten-Skybar-Nachtkennzeichnung

- 90‑Minuten-Skybar „Heute / Ab jetzt“ nutzt dieselbe zentrale Solar-Geometrie wie „Aktuell“ und das 24‑h‑Profil.
- Nachtbereiche werden aus den realen 15‑Minuten-Intervallen auf die Skybar-Geometrie projiziert und hinter Wettersegmenten bzw. Stundenquadraten gerendert.
- MID-Nachtfarbe und weiche 14/86-%-Fade-Geometrie entsprechen „Aktuell“; Niederschlag, Bewölkung und Sonne behalten ihre bestehende Fachlogik.
- Regression: `scripts/test-mid-18-2-10-now90-night-098598.mjs`.

## MID v0.9.85.97 · 2026-09-24 · MID 18.2.10 · Replit-Audit: Cache, Fokus und lokale Zeitbasis

- Forecast-Core-Cachevertrag Frontend v4 und Worker-Edge v3 dimensionieren Koordinaten, gerundete Höhe und effektive IANA-Zeitzone; unsichere Legacy-Einträge werden nicht migriert.
- Forecast-Fusion-Localcache v10 trennt Höhenstände; Lead-Time-Reconciliation und Tagesfusion nutzen reale lokale Stunden-Epochen.
- forecastPeriods.addForecastDays verwendet reine gregorianische Kalenderarithmetik ohne UTC-Date-Mutation; SevenDayForecastSummary nutzt diesen Vertrag für die Folgenacht.
- AppPortalPopover stellt den gemeinsamen verschachtelbaren Fokusstack bereit; Mehr-Drawer, Event-Center, Impressum und Einstellungen sind angeschlossen.
- Neue Regression test-mid-18-2-10-replit-audit-098597 schützt Cache-Dimensionen, Fokusvertrag, DST-/Datumsgrenzen und Release-Version.

## MID v0.9.85.97 · 2026-09-24 · MID 18.2.10 · Replit-Audit-Fixes

- Forecast-Core-Cache Frontend v4 und Worker-Edge v3 trennen Koordinaten, Höhe und effektive Ortszeitzone; unsichere Legacy-Caches werden nicht mehr als frischer Stand migriert.
- Direktabruf und Worker-Pfad reichen Höhe und Zeitzone konsistent an Open-Meteo weiter; der explizite Worker-Request-Key enthält dieselben Dimensionen.
- Forecast-Fusion-Cache v10 trennt Höhenstände; Tages-Lead-Time basiert auf realen lokalen Stunden-Epochen statt auf festem 12:00Z.
- Gemeinsamer Fokusstack für Dialoge/Popover/Sheets mit Initialfokus, Tab-/Shift-Tab-Fang, Escape nur auf oberster Ebene und Fokus-Rückgabe; Mehr, Event-Center, Impressum und Einstellungen angeschlossen.
- Zivile Kalenderarithmetik für Folgenächte arbeitet ohne UTC-Date-Mutation und ist für CET/CEST, Datums-/Jahresgrenzen sowie weit entfernte IANA-Zeitzonen regressionsgeschützt.
- Neue Regression: `scripts/test-mid-18-2-10-replit-audit-098597.mjs`.

## MID v0.9.85.96 · 2026-09-23 · MID 18.2.9 · METAR-Beobachtung und kompakte 14-Tage-Ansicht

- METAR-Current-Auswertung endet vor Trend-/Remark-Gruppen wie TEMPO, BECMG, NOSIG, INTER, PROB30/40, FM-Zeitgruppen und RMK.
- Der reproduzierende EDDG-Fall `... Q1020 TEMPO SHRA BKN025TCU` kann Current Weather nicht mehr fälschlich auf Regenschauer/Trendbewölkung setzen.
- 14 Tage: Default je Tag nur Wetterkopf, Tmin/Tmax, eine Skybar, Niederschlag, Wind/Böen und Konfidenz; Sekundärwerte ausschließlich im ausgewählten Inline-Detail.
- Doppelte 24-h-Detail-Skybar sowie separate Defaultblöcke für Sonnenscheindauer, Temperaturabweichung und Regime wurden entfernt.
- Replit vor Designänderung auf mid-stable v0.9.85.95 synchronisiert; Veröffentlichung weiterhin ausschließlich über den kanonischen GitHub-Releaseweg.
- Regressionen: `test-metar-trend-observation-boundary-098596.mjs` plus aktualisierter `test-fourteen-day-replit-fluid-grid-098593.mjs`.

## MID v0.9.85.95 · 2026-09-23 · MID 18.2.9 · Gewitter-, RUC-, Skybar- und Performance-Härtung

- J.1: signalScore-only-Vertrag für Detail-/Rapid-Gewitterdiagnose; Legacy-percent-Pfade aus UI und Spezialmodulen entfernt.
- J.2: MU-CAPE/CIN in nativen stündlichen Specialist-Pfad verschoben, Valid-Time-Grenze 35 min eingeführt; VIS/CEILING feldspezifisch als native 15-min-Zustände gekennzeichnet.
- J.3: Skybar trennt direkte Sonnenscheindauer von Wolkenkomplement; alter Komplement-Vertrag und Wissenschaftstest aktualisiert.
- J.4: WeatherNext 2 mit nativeTemporalHours=6/interpolatedHourly markiert, aus stündlichen Warn-/Event-Ensembles ausgeschlossen und in Tagesgewichtung konservativ berücksichtigt.
- J.5: Feature-Chunk-Budgets, Aggregate-Source-of-Truth, Entfernung von weather.tsfrag und dokumentierter Dependency-Review ohne partielle Lockfile-Migration.

## MID v0.9.85.95 · 2026-09-23 · MID 18.2.8 · J.1–J.5 Härtung

- J.1: signalScore-only-Vertrag für Detail-/Rapid-Gewitterdiagnose; Legacy-percent-Pfade aus UI und Spezialmodulen entfernt.
- J.2: MU-CAPE/CIN in nativen stündlichen Specialist-Pfad verschoben, Valid-Time-Grenze 35 min eingeführt; VIS/CEILING feldspezifisch als native 15-min-Zustände gekennzeichnet.
- J.3: Skybar trennt direkte Sonnenscheindauer vom Wolkenkomplement; Wissenschaftsregression entsprechend aktualisiert.
- J.4: WeatherNext 2 mit nativeTemporalHours=6/interpolatedHourly markiert, aus stündlichen Warn-/Event-Ensembles ausgeschlossen und in Tagesgewichtung konservativ berücksichtigt.
- J.5: Feature-Chunk-Budgets, Aggregate-Source-of-Truth, Entfernung von weather.tsfrag und dokumentierter Dependency-Review ohne partielle Lockfile-Migration.

## MID v0.9.85.89 · 2026-09-22 · Arbeitspaket H · Responsive Gesamtabnahme und 7-Tage-Korrektur

- Replit-Abnahme: 7-Tage-Fix sowie H.1/H.2a/H.2b/H.2c umgesetzt; H.1 und H.2c jeweils mit vollständiger Light/Dark-Viewportmatrix grün, Typecheck/Produktionsbuild/Regressionen ohne Befund.
- Produktive Übernahme erfolgt bewusst als Mapping auf ForecastCockpit, MeteogramPanel und WaterSportsPanel statt durch Kopieren des Mockup-Sandbox-Codes.
- Neue finale UI-Schicht midC18WorkPackageH.css erzwingt die vertikale 7-Tage-Tagesliste unabhängig vom früheren Orientierungsvertrag, ordnet die aktive Detailfläche hinter allen sieben Zeilen an und schützt H.2c-Overflow-/Touchverträge.
- Regression test-mid-18-2-6-h-responsive-handoff-098589.mjs schützt die produktiven 7-Tage-, Meteogramm- und Tide-Verträge; meteorologische Daten-, Warn-, Schwellen-, Modellfusions- und Skybar-Fachlogik bleiben unverändert.

## MID v0.9.85.88 · 2026-09-22 · Arbeitspaket G · Ensemble, Klima und Widgets

- Replit-Abnahme vollständig grün: Typecheck, Produktionsbuild, fokussierte Regressionen sowie Light/Dark auf 360×800, 390×844, 430×932, 844×390, 768×1024, 1024×768 und 1440×900.
- Produktintegration verwendet die bestehenden EnsemblePanel-, ClimatePanel- und AppleWidgetSettings-/Export-Verträge; Datenquellen, Schwellen und Berechnungen wurden nicht geändert.
- Neue finale UI-Schicht midC18WorkPackageG.css schützt Umbruch, Tooltipbreite, Touchziele und Overflow; Regression test-mid-18-2-5-g-ensemble-climate-widgets-098588.mjs sichert die Verträge.

## MID v0.9.85.87 · 2026-09-22 · 14-Tage-Zeilen responsiv entzerrt

- Replit-Abnahme: Light/Dark auf 360×800, 390×844, 430×932, 844×390, 768×1024, 1024×768 und 1440×900 sowie längere mobile Detailansichten grün.
- Mobiler 14-Tage-Header nutzt flexiblen Textbereich plus getrennte Konfidenzspalte mit mindestens 132 px; verschachtelte Elemente erhalten min-width:0 und wesentliche Texte keinen Truncate-Vertrag.
- Neuer Regressionstest schützt ForecastRow-Struktur, Konfidenzpille, Umbruch und Overflow-Vertrag.
- Der v0.9.85.86-Heute-/24-h-Viewport-Regressionsvertrag ist vorwärtskompatibel auf 0.9.85.86 oder neuer fortgeschrieben; seine fachlichen Viewport-Assertions bleiben unverändert.

## MID v0.9.85.86 · 2026-09-22 · Heute-/24-h-Viewport-Fix

- Replit-Abnahme für Smartphone, Tablet und Desktop in Light/Dark vollständig grün.
- Künstliche 600/640-px-Mindestbreiten des 24-h-Profils entfernt; der Profiltrack bleibt durchgehend stündlich.
- Außencontainer der Heute-Arbeitsfläche gegen horizontalen Overflow abgesichert; der bewusste 90-Minuten-Innenscroll bleibt lokal begrenzt.
- Untere Profilachse erhält sicheren Rendering- und Padding-Raum; meteorologische Fachlogik und Daten bleiben unverändert.
- Neue Regression test-mid-18-2-5-today-viewport-098586 schützt den Responsive-Vertrag.

## MID v0.9.85.85 · 2026-09-22 · MID 18.2.5 · gesammelte Current-/24-h-/7-/14-Tage-Korrekturen

- Beide Replit-Einschübe gemeinsam abgenommen: Typecheck, Produktionsbuild und fokussierte Regressionen grün.
- Responsive Abnahme für Light/Dark auf Smartphone, Tablet und Desktop inklusive Hoch-/Querformat ohne offene Restpunkte.
- Produktive Übernahme schützt Current-Windrichtungspfeil, getrennten +12-h-Header, ausschließlich stündliches 24-h-Profil, aktive 7-/14-Tabs, kollisionsfreie 7-Tage-Zeilen, lesbare Konfidenz-Pillen und ganzzahlige Haupt-Sonnenstunden.
- Neue Regression scripts/test-mid-18-2-5-ui-fixes-098585.mjs und nach Arbeitspaket F geladener Designlayer src/midC18ResponsiveCorrections.css.

## MID v0.9.85.84 · 2026-09-22 · Arbeitspaket F · Map-first Kartenarbeitsraum

- Replit-F-Abnahme einschließlich Transparenz-Follow-up vollständig grün.
- Neuer Designlayer `src/midC18MapFirstWorkspace.css`, geladen nach Arbeitspaket E.
- Produktive Fachverträge verbleiben in `RadarPanel.tsx`, `WeatherMapsPanel.tsx` und `SynopticPanel.tsx`; keine Änderung der meteorologischen Datenlogik.
- Neue Regression `scripts/test-mid-18-2-5-f-map-first-098584.mjs` schützt Timeline, Playback, Jetzt, Layer-Deckkraft, Synoptik und Responsive-Komposition.
- Light/Dark-Abnahme: 360×800, 390×844, 430×932, 834×1112, 1112×834 und 1440×900.

## MID v0.9.85.83 · 2026-09-22 · Arbeitspaket E

- ForecastCockpit: gemeinsame MidForecastRow-Familie für 7-/14-Tage.
- 7 Tage: selectedDate ist alleiniger Inline-Detailzustand; unabhängiges expandedDate entfernt.
- 14 Tage: bisherige Fokuskarte direkt unter die aktive Tageszeile verschoben; kompakte Skybar und Tmin/Tmax-Faden aus bestehenden Daten ergänzt.
- Neuer zuletzt geladener Designlayer für Desktop, Tablet hoch/quer und Smartphone.
- Neuer Regressionstest schützt gemeinsame Row-Struktur, genau eine Inline-Erweiterung, vorhandene Datenquellen und Responsive-Vertrag.
- Replit-Vorprüfung: Typecheck/Produktionsbuild und Light/Dark-Viewportmatrix grün; kanonischer GitHub-Gate bleibt maßgeblich.

# MID v0.9.85.39

## MID-C9 · Mobile Layoutkorrektur nach Screenshots

- Aktuell: vier Kernparameter tatsächlich als 2×2-Raster; alte übergreifende Zellbelegungen zurückgesetzt. Wetterkopf, Quellenzeile und Niederschlagsinformation kompakter; doppelte Freifläche vor dem Footer reduziert.
- Kurzfrist: alle Zeitpunkte bleiben in genau einer horizontal scrollbareren Zeile. Die feste Sechs-Spalten-Begrenzung entfällt, auch der siebte Zeitpunkt bleibt oben.
- Favoriten: einzeilige Anordnung mit klarer Auswahl, separater Verwaltung und einmaliger Standard-Kennzeichnung; keine überlagerten Grid-Bereiche oder doppelte Abkürzung.
- Aktiver Kurzfrist-Schalter mit lesbarem Textkontrast. Wetterwerte, Quellen und Bedienfunktionen bleiben erhalten.

# MID v0.9.85.38

## MID-C9 · Einheitlicheres Design und ruhigere Bildsteuerung

- Die 90-Minuten-Vorschau bildet eine durchgehende Zeitleiste mit klar hervorgehobenem Zeitpunkt.
- Auf Tablets passen Seitenleiste und Inhaltsabstand zusammen; auf großen Bildschirmen sind die Navigationsziele wieder beschriftet. Lange Ortsnamen bleiben lesbar.
- „Mehr“ erhält übersichtliche Einstellungszeilen und einen beim Scrollen erreichbaren Kopf. Flächen und Abstände sind ruhiger und einheitlicher.
- Das DWD-Originalbild lässt sich in feineren Schritten von 50 bis 500 Prozent zoomen. Der betrachtete Ausschnitt bleibt beim Zoomen erhalten; „Standort“ und „100 %“ führen gezielt zurück.
- Verzögerte Zentrierungssprünge entfallen. Die eingebettete Originallegende wird nicht mehr durch allgemeine Bildgrößenregeln verkleinert.
- Wetterwerte, Warnschwellen, Parameterfarben und die bisherige geografische Bildkalibrierung bleiben unverändert.

# MID Build-Changelog · v0.9.85.37

## Redesign-Stufe C17 · DWD-Ortsausschnitt wieder exakt lokalisiert

- Der reale Mobil-Sichtvergleich zeigte, dass „Wolken + Niederschlagsart“ trotz unveränderter DWD-Georeferenzierung nicht in jedem Öffnungs-/Resize-Zyklus sichtbar auf dem gewählten Ort stehen blieb. Ursache war die Darstellungsfolge: der Bildcanvas konnte nach dem ersten Zentriervorgang noch seine Größe ändern beziehungsweise animieren.
- DwdPrecipitationTypeRadar zentriert jetzt mit der tatsächlich gerenderten Canvas- und Viewportgröße. Ein zusätzlicher ResizeObserver überwacht sowohl Viewport als auch Canvas und zieht den gewählten Standort nach jeder relevanten Größenänderung wieder exakt in die Mitte.
- Bildladen löst nach dem Layout zusätzlich eine Standortzentrierung aus. Die Wiederholungen liegen bei unmittelbarem Layout, zwei Animation Frames sowie 80/180/360 ms, damit iOS-/PWA-Layoutwechsel und aufklappende Bereiche nicht mehr in einem halbverschobenen Zustand enden.
- Der Standortmarker ist nun ein konsistentes MID/Lucide-MapPin mit zusätzlichem 6-px-Ankerpunkt exakt auf dem georeferenzierten Originalpixel. Der bisherige Emoji-Pin entfällt.
- src/midC17DwdLocationFix.css entfernt die Breitenanimation des Originalbild-Canvas, schützt Auto-Scroll-Zentrierung und reduziert die eingebettete Originallegende mobil leicht, ohne DWD-Inhalt oder Pixelanalyse zu verändern.
- scripts/test-c17-dwd-location-centering-098537.mjs schützt die etablierte Kalibrierung einschließlich des realen Elsig-Sichtvergleichs (50,67° N / 6,76° E → normierter Originalbildpunkt 0,33102793 / 0,46836195) und prüft exakte Zentrierbarkeit auf 320/390/430/768 px Viewports.
- Keine Änderung an DWD-Quelle, Originalbild, Niederschlagsartenklassifikation, Pixelanalyse, Radar-/Satellitenzeit, Nowcast-/RUC-Logik oder meteorologischen Schwellen.

# MID Build-Changelog · v0.9.85.36

## Redesign-Stufe C16 · Heute-Proportionen nach realem iPhone-Sichtvergleich

- Der Sichtvergleich mit v0.9.85.35 zeigte, dass das 24-h-Wetterprofil auf schmalen Viewports die volle Desktop-Y-Geometrie von 632 Einheiten beibehielt und dadurch gegenüber der verfügbaren Breite sichtbar überdehnt wirkte.
- `ForecastCockpit` skaliert die komplette Y-Geometrie des 24-h-Profils jetzt gemeinsam und konsistent: Smartphone bis 560 px auf 72 %, mittlere Viewports bis 860 px auf 86 %, Desktop unverändert auf 100 %. Zeitachse, Solarereignisse, Wetterpiktogramme, Wolken-, Temperatur-, Niederschlags-, Wind-, Druck- und Hazardspuren folgen derselben Skalierung.
- `src/midC16TodayProfileFix.css` schützt Textfluss und Containerbreiten. Die Kurzfrist-Zusammenfassung darf umbrechen, die 90-Minuten-Kopfzeile wird auf sehr schmalen Geräten von redundantem Zusatztext befreit.
- Der DWD-Disclosure verwendet nun einen expliziten Button statt des nativen `details`-Zustands. Dadurch kann eine vom Browser wiederhergestellte `open`-Eigenschaft das große DWD-Originalbild nach Rückkehr oder Reload nicht ungefragt erneut öffnen. Das Bild wird weiterhin erst nach Nutzeraktion gerendert. Zusätzlich wurde der nicht definierte helle `--card`-Fallback entfernt; die Disclosure-Fläche verwendet jetzt die aktiven MID-Themeflächen `--surface`/`--s2`.
- Wetterdaten, DWD-Originalprodukt, Pixelanalyse, Zoom, Nowcast-/RUC-Fusion, Warnschwellen, Parameterfarben und Zeitsemantik bleiben unverändert.
- `scripts/test-c16-today-profile-density-098536.mjs` schützt die responsive Profilgeometrie, den Textfluss und den explizit geschlossenen DWD-Startzustand.

# MID Build-Changelog · v0.9.85.35

## Redesign-Stufe C15 · Heute-Dichte und progressive DWD-Ansicht

- `DwdPrecipitationTypeDisclosure` hält das amtliche DWD-Originalprodukt vollständig verfügbar, rendert die große Bildfläche in „Heute“ und Kurzfrist aber erst nach bewusster Öffnung. Originalbild, Radar-/Satellitenzeit, Pixelanalyse und Zoom bleiben unverändert erhalten.
- `ForecastCockpit` und `ShortTermForecast` verwenden denselben Disclosure-Vertrag, damit das DWD-Bild nicht mehr mehrfach als dauerhaft dominante Fläche erscheint.
- `src/midC15TodayDensity.css` wird nach C14 geladen und verdichtet das mobile 24-h-Wetterprofil. Abgeleitete Signale werden auf schmalen Viewports als horizontale, touchfreundliche Leiste geführt; Auflösungswahl, Legende und Info bleiben erhalten.
- Die Profil- und Hilfeflächen sind weiterhin an ihren eigenen Viewport gebunden. Die meteorologischen Spuren, Warnschwellen, Parameterfarben, Quellprovenienz und Zeitsemantik werden nicht verändert.
- `scripts/test-c15-today-density-098535.mjs` schützt die progressive DWD-Ansicht, die C15-Kaskadenposition und die mobile Profil-Dichte. Der bestehende C11-Vertrag wurde ausschließlich auf den gemeinsamen Disclosure-Namen fortgeschrieben.

# MID Build-Changelog · v0.9.85.34

## Redesign-Stufe C14 · Karten als Arbeitsraum und reale Viewport-Korrekturen

- `src/midC14MapWorkspace.css` vereinheitlicht den Kartenbereich als Map-first-Arbeitsraum. Komposit und DWD-Wetterkarten verwenden denselben Dichtevertrag für Smartphone, Querformat, Tablet und Desktop.
- Der bestehende Komposit-Fokus bleibt fachlich unverändert: Radar, Satellit, Nowcast und Modell/Synoptik teilen weiterhin die bestätigte Produktzeitachse. Überschrift, Moduswahl und Zeitleiste werden visuell deutlich kleiner, die Karte erhält den größten Viewport-Anteil.
- `WeatherMapsPanel` entfernt die dauerhaft doppelte Zeitschritt-Auswahl. Direkt sichtbar bleiben nur Modell und Kartenprodukt; die Karte trägt Produkt, Gültigkeit und Lead Time kompakt als Overlay.
- Druckfläche/Höhe, Kartenbasis, Deckkraft und Reload liegen nun in `Darstellung & Ebenen`; Quelle, INIT und Gültigkeit liegen in `Quelle & Lauf`. Beide Bereiche sind standardmäßig eingeklappt und bleiben vollständig zugänglich.
- Die gemeinsame Kartenzeitleiste behält Zurück/Play/Vor/Range und ergänzt einen `Jetzt`-Sprung zum fachlich bevorzugten verfügbaren Termin.
- Der Screenshot-Abgleich zeigte eine zentrale Kaskadenursache: `v078` wurde nach den Redesign-Dateien geladen und konnte C7–C13 auf realen Smartphones teilweise wieder überschreiben. `src/main.tsx` lädt den Legacy-Layer nun vor sämtlichen Redesign-Stufen; C14 bleibt als letzte visuelle Schicht maßgeblich.
- `src/midC14ViewportFixes.css` verdichtet Kopf, Suche, Favoriten, Orts-/Warnkontext und aktuelle Kernwerte. Die primäre Smartphone-Ansicht zeigt vier Kernparameter; Sichtweite bleibt in den Zusatzdetails erreichbar.
- Das Impressum erhält einen strikt viewportgebundenen Dialog mit dauerhaft zugänglichem, sticky Schließen-Kopf und intern scrollendem Inhalt. Hoch- und Querformat verwenden Safe-Areas und `100dvh`.
- DWD-Originalbildzoom und breite Diagramme dürfen ihre äußeren Container nicht mehr verbreitern. Vergrößerung und horizontales Scrollen bleiben auf den jeweiligen Bild-/Diagrammviewport beschränkt; die App selbst wird horizontal geklemmt.
- `CompositeTimelineContract.phaseSources` bereitet die gemeinsame Kartenzeitachse auf einen späteren transparenten Übergang von Satellitenbeobachtungen zu modellbasierten Pseudo-Satellitenbildern vor. Jede Phase kann eine eigene Quelle tragen; weiterhin werden ausschließlich bestätigte Produktzeitpunkte verwendet und keine Zwischenbilder erfunden.
- Datenquellen, DWD-WMS/Raster, Radar-/Satelliten-/Nowcastlogik, Modellkonturen, Warnregeln, Farbcodierungen und Zeitsemantik wurden nicht geändert.
- `scripts/test-c14-map-workspace-098534.mjs` schützt Map-first-Hierarchie, eine gemeinsame Zeitleiste, einklappbare Sekundärsteuerung und Responsive-Verträge. `scripts/test-c14-viewport-fixes-098534.mjs` schützt Kaskadenreihenfolge, Portrait-Impressum, Zoom-Containment, Smartphone-Dichte und den künftigen Quellenwechsel Satellit → Pseudo-Satellit.

## Redesign-Stufe C13 · mobile Dichte und Aktuell

- `src/midC13MobileDensity.css` wird nach C12 geladen und korrigiert die im realen Smartphonebild noch zu große, kachelartige Aktuell-Darstellung.
- Der Orts-/Warnkontext erhält verbindlich die Reihenfolge vor `Aktuell`; die alte CSS-Sortierung darf den Ort nicht mehr ans Abschnittsende verschieben.
- Der bestehende `hidden`-Vertrag der Zusatzwerte wird auf Autorenebene geschützt. `mehr/weniger` blendet die Sektion damit tatsächlich ein bzw. aus.
- Geöffnete Zusatzwerte werden als eine zusammenhängende, ruhige Detailfläche mit Zeilentrennung dargestellt; UVI-/AQI-Skalen und Sonne/Mond bleiben erhalten, ohne wieder eine gleichrangige Kachelmatrix zu bilden.
- Auf Smartphonebreiten scrollt der große Kopf mit der Seite statt den knappen Viewport dauerhaft zu belegen. Logo, Aktionsflächen, Suche, Favoriten, Ortskopf, Atmosphärenkarte, Radar-Nowcast und Bottom-Bar erhalten reduzierte Höhen und Schriftgrößen mit Safe-Area-Schutz.
- Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogramme, Parameterfarben, Quellenbewertung und Zeitsemantik bleiben fachlich unverändert.
- `scripts/test-c13-mobile-density-098533.mjs` schützt Reihenfolge, echte Klappung, De-Kachelung, mobile Dichte und die wichtigsten Breakpoint-/Safe-Area-Verträge.

## Redesign-Stufe C12 · Vorhersage

- `src/midC12ForecastRedesign.css` wird nach C11 geladen und setzt die verbindliche visuelle Hierarchie der Vorhersage um.
- 7 Tage: Verlaufsgrafik bleibt Primärvisualisierung; Tageswerte bilden ein zusammenhängendes Band; die stündliche Detailansicht wird in denselben Arbeitsraum integriert.
- 14 Tage: Ensemble-/Konsistenzinformationen bleiben vollständig erhalten; Tagesdarstellung wird als fortlaufende Spalten organisiert; der gewählte Tag erhält eine integrierte Detailtiefe statt einer zweiten gleichgewichteten Karte.
- Responsive Verträge schützen Smartphone Hoch-/Querformat, Tablet, Desktop, Safe-Areas, horizontale Prognosebereiche und reduzierte Bewegung.
- Keine Änderung an Wetterdaten, Nowcast-/RUC-Logik, Warnschwellen, Piktogrammlogik, Parameterfarben oder Zeitsemantik.
- `scripts/test-c12-forecast-redesign-098532.mjs` schützt Struktur, Auswahlzustände, Responsive-Verträge und den ausgelieferten, nichttechnischen App-Changelog.

## Veröffentlichung

Verbindlicher Pfad: **Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → Stable-Promotion**. Der Stand darf erst nach grünem Gate und erfolgreicher Stable-Promotion als veröffentlicht gelten.
