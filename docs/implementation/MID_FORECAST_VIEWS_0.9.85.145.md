# MID-C12 · v0.9.85.145 · Unterschiedliche Prognoseansichten

Verifizierte Ausgangsbasis: main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91, veröffentlichte .144. Alle 45 Quelldateien des vorangegangenen C12-Release im endgültigen Stable-Tree hashidentisch geprüft; Live version.json zeigt .144. PR #228 und Installer 37015730292 erfolgreich. Der reguläre RUC-Lauf 37015743154 verwendete exakt diese Stable-Basis und hat erfolgreich publiziert. Das Live-Manifest enthält acht native Kartentypen / 48 Raster; Kartenfelder und Summen aus demselben 12-UTC-Lauf. Je ein Live-T+24-Feld aller acht Typen mit HTTP, Länge, SHA256, entpackter Länge, Lauf/Termin und Einheit verifiziert. Profil 870996282 Bytes, unveränderter Deckel 900000000 Bytes.

## Autorisierte Nutzerkorrektur

Spurenmenge „<0,1 mm“ wird bisher in der kompakten 14d-Metazeile durch overflow:hidden / text-overflow:ellipsis abgeschnitten. Beide Ansichten müssen Menge und Einheit vollständig zeigen. P25/P75-Kürzel vor sichtbaren Zahlen entfallen; die Werte bleiben reale Quantilgrenzen, keine umgedeuteten Minima/Maxima. Die ausführliche Legende und zugängliche Beschreibung erklären weiterhin die fachliche Spanne. In 7d gehören Tmin und Tmax sichtbar zusammen, einschließlich beider Unsicherheiten und echter Mediane auf gemeinsamer Temperaturskala. 14d bleibt eine eigenständige langfristige Ensemble-/Trendansicht. Funktionale Layoutunterschiede, keine nur dekorativen Überschriften.

## Geprüfter finaler UI-Handoff

Branch replit/v0.9.85.144-c12-7d-14d-ensemble-layout, Head ccb4800f3d015313dcf3224270dc934f4f640140. Die Branchbezeichnung nennt die .144-Ausgangsbasis; integriert wird der ausdrücklich autorisierte .145-Auftrag. Parentfolge 3951e8c → c5d53ca → 9e3176f → ccb4800; Mergebase exakt 3951e8ce58239634ed48b4f13e5a58ee23c73c91. Sieben erlaubte UI-/Testpfade, keine geschützten, fachlichen Modell-/Worker-/Governance- oder Releaseänderungen aus Replit.

SHA-genaues read-only Handoff-Gate 37030686168 erfolgreich. Produktionsbuild/Types, alle 899 Regressionen mit 0 Fehlern, unveränderte JS-/CSS-Budgets, Dependency-Audit ohne HIGH/CRITICAL-Befunde sowie gemeinsame Web-/iOS-Hülle bestanden. Kein Replit-Release, keine Promotion oder direkte Produktionsänderung.

## Finales Verhalten

- Spannenwerte erscheinen als kompakte Zahlenpaare mit gemeinsamer Einheit, ohne sichtbare P25/P75-Präfixe. Gleiche formatierte Grenzen werden einmal angezeigt. Quantilbedeutung und echte Mediane bleiben in Legende und zugänglichen Beschreibungen erhalten.
- 7d verbindet beide realen Temperaturspannen auf derselben Skala. Tmin und Tmax der Tageskarte stehen mit ihren erhaltenen ECMWF-Farben und Beschriftungen in einem gemeinsamen abgerundeten Rahmen. Die bestehende Temperatur-DOM-Struktur bleibt erhalten; keine Minima, Maxima oder Ensemble-Mediane umgedeutet.
- 14d betont die einzelnen Modellspannen mit Label-/Wertezeile über durchgehenden Balken. 7d bleibt kompakter mit gruppierter Temperatur und Wetterstreifen.
- Die 14d-Haupt-Regenmenge reserviert ausreichend Platz und bleibt ohne Ellipse; benachbarte Sonne-/Windangaben können umbrechen. Mobile 7d-Rain/Wind- und Details-Gruppen sowie Tablet-Spalten sind auf die verfügbare Breite abgestimmt.
- Die kleine CSS-Überschreitung des Zwischenstands wurde durch kompaktere bestehende Regeln behoben. Die Budgettests und Grenzen bleiben vollständig unverändert. Die ursprüngliche Temperaturklasse bleibt erhalten; historische Achsen-/Skybar-/Farb-/Landscape-Prüfungen bestehen unverändert.

