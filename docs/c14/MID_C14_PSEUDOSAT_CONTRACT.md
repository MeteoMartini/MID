# MID C14 · Kartenvertrag Satellit → Pseudo-Satellit

## Ziel

Die Kartenzeitachse soll perspektivisch ohne harten Ansichtswechsel von bestätigten Satellitenbeobachtungen in modellbasierte Pseudo-Satellitenbilder übergehen können.

## Fachliche Grenzen

- Beobachtung bleibt Beobachtung; modellgenerierte Zukunftsbilder werden ausdrücklich als `Modell · Pseudo-Satellit` gekennzeichnet.
- Die Quelle wechselt auf derselben Zeitachse sichtbar am ersten Modelltermin. Der Quellenwechsel darf nicht durch ein neutrales `Satellit`-Label verschleiert werden.
- Es werden ausschließlich reale, bestätigte Zeitpunkte eines angebundenen Modellprodukts verwendet. MID erfindet keine Zwischenbilder, keine künstliche Satellitenbeobachtung und keine zeitliche Interpolation über größere Produktlücken.
- Das letzte reale Satellitenbild darf bei einem kleinen zeitlichen Abstand kontrolliert ausblenden; das erste Pseudo-Satellitenbild darf einblenden. Der Blend ist rein visuell und ändert nicht den fachlichen Zeitstempel.
- Nowcast- und Modellphasen bleiben unabhängig von Satellitenprodukten gekennzeichnet. Pseudo-Satellit ersetzt keinen Radar-/Nowcast-Niederschlag.
- Produkt-, Modelllauf-, Gültigkeitszeit- und Quellenmetadaten müssen im Info-Bereich abrufbar bleiben.

## Architekturstand v0.9.85.34

`CompositeTimelineContract.phaseSources` kann Beobachtung, Nowcast und Forecast verschiedene Quellenbezeichnungen zuweisen, ohne die gemeinsame bestätigte Zeitachse aufzubrechen. Die tatsächliche Pseudo-Satellitenquelle wird erst angebunden, wenn ein wissenschaftlich geeigneter numerischer Produktpfad verfügbar und fachlich geprüft ist.

## Phase A · MID v0.9.85.276

Optionales, als schematisch gekennzeichnetes „Modell-Wolkenbild“ aus realen paarigen DWD CLCT/WW-Rasterwerten. Dies ist weder eine Satellitenmessung noch eine physikalische VIS-/IR-Simulation. Die gemeinsame Beobachtung→Pseudo-Satelliten-Zeitachse bleibt ausdrücklich erst Phase B; es werden dafür keine Beobachtungs- oder Prognosezeitpunkte erfunden. Wetterfarbklassen, fehlende Werte und Modelleignung bleiben unter dem bisherigen Vertrag geschützt.

## Phase B · Geprüfte Kartenzeitachse und Druckkonturen

Das Modell-Wolkenbild wird in der gemeinsamen Karte nur an expliziten Prognose-Frames dargestellt; an tatsächlichen Beobachtungs- oder Nowcastterminen bleibt dieses Overlay ausgeblendet. Die vorhandenen Satelliten-/Radarprodukte behalten eigene zeitgebundene Provenienz. Die Auswahl „Satellit“ bleibt bewusst beim Nutzer, keine heimliche Aktivierung von Beobachtungs-Layern. Modellbilder sind keine Satellitenradiometrie. Es werden weder künstliche Beobachtungen erzeugt noch WMO-Kategorien oder Zeiten interpoliert.

Optional zuschaltbare Isobaren (MSLP/hPa) werden aus dem geprüften Druckkonturfeld des jeweils gewählten Modells ICON-D2, ICON-EU oder ICON Global mit exakt gleichem Modelllauf und gleicher Gültigkeitszeit angezeigt. Modelle ohne eigene bestätigte Druckkonturen (aktuell GDPS) erhalten keine vermischten oder erfundenen Linien. Deaktiviert bzw. fehlende Konturen werden weder gezeichnet noch in den Export geschrieben. Native- und gemeinsame Kartenansicht verwenden dieselbe gespeicherte Einstellung. Exportierte Isobaren werden als Modellkonturen ausgewiesen.

## MID .428 · alleinige Modell-Wolkenansicht und Feld-Warmstart

Die ausdrücklich gewählte schematische Pseudo-Satellitenansicht ist nun der einzige numerische Wolken-/Wetterrenderpfad. ECCC-WMS bleibt als Anbieteroriginal kenntlich und erzeugt ohne geprüftes WW-Gitter keine Zeichen. Neue Wetterzeichen sind schematische Interpretationen des geprüften Original-Modellcodes, keine amtlichen Stations-SYNOP-Zeichen. Quelle, Modelllauf und Termin bleiben gleich; Code-, Mengen- oder Warnlogik ändert sich nicht. UI und SVG-/PNG-Exporter nutzen denselben Zeichenrenderer und dieselben Legendenrepräsentanten; Dichte folgt der jeweiligen Darstellungsgröße.

