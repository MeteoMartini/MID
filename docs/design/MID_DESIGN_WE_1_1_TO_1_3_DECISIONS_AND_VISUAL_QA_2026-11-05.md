# MID Design-WE 1.1–1.3 – kuratierte Gestaltungsentscheidungen und visuelle Abnahme

**Archivierungsstatus 05.11.2026:** kuratierte Zusammenführung der frühen Konzeptentscheidungen mit den früheren Repository-Dokumenten, **kein neuer UI-/Wettercode und keine Abnahme aktueller Produktionsscreenshots**. Ursprungsbilder und Nicht-Verfügbarkeit der originalen GitHub-PNG-Bytes im zugehörigen [Asset-Index](MID_DESIGN_WE_1_1_TO_1_3_ORIGINAL_ASSET_INDEX_2026-11-05.md). Ausgangsbasis nur zum Dokumentationsabgleich: `main=mid-stable` v0.9.85.431 @ `77de0e326d586274d5f42f0ea63827a887d1b147`.

## 1.1 – Heute / 24 Stunden

**Gewählte Richtung:** B „ruhiger Diagramm-/Zeitachsenfokus“ + A „sichtbare nächste 90 Minuten“ + **selektive** tiefe C-Datensteuerung. Nicht: alle drei vollständigen Konzeptoberflächen nebeneinander oder als drei konkurrierende Designs. Light und Dark folgen denselben Strukturen und Wetterfarbrollen.

Die in der nachträglich kombinierten Vorschau verbindlich klarere Reihenfolge: **Wetter/Skybar → Bewölkung gesamt und H/M/L → Temperatur/UTCI/Taupunkt → Niederschlagsmenge und PoP → Wind/Böen → Luftdruck → Hazards**. Skybar bleibt über dem Temperaturdiagramm; ein vom Bildentwurf abweichendes CSS-Order oder eine Wetterzeile nach den Kurven ist kein akzeptierter Ersatz. Die nächsten 90 Minuten sind im 15-Minutenraster kompakt und einklappbar. Beim Antippen eines Zeitpunkts sind dessen gültige Menge, PoP und Wind/Böen direkt auffindbar.

Temperatur-/Niederschlag-/Wind-Fokussteuerung darf nicht inert sein: tatsächlich bedienbare Buttons mit eindeutigen aktiven Zuständen, stabilem Fokus und vollständigen Werten nach Öffnen. Visuelle Hervorhebung ist **keine** fachliche Forecastfusion. 24h-Linien, Modell-/Wettercode, stationäre Provenienz und alle bestehenden Details bleiben erreichbar.

Referenzen auf Stable:
- [Heute-Entwurfsdokument](MID_DESIGN_WE_TODAY_CANDIDATE.md)
- Fachverträge: `MID_PARAMETER_DISPLAY_PRECISION_CONTRACT.md`, `AGENTS.md` und betroffene Stunden-/Skybar-/PoP-Zeitverträge

## 1.2 – 7 Tage und 14 Tage

### 7 Tage

Der **bestehende durchgehende 7-Tage-Wetter-/Skybar-Verlauf bleibt oberhalb** der wählbaren Ansichten; er wird nicht durch einen Kartensatz ersetzt. Die drei semantischen Ansichten:

- **Übersicht:** sieben sehr kompakte horizontale Tagesreihen mit Datum, Wetterpiktogramm, blauem Tmin/rotem Tmax, echter PoP **und** Menge, Wind/Böen. Ein ausgewählter Tag öffnet seinen vollständigen originalen Wetter-/Stunden-/Ensembleverlauf **direkt darunter**; wiederholtes Tippen klappt zu. Sonnenschein/UVI und alle ursprünglichen Informationen bleiben über Detail/Diagramme erreichbar. Kein erzwungenes ewiges Öffnen der Stundendetails.
- **Diagramme:** genau fünf unabhängig lesbare, vertikal gestapelte Fachdiagramme mit derselben Datumsachse: **Temperatur/Ensemblespanne**, **Tagesniederschlagsmenge**, **Tages-PoP**, **Wind/Böen**, **Sonnenscheindauer**. Menge und PoP niemals in einer erfundenen gemeinsamen Nullskala vermischen; keine künstliche Glättung echter Extreme.
- **Tabelle:** dichte echte Tages-/Zeilenmatrix mit vier fachlich passenden Tagesabschnitten (Morgen/Mittag/Abend/Nacht, sofern echte Zeitdaten verfügbar); keine 7 großen Karten. Schmale Bildschirme erhalten einen **inneren** horizontalen Scrollbereich und bedienbare Tages-/Stundendetails, ohne horizontales Scrollen des gesamten Dokuments.

### 14 Tage

Die verifizierte Designrichtung aus den ursprünglichen Bildern enthält als optischen Hauptanker einen **Temperaturverlauf mit echten Ensembleunsicherheiten**. Dieser soll nicht hinter Phasen, übergroßen Karten und Vortext versteckt werden. Darunter kompakte Tagesansichten und, wo im bereits gewählten Konzept vorgesehen, zwei getrennt bedienbare Wochenstreifen. Wetterphasen nachgeordnet, ohne sie zu entfernen. Diagramm-/Tabellenmodus erhalten die etablierten Datenzugriffe; **14 Tage** dürfen nicht scheinbar komplette Einzelprognosen darstellen, wenn der Quellenhorizont kürzer ist.