## Vollständige Karten-Freigabe

scripts/verify-forecast-views-browser-0985145.mjs rendert die echten vollständigen SevenDayBand-/FourteenDayHorizon-Komponenten. 96 Kombinationen aus sechs Breiten (320/390/402/844/1024/1440), Hell/Dunkel, beiden Ansichten und kn/kmh/ms/mph. Maximal 1200 px verfügbarer Testcontainer, damit Tablet-/Desktopkarten ihre echte Breite nutzen. Prüft primäre Spurenmengen samt Einheit, alle Spannengrenzen, sichtbare Tmin-/Tmax-Beschriftungen und beide Zahlen sowie Textbeschneidung durch relevante Vorfahren und horizontales Overflow. Der Selektor richtet sich auf die erhaltene Temperaturgruppe statt einer zwischenzeitlichen neuen Klasse; alle vier Temperaturfelder und ihre Sichtbarkeits-/Clipping-Prüfungen bleiben verpflichtend.

In den vorhandenen CI-Browserpfad eingebunden, ohne Regressionskatalog oder seine 899 Pflichtfälle zu ändern. 160 Browserfälle der Modellspannen prüfen zusätzlich Spuren-/große Werte, alle Windeinheiten, gemeinsame Temperaturskalen, echte Mediane, fehlende Werte und Überlappungen. Die lokale Prüfumgebung wurde während der Integration unerreichbar; der gesicherte identische Browservertrag ist deshalb im serverseitigen Source-Gate verpflichtend. Eine Freigabe erfolgt erst nach dessen Erfolg.

Zwischenstand 9e3176f wurde wegen realer Tablet-Beschneidung, CSS-Budgetüberschreitung und zwei stale Klassenpins nicht promoted. Kein korrekter Grenzwert oder Test abgeschwächt.

## Zusätzliche Source-Prüfung

Source-Gate 37032094709 führte den vollständigen Browservertrag aus und blockierte korrekt: bei 1024 px wurde ein Temperaturfeld in der 7d-Tageskarte abgeschnitten. Im vertrauenswürdigen Integrationsstand reserviert die Tablet-Spalte deshalb 114 statt 86 px für das gemeinsame Wertepaar. Die Desktop-Temperaturspalte erhält ebenfalls 114 px; ihre zusätzliche Breite wird innerhalb der bestehenden Gesamtsumme aus der Datumsspalte übertragen. Keine Werte, Einheiten, Mediane oder Budget-/Clipping-Grenzen geändert. Die Browserprüfung meldet bei Fehlern zusätzlich Ansicht/Theme/Windeinheit und konkretes Feld; alle 96 Fälle bleiben verpflichtend. Erneute Source-Freigabe erforderlich. Die nächste vollständige Prüfung (37033482052) blockierte weiterhin das konkrete Tmin-Label bei 1024 px. Beschriftung und Zahl standen im bestehenden Badge in derselben Flexzeile. Der Integrationsstand ordnet beide innerhalb jedes Badges in einer Spalte an (Beschriftung über Zahl), mit natürlicher Höhe/Breite und erhaltenen Farben. Der eng begrenzte Forecast-Selektor liegt im bereits zum Forecast geladenen Stylesheet; die Hauptbundle-Grenze bleibt unverändert. Sichtbarkeits-/Clipping-Bedingungen bleiben identisch, zusätzliche Diagnostik nennt Schriftgröße und begrenzende Vorfahren.

## Veröffentlichung

Vertrauenswürdiger Integrationsbranch codex/v0.9.85.145-distinct-forecast-layouts, PR #229. Ausschließlich Source-PR-Gate → kontrollierter Release Bot → serverseitiges Releasepaket → Installer/Worker/Pages → geprüfte Stable-Promotion. Kein lokaler ZIP-/dist-Transport und keine direkte Produktions-/Stable-Promotion.

Der bestehende optionale Vitest-CI-Pilot scheitert bereits vor Teststart an npm edgesOut, auch in .143/.144. Die fünf lokalen Unit-Tests samt Coverage bestanden im vorangegangenen C12-Stand. Keine Release-/Testsicherung geändert.
