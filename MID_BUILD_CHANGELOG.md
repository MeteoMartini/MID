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