**Diagramme:** Temperatur-/ENS-Unsicherheit, Niederschlag und Wahrscheinlichkeit, Wind/Böen sowie Sonnenscheindauer fachlich getrennt; der ursprüngliche 14d-Hauptplot hat Vorrang vor rein dekorativen Minikurven. **Tabelle:** eine echte kompakte Tagesmatrix, keine unverbundenen 14 Kacheln. P10/P90 bzw. P25/P75 nur aus echten Ensemblewerten; fehlende Mitglieder/Zeiten als Missing und nicht Null. Modelle, Modelllauf, Gültigkeit, Tagesphasen, PoP-Bezugsintervall sowie amtliche Warnungen stets nachvollziehbar.

**UI-Namen:** Konzeptbuchstaben `A/B/C` nicht sichtbar als dauerhaftes Produktlabel verwenden; „Übersicht“, „Diagramme“ und „Tabelle“ bzw. semantisch gleichwertige bestehende Beschriftung. Intern existierende Mode-/Persistenzschlüssel erhalten.

Referenz auf Stable: [MID .415 Sichtbarkeits- und Abnahmematrix](MID_DESIGN_WE_415_VISIBILITY_QA.md). Sie ist historische Evidenz, keine Aussage, dass jeder Pixel der aktuellen .431 bereits abgeglichen wurde.

## 1.3 – korrigierte Bildtreue gegenüber früheren Zwischenimplementierungen

Der 03.11.2026 angelegte Text `ORIGINALBILDER_SOLL_IST.md` und sein historischer .416-Handoff dokumentieren sechs konkrete Bildtreue-Korrekturen:
1. Mobile 7d-Übersicht: **eine kompakte Tagesreihe** pro Tag, nicht mehrere breite Metrik-Zeilen; Daten weiterhin in Details zugänglich.
2. 14d: **echte DOM-Reihenfolge** Haupt-Ensemble-Plot → kompakte Wochenstreifen → Wetterphasen. Nicht nur CSS-Positionstrick.
3. 7d-Diagramme: **eine vertikale Spalte** mit fünf Fachdiagrammen; keine zwei ungleich breiten Charts nebeneinander.
4. 7d/14d-Tabellen: echte vergleichbare Zeilen mit Scroll/Fokus statt Mobile-Card-Verwandlung.
5. 14d-Tageskarten: merklich kompakter als die vormals großen 200px+-Karten, ohne Touchziele und Legenden zu quetschen; bei Lücken keine erfundenen Prognosen.
6. Weg mit sichtbaren Buchstabenpräfixen; ruhige gemeinsame Typografie, klare Wetterwert-Hierarchie und responsive Dichte.

**Diese sechs Punkte sind der historische Soll-Abgleich; ob eine Stelle in .431 noch defekt ist, muss Kilo zuerst über einen aktuellen echten Browser-/Source-Befund überprüfen.** Keine alte .415/.416 CSS-Datei blind zurückportieren.

## Dokumentierte Abnahme – vor jedem Anspruch „bildtreu“

| Bereich | Verpflichtende Evidenz |
|---|---|
| Geräte | 320×568, 360×780, 375×667, 390×844, 430×932, 768×1024, 834×1194, 1024×768, 1440×900 und Desktop; Light/Dark und relevanter hoher Kontrast |
| Visuelles Soll | Je Referenzbild **tatsächlichen App-Browserscreenshot derselben Oberfläche**, Side-by-Side, klar zugeordneter Viewport/Theme/Datenzustand; Abweichungen mit konkreter DOM/CSS-Ursache |
| Interaktion | Erste Berührung, 44px-Touchziel (bestehende Bottom-Navigation 52px), Tastaturfokus, Moduswechsel, Tage öffnen/schließen, korrektes Scrollen und Persistenz nach Reload |
| Physik | WMO-/DWD-Wettercodes, echte Modellwerte/-Einheiten, 15min/1h/Tag-Akkumulation, 23/25h-Tage, NoData≠0, PoP-Bezug, Ensemble-Member/Quantile, echte Extremwerte |
| Kontinuität | Favoriten, Karten/Isobaren/Isohypsen, Modellwahl, 90min/12h/7d/14d, Warnprovenienz, Widgets/URL-/PNG-/SVG-Exporte; keine übergreifende Daten- oder Zustandsregression |
| Fach-/Gerätegates | Pflichtregressionen + echter Chromium-/Safari-Viewport-Nachweis auf exaktem Source-Head; Browser-/Simulatorläufe sind **keine** echte iOS- oder VoiceOver-Hardwareabnahme |

Weitere laufende, **nicht** durch dieses Archiv erledigte Qualitätsaufträge: [#523 appweiter Design-/Meteorologieaudit](https://github.com/MeteoMartini/MID/issues/523) und [#508 App-weite Persistenz](https://github.com/MeteoMartini/MID/issues/508). Ebenso bleibt der RUC-P0–P5-/168h-SLO gesondert offen. Keine Produktdatei, Testgrenze oder CI-Regel wird mit dieser Dokumentenübernahme verändert.

## Autorität / Versionierung

Der eigentliche Source of Truth bleibt die aktuelle freigegebene `mid-stable` + `AGENTS.md`, die normativen fachlichen Verträge sowie spätere ausdrücklich gewählte Produktentscheidungen. Dieses Archiv konserviert den gewählten Designkontext, **nicht** ein Recht zum Nachbau veralteter Widgets oder zur Änderung geschützter Branches. Echte Original-PNGs sind im oben verlinkten Index weiterhin als **noch zu importieren** markiert. Ein reiner DRAFT-Dokumentations-PR ist kein App-Build und deshalb kein v0.9.85.432-Release; die Version wird nur beim tatsächlich freigegebenen Build nach MID-Vertrag erhöht.