Cache speichert ausschließlich vollständige SHA-/Byte-geprüfte Originalfelder, niemals Pointer oder NoData. Jeder Einstieg und Runtime-Resume muss zuerst den aktuellen no-store-Pointer/Katalog zulassen. Danach bleiben Decoder und Modell-/Run-/Time-/Rastervalidatoren verpflichtend. 20min Cachealter, keine Zukunftszeitstempel, je Objekt höchstens12MiB, RAM und CacheStorage jeweils höchstens24MiB/18Objekte; gemeinsame Abrufe dürfen einzelne Verbraucher unabhängig abbrechen. Offline ohne zugelassenen aktuellen Katalog gibt es keine neue Kartenfreigabe aus dem Bytecache.


## MID-Karten 1.8 · Satellitenähnlicher Grauwertkontrast im Kartenbereich und Umfeldwetter (16.11.2026)

Die bisherige schematische Original-`CLCT`/`WW`-Wolkendarstellung nutzt einen hellen, beige-/blaugetönten Hintergrund. Das unterscheidet sie deutlich von professionellen Meteosat-Infrarotansichten (dunkle warmstrahlende Oberflächen, helle kalte Wolkenoberseiten). Eine realistische IR-Wolkenstruktur kann aus `CLCT` allein **nicht** berechnet werden: `CLCT` ist ein Flächenbedeckungsgrad, keine gemessene/synthetisch simulierte Infrarot-Helligkeitstemperatur. EUMETSAT-Referenz: https://training.tools.eumetsat.int/asmet/asmet10/en/comet/asmet/asmet10/navmenu.php_tab_1_page_2_2_0_type_flash.htm ; ICON-RTTOV-SynSat-Dokumentation: https://docs.icon-model.org/2026.10/documentation/buildrun/buildrun_namelist_overview.html .

**Eng abgegrenzte, verlustfreie UI-Darstellungsänderung:** Die bestehende `cloudWeatherPixel(...,'pseudo')`-Funktion bleibt die einzige schematische Modellwolkenquelle in Hauptkarte, Umfeldwetter und Export. Ihre Grauwert-Palette ist jetzt **neutral** (kein Blaufarbstich); Original-CLCT-Werte werden per über alle Quellen, Modelle und Termine identischer, monotoner *display-only* Deckungskurve in eine helle Graufläche mit transparenter partieller Bedeckung auf dunkelgrauer Basiskarte übersetzt. Die Transformation simuliert **keine** Subrasterwolken, Top-Höhe, Lichtstreuung oder künstliche animierte Zwischenframes. Nullwolken und nicht nachgewiesene Werte bleiben beim Wolkenlayer transparent. Der Overlay-Code `WW`/WMO-4677 bleibt kategorial, ohne Glättung/Interpolation, mit bereits etablierten Wetterfarben und Quellenhinweis.

**Gemeinsamer Basemap-Vertrag:** `PSEUDO_SAT_BASEMAP` enthält die zentralen, dezent differenzierten neutralen Grauwerte für Land, Vegetation und Wasser. `UnifiedVectorBasemap` verwendet diese nur bei `cloudContrast=true` – konsistent in Light/Dark – und verändert reale Radar-/Satellitenbeobachtungen **nicht**. `CurrentSurroundings` setzt `cloudContrast` genau für `mode==='cloud'` **mit tatsächlich geladenem verifiziertem Bild**, wie der Kartenbereich den Kontrast erst nach Quellbereitschaft nutzt. Keine neue OpenFreeMap-Kachel, Fremdquelle, Anfrage oder Overlaysteuerung. Orts-/Stadtmarkierungen und die vorhandenen Kartenreferenzen bleiben oberhalb; Kontrast und WCAG-Anwendbarkeit sind durch echte Browser- und Geräteprüfungen zu überprüfen.

Die SVG-/PNG-Exportkarte bleibt farb-/Geografie-identisch, einschließlich neutraler Legende. Es werden keine `CLCT`-/`WW`-Provenienzen, Modellläufe, Gültigkeitszeiten, 15-min-NoData-Regeln, Warnungen, WMS-Produkte oder nativen IR10.8-Shadow-Gates verändert. Erst nach realem 40-GRIB-/ecCodes-IR10.8-Originalnachweis darf die künftig tatsächlich radiometrische Vorschau an die Stelle der nur schematischen `CLCT`-Variante treten; `activationAuthorized=false` für diese IR-Live-Quelle bleibt.
