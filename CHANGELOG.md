# MID v0.7.88.2

- Die mit v0.7.88.1 eingeführte Sprühregen-Plausibilisierung gilt nun konsequent auch für die Wettertexte und Wettersymbole der 7-Tage-Vorhersage, des Widgets und des 14-Tage-Ensemble-Trends.
- Unplausible WMO-Sprühregen-Codes 51–55 werden in Tageszusammenfassungen nicht mehr als „Sprühregen“ weitergereicht, sondern anhand der DWD/WMO-Stundenschwellen als leichter, mäßiger oder starker Regen behandelt.
- Tagesereignisse, Zeitangaben und repräsentative Wettersymbole greifen jetzt auf dieselbe zentralisierte Niederschlagsform-Auswertung wie die Stundenansicht zurück.
- README, Changelog und sämtliche Versionsstellen aktualisiert.
- Cloudflare Worker ohne funktionale Änderung.

# MID v0.7.88.1

- Plausibilitätsprüfung für Open-Meteo-Sprühregen ergänzt: WMO-Codes 51–55 werden nur noch bei hoher relativer Feuchte, ausgeprägter tiefer Bewölkung und schwacher stratiformer Niederschlagsrate als Sprühregen dargestellt.
- Fehlen die typischen Stratus-/Feuchtemerkmale oder ist die Niederschlagsrate zu hoch, wird der Niederschlag als Regen klassifiziert.
- Regenintensitäten werden nach den DWD/WMO-Stundenschwellen als leicht, mäßig, stark oder sehr stark bezeichnet; Sprühregen nutzt seine eigenen DWD-Intensitätsstufen.
- `cloud_cover_low` wird jetzt in der Best-Match-Stundenprognose geladen und zusammen mit relativer Feuchte, Gesamtbewölkung, Schauersignal und Niederschlagsmenge ausgewertet.
- Regressionstests sichern plausiblen Sprühregen und die Umklassifizierung unplausibler Sprühregen-Codes ab.
- Cloudflare Worker ohne funktionale Änderung; Versionsnummer lediglich synchronisiert.

# MID v0.7.87.1

- Release-Pipeline korrigiert: `package-lock.json` enthält keine internen OpenAI-Paketserver mehr; `jsfive` und `pako` werden über die öffentliche npm-Registry bezogen.
- ZIP-Installation und GitHub-Pages-Deployment sind im Installationsworkflow direkt verkettet, weil ein Bot-Commit mit `GITHUB_TOKEN` keinen weiteren Push-Workflow startet.
- Pages-Actions auf `configure-pages@v6`, `upload-pages-artifact@v5` und `deploy-pages@v5` aktualisiert; vorzeitiges Deployment beim reinen ZIP-Upload wird verhindert.
- OPERA-Nutzung erneut gehärtet: Der Worker ermittelt aktuelle CIRRUS-DBZH-Dateien jetzt primär über die offizielle MeteoGate-ORD-API und parallel über den offenen S3-Index.
- Falls beide Verzeichnisdienste ausfallen, bleibt der begrenzte HDF5-Range-Probe-Fallback aktiv. Dadurch hängt OPERA weder allein vom S3-Listing noch von geschätzten Zeitstempeln ab.
- Kompositbild und aktuelle Niederschlagswahrscheinlichkeit verwenden weiterhin denselben validierten HDF5-Rasterpfad; DWD bleibt in Deutschland primär, OPERA ist sichtbare Unterlage und unabhängiger Abgleich.
- OPERA-Regressionstest um den ORD-API-Pfad erweitert.

# MID v0.7.87

- Belastbare erste Ausbaustufe des automatischen Starkregen-/Überflutungsindikators ergänzt: RADOLAN-YW-Summen für 15/30/60/180/360 Minuten, DWD-RV-Nowcast-Summen bis +120 Minuten, KONRAD3D-Starkregenflag und Zellzug, KOSTRA-DWD-2020-Einordnung für 30/60/360 Minuten sowie DWD-Stationsabgleich.
- Die Starkregenkarte erscheint ausschließlich bei einem tatsächlichen Mess-, Nowcast-, KONRAD-, KOSTRA- oder nahen Stationssignal und bleibt vollständig von amtlichen Warnungen getrennt.
- OPERA-CIRRUS-Georeferenzierung korrigiert: Das offizielle LAEA-Raster verwendet eine Oberkante von y=0 m und den negativen Projektionsursprung y_0=-2.100.000 m. Die frühere Ersatzgeometrie verschob Standortabfragen um 4.400 km und führte dadurch zu NoData.
- Das Kompositbild deklariert OPERA erst nach erfolgreichem Download, HDF5-Dekodierung und realer Standortabdeckungsprüfung als bereit. OPERA wird als europäische Unterlage dargestellt, DWD liegt in Deutschland darüber.
- Die aktuelle Niederschlagswahrscheinlichkeit prüft DWD und OPERA parallel. DWD bleibt in Deutschland primär; OPERA dient als unabhängiger Abgleich und übernimmt bei DWD-Ausfall. RainViewer bleibt der letzte Fallback.
- OPERA-Bereitschaft, Datenstand und Fehlergrund werden im Infodialog des Kompositbildes ausgewiesen.

# MID v0.7.86.1

- Fehler im isolierten Ensemble-Nullability-Regressionstest behoben: Der Test verwendet nun eine eigene temporäre TypeScript-Konfiguration mit `moduleResolution: Bundler`, `skipLibCheck: true` und leerer `types`-Liste.
- Dadurch werden bei der kleinen Testdatei keine projektexternen Ambient-Typdefinitionen aus `node_modules/@types` mehr unnötig mitkompiliert.
- Die im GitHub-Lauf gemeldeten TS2792-Fehler zu `@babel/parser`, `@babel/types` und `csstype` treten nicht mehr auf; der eigentliche strikte Nullability-Test bleibt erhalten.
- Keine funktionale Änderung an Wetterdarstellung oder Cloudflare Worker.

# MID v0.7.86

- Ausführliche Quellen-, Produkt-, Auflösungs-, Zeit-, Alters-, Status- und Lizenzangaben des Kompositbildes in einen barrierefrei beschrifteten Infodialog verschoben.
- OPERA-CIRRUS-Erkennung korrigiert: Der Worker liest nun die tatsächlich vorhandenen DBZH-HDF5-Objekte aus dem offiziellen S3-Index, statt Zeitstempel zu erraten.
- Nur real vorhandene OPERA-Frames werden an Karte und aktuelle Niederschlagswahrscheinlichkeit übergeben; bei einem nicht verfügbaren Index folgt ein kontrollierter Range-Probe-Fallback.
- OPERA-Dateiproxy verwendet validierte Objektschlüssel und liefert Diagnoseheader für Quelle, Produkt, Schlüssel und Worker-Version.
- Regressionstest für Infodialog, reale OPERA-Objektliste, fehlertolerante Erkennung und CORS-HDF5-Proxy erweitert.

# MID v0.7.85

- Z-Zeit unter dem Ortsnamen einheitlich als `hhmmZ` ohne Doppelpunkt dargestellt.
- Separate Gewitterinformation neben der aktuellen Niederschlagswahrscheinlichkeit ergänzt.
- DWD KONRAD3D wird fünfminütig für Zellposition, Zugrichtung, Schweregrad, Trend, Blitzrate, Hagel-, Starkregen- und Böenflags ausgewertet.
- Amtliche DWD-WFS/CAP-Gewitterwarnungen haben Vorrang; Radar, Best-Match und Stationsniederschlag dienen ergänzend der Plausibilisierung.
- Neue Workerroute `thunderstorm-nowcast` und Regressionstest ergänzt.

# MID v0.7.84.1

- GitHub-Buildfehler TS18048 im OPERA-Rasteroverlay behoben.
- Statt des optional typisierten `pixelBounds.min` verwendet die Darstellung nun Leaflets eindeutig typisierten Karten-Pixelursprung.
- Regressionstest verhindert die erneute Verwendung des optionalen Bounds-Minimums.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.84

- Phase 1 der europäischen Radarintegration auf Basis von MID v0.7.83.3 umgesetzt.
- Das Kompositbild lädt das echte EUMETNET-OPERA-CIRRUS-DBZH-Komposit als ODIM-HDF5-Raster mit 1 km Rasterweite und fünfminütigem Produktzyklus.
- Radarpriorität vereinheitlicht: DWD-HX/PX250 beziehungsweise DWD-RV → OPERA CIRRUS → RainViewer als letzter Fallback.
- Die frühere OPERA-Punkt-/Stützstellenauswertung wurde vollständig entfernt.
- Karte und aktuelle Niederschlagswahrscheinlichkeit verwenden denselben OPERA-Rasterdecoder; Standortpixel und 30-km-Umfeld fließen in die Radar-/Best-Match-Kombination ein.
- Neue Worker-Routen `opera-raster-meta` und `opera-raster-file` liefern validierte Metadaten und CORS-sichere HDF5-Dateien.
- Regressionstest für OPERA-Raster, Quellenreihenfolge und Entfernung der Altlogik ergänzt.

# MID v0.7.83.3

- Achsentick-Beschriftungen im Ensemble-Temperaturdiagramm vertikal korrigiert.
- Die zusätzliche CSS-Baseline `dominant-baseline: hanging`, die X- und Y-Achsenwerte leicht nach unten verschob, wurde entfernt.
- Recharts übernimmt wieder die vorgesehene mittige Standardausrichtung der Tickwerte.
- Regressionstest für die Achsenausrichtung ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.83.2

- GitHub-Actions-Warnung zur erzwungenen Node.js-24-Ausführung entfernt: `actions/checkout` und `actions/setup-node` wurden in Installations- und Deployment-Workflow von v4 auf v6 aktualisiert.
- Der Installer-Workflow ist zusätzlich als Wiederherstellungs-/Referenzkopie Bestandteil des vollständigen MID-Projekts.
- Regressionstest verhindert künftig die erneute Verwendung der Node-20-basierten Action-Versionen v1 bis v4.
- Das Projekt selbst wird weiterhin bewusst mit Node.js 22 gebaut; geändert wurde ausschließlich die interne Laufzeit der GitHub-Actions-Bausteine.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.83.1

- GitHub-Buildfehler in `src/EnsemblePanel.tsx` behoben: optionale Klimawerte werden vor der Formatierung gemeinsam als endliche Zahlen eingegrenzt.
- Die Temperatur-Skalierung filtert `number | undefined` nun über einen echten TypeScript-Type-Guard statt über einen unzulässigen `number`-Callback.
- Eine leere optionale Klimareihe fällt für die Skalenberechnung sicher auf die Best-Match-Werte zurück.
- Strikter Regressionstest für die Ensemble-Nullability ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.83

- Warnfreie Tage werden in der 7-Tage-Vorhersage kompakt als „Keine Hazards“ gekennzeichnet.
- Sonnenscheindauer, Prognosekonsistenz und Best-Match-Hazards verwenden im Ensemble-Tooltip einen einheitlichen Abschnittsaufbau.
- Gemeinsame Popover- und Diagrammhilfen reduzieren redundante Listener und doppelte Skalenlogik.
- Ensemble-Diagramm- und Tooltip-Daten wurden stärker typisiert; stabile React-Schlüssel und ein automatischer CodeCheck wurden ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.82.2

- Die 7-Tage-Vorhersage zeigt an warnfreien Tagen wieder einen dezenten Hinweis „Keine Warnhinweise“.
- Best-Match-Hazards ab interner Intensitätsstufe 2 erscheinen im Ensemble-Temperaturtrend wieder als kompakte, farbcodierte Piktogramme direkt oberhalb des Sonnenschein-/Bewölkungsbands; die vollständigen Angaben bleiben im Tages-Tooltip.
- Schriftart und Textfarben des Ensemble-Temperatur-Tooltips wurden vereinheitlicht.
- Aus sämtlichen automatisch erzeugten Warntexten und Windschwellen-Tooltips wurden ausgeschriebene Hinweise auf DWD-Warnstufen entfernt; die interne Farbcodierung und Schwellenlogik bleiben unverändert.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.82.1

- Die ausgeschriebene Bezeichnung zeigt die Anfangsbuchstaben **M**, **I** und **D** innerhalb von „Meteorological Information Dashboard“ fett.
- Das Rückfallsystem versucht eine neuere, vollständig gecachte MID-Version nun automatisch erneut; die Rückfallleiste verschwindet beim manuellen erneuten Test sofort und bleibt nicht dauerhaft an einer älteren Version hängen.
- Warnfelder der 7-Tage-Vorhersage zeigen nur noch den prognostizierten Wert in der gewählten Einheit, ohne zusätzliche Umrechnung oder Beaufortangabe; der vollständige Warntext bleibt im Tooltip.
- Best-Match-Warnhinweise ab Warnstufe 2 wurden im Ensemble-Temperaturtrend aus der Diagrammfläche entfernt und platzsparend in den Tages-Tooltip integriert.
- Im Detaildiagramm besitzt die Niederschlagswahrscheinlichkeit eine unabhängige rechte 0-/50-/100-%-Achse. Niederschlagsbalken werden an den Plotgrenzen beschnitten und können die rechte Achse nicht mehr überdecken.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.82

- Warntexte und kompakte Hazardwerte verwenden die gewählte Windeinheit; bei kt, m/s oder mph wird der km/h-Wert ergänzt, bei km/h die Beaufortstärke.
- Warntexte zeigen prognostizierte Temperaturen und Mengen ausschließlich als ganze Werte ohne Dezimalkomma.
- Die 7-Tage-Vorhersage zeigt ab DWD-Warnstufe 1 nur noch kompakte, stufenfarbige Symbole mit erwartetem Wert; die ausführliche Erläuterung bleibt im Tooltip.
- Best-Match-Warnmarker wurden aus dem stündlichen Detaildiagramm entfernt. Die dezenten Windwarnflächen und horizontalen DWD-Schwellenlinien bleiben bestehen.
- Im Ensemble-Temperaturtrend erscheinen oberhalb des Sonnenschein-/Bewölkungsbands stufenfarbige Best-Match-Hazards ab Warnstufe 2.
- Allgemeine Best-Match-Gefahrenkarten verwenden dieselbe ganzzahlige und einheitenbewusste Warntextformatierung.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.81.1

- DWD-Warnstufe 1 in der zentralen Best-Match-Auswertung ergänzt und fachlich korrigiert.
- Windböen werden ab Überschreiten von 50 km/h als Stufe 1 erkannt; der Windbereich besitzt nun zusätzlich die gelbe Schraffur und Trennlinie zwischen 50 und 65 km/h.
- Einfache Gewitter, leichter Schneefall, Glätte bei Niederschlag und Frost, Frost unter 0 °C bis 800 m, Nebel unter 150 m Sichtweite und starke Wärmebelastung über etwa 32 °C bei geringer Abkühlung werden als Stufe 1 berücksichtigt.
- Die kompakte Warnsymbolzeile oberhalb des Sonnenschein-/Bewölkungsbands zeigt gemäß Vorgabe weiterhin ausschließlich Stufen 2 bis 4; Stufe 1 fließt in die allgemeine 24-Stunden-Gefahrenauswertung und Windskalierung ein.
- UV-Warnstufe 1 wird nicht künstlich aus dem UVI allein erzeugt, weil das DWD-Kriterium zusätzlich eine regionale beziehungsweise klimatologische Abweichung verlangt.
- Regressionstests um sämtliche automatisch ableitbaren Stufe-1-Kriterien und die Filterung der Symbolzeile erweitert.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.81

- Best-Match-basierte Warnhinweise wurden in beiden Modi als eigene Symbolzeile unmittelbar oberhalb des Sonnenschein-/Bewölkungsbands ergänzt.
- Es werden ausschließlich modellseitig überschrittene DWD-Warnstufen 2 bis 4 dargestellt; Ereignisart, Warnfarbe und Stufennummer sind direkt unterscheidbar.
- Warnmarker fassen zusammenhängende Zeiträume zusammen und öffnen per Klick, Tippen oder Tastatur einen kurzen Tooltip; sie sind ausdrücklich keine amtlichen Warnungen.
- DWD-Warnkriterien für Wind, Gewitter, Stark- und Dauerregen, Schneefall, Schneeverwehung, markante Glätte/Glatteis, strengen Frost und extreme Wärmebelastung zentralisiert.
- Windwarnbereiche auf die offiziellen Schwellen 65, 90, 105, 120 und über 140 km/h umgestellt; jede neue Schwelle wird zusätzlich durch eine dezente horizontale Linie markiert.
- Automatische Hazard-Karten und Tagesindikatoren verwenden dieselbe zentrale DWD-Logik und keine bisherigen Mischschwellen aus DWD, Meteoalarm und NWS mehr.
- Regressionstest für DWD-Schwellen, Warnmarker, Intensitäten, Tooltips und horizontale Schwellenlinien ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.80

- Im Windbereich der erweiterten stündlichen Detailansicht werden die vorhandenen DWD-/Meteoalarm-Warnschwellen ab 50, 75, 89 und 103 km/h als dezente gelbe, orangefarbene, rote und violette Schraffurbereiche dargestellt.
- Die Warnflächen werden ausschließlich innerhalb des tatsächlich sichtbaren Windbereichs gezeichnet und liegen hinter Wind-, Böen- und Richtungselementen.
- Meteogramm und Widget-/PNG-Generator besitzen keine eigene zweite Ein-/Ausklappsteuerung mehr; beide werden ausschließlich über den jeweiligen äußeren Modulschalter geöffnet und geschlossen.
- Beim Schließen der Module werden die enthaltenen Komponenten weiterhin ausgehängt und laufende Meteogrammabrufe abgebrochen.
- Regressionstest für Windwarnflächen und eindeutige Modulsteuerung ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.79.3

- Die Zahl der Wetterpiktogramme in der stündlichen Detailansicht wird nun aus der tatsächlich verfügbaren Diagrammbreite bestimmt und bis zur konfliktfrei möglichen Höchstzahl erhöht.
- Auf breiten Tablet- und Desktopansichten können alle stündlichen Piktogramme erscheinen; auf schmaleren Displays werden sie gleichmäßig über den Tag verteilt.
- Der bisher sehr großzügige feste Mindestabstand wurde durch eine an Symbolgröße und Ansichtsbreite angepasste Verteilung ersetzt.
- Cloudflare Worker ohne funktionale Änderung; nur Versionssynchronisierung.

# MID v0.7.79.2

- In beiden Ansichtsmodi folgt der Kopfbereich der stündlichen Detailansicht nun der Reihenfolge: JETZT-Zeitmarkierung, Wetterpiktogramme, Sonnenschein-/Bewölkungsband, eigentliche Diagrammfläche.
- Die blaue Markierung des ausgewählten Zeitschritts reicht jetzt bis in die Piktogramm-Lane und wird hinter den Wetterpiktogrammen gezeichnet, damit diese lesbar bleiben.
- Vertikale Abstände und Diagrammhöhe wurden für schmale und breite Ansichten gemeinsam angepasst.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.79.1

- In der stündlichen Detailansicht wurden Wetterpiktogramme und Sonnenschein-/Bewölkungsband vertikal getauscht: Die Piktogramme stehen nun oben, das Band direkt darunter.
- Abstände zur Jetzt-Zeitmarkierung und zur eigentlichen Diagrammfläche wurden entsprechend angepasst, damit alle Elemente weiterhin getrennt bleiben.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.79

- Im Erweiterten Modus zeigt die Ortszeile nun die aktuelle Ortszeit mit GMT-Abweichung und zusätzlich die Z-Zeit in Klammern; die einzeilige Darstellung passt ihre Schriftgröße responsiv an.
- Erklärungen der stündlichen Detailansicht, der 14-Tage-Ensemble-Übersicht sowie der Temperatur- und Niederschlagsdiagramme wurden auch im Erweiterten Modus in dezente, bei Außenklick schließbare Info-Popover verschoben.
- P10–P90-Fehlerbalken im Ensemble-Niederschlagsdiagramm werden unabhängig vom Best-Match-Wert exakt zwischen P10 und P90 gezeichnet.
- Oberen Bereich der Detailansicht in getrennte Ebenen für Sonnenschein-/Bewölkungsband, Wetterpiktogramme und aktuelle Uhrzeit gegliedert, damit keine Überdeckungen entstehen.
- Temperatur-, Niederschlags- und Windachsen verwenden nun möglichst glatte, an runden Schrittweiten ausgerichtete Werte.
- Dichte der Windrichtungspfeile wird anhand der tatsächlich verfügbaren Diagrammbreite automatisch maximiert, ohne benachbarte Pfeile zu überdecken.
- Regressionstests für Z-Zeit, Info-Popover, exakte P10–P90-Spanne, adaptive Kopfleiste, Achsenskalierung und Windpfeildichte ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.78.1

- TypeScript-Buildfehler TS2367 in der Niederschlagsdarstellung der erweiterten Detailansicht behoben.
- Den Niederschlagstyp `none` vor der Verwendung des engeren `DetailPrecipType` jetzt über einen expliziten Type-Guard ausgeschlossen.
- Dieselbe typsichere Prüfung wird auch für die dynamische Niederschlagsskala verwendet.
- Regressionstest erweitert, damit die fehlerhafte Kombination aus Exclude-Typcast und anschließendem `none`-Vergleich nicht erneut eingeführt wird.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.78

- Open-Meteo-Modellkatalog um CHMI ALADIN Seamless, ALADIN Mitteleuropa 2,3 km und ALADIN Tschechien 1 km ergänzt, damit aktuelle Modellstände im Best-Match-Status korrekt benannt werden.
- Die jüngsten serverseitigen Open-Meteo-Korrekturen für ECMWF-Solarinterpolation, AIGEFS-Abruf und GFS-Niederschlags-Deakkumulation werden automatisch über die bestehenden APIs genutzt; hierfür ist keine eigene MID-Datenumrechnung erforderlich.
- Im Erweiterten Modus lassen sich Temperatur, gefühlte Temperatur, Taupunkt, einzelne Niederschlagsarten, Niederschlagswahrscheinlichkeit, Wind, Böen und Windrichtung unmittelbar über die Legende ein- und ausblenden.
- Taupunkt als zurückhaltende Linie ergänzt; unter dem Niederschlagsbereich erscheinen Wind und Böen sowie darunter Richtungspfeile.
- Nicht mehr benötigte Temperatur-, Niederschlags- und Windbereiche werden dynamisch entfernt. Das SVG passt ViewBox und Höhe per ResizeObserver an Hoch-/Querformat und verfügbare Bildschirmbreite an, ohne die Darstellung zu verzerren.
- Legendenmuster der gefühlten Temperatur in Standard- und Erweitertem Modus an die gestrichelte Diagrammlinie angeglichen.
- Auswahl der erweiterten Detailparameter wird lokal gespeichert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.77.1

- Beschriftung der gelb-grauen Sonnenschein-/Bewölkungslegende in allen Farbdesigns mit einer festen dunklen Schriftfarbe lesbar gemacht.
- Deutsche Wortstellung bei später einsetzenden Schauern korrigiert, z. B. `Stark bewölkt, abends Schauer` statt `Stark bewölkt, Schauer abends`.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.77

- Widget-/PNG-Generator und Druckniveau-Meteogramm stehen ausschließlich im Erweiterten Modus zur Verfügung.
- Quellen bleiben in beiden Modi über die Fußzeilen-Schaltfläche `Quellen` erreichbar und öffnen sich als bei Außenklick, Touch oder Escape schließbares Popover.
- Beim erstmaligen Öffnen des Standardmodus werden die stündliche Detailansicht sowie alle nachfolgenden einklappbaren Module geschlossen initialisiert.
- Bestehende Modulzustände bleiben nach der Erstinitialisierung weiterhin lokal gespeichert.
- Der Zusatz `Ortsname aus Geodatenbank` wurde in beiden Ansichtsmodi entfernt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.76

- Modellstände-Popover in Best-Match- und Ensemble-Bereichen schließen nun zuverlässig bei Klick oder Tippen außerhalb sowie mit Escape.
- Bisherigen Kompaktmodus in `Standardmodus` umbenannt und als Erststartmodus festgelegt; bestehende Compact-Einstellungen werden automatisch übernommen.
- Bisherigen Vollständig-Modus durch den `Erweiterten Modus` ersetzt. Dieser verwendet weiterhin einklappbare Module, ergänzt jedoch meteorologische und technische Hintergründe direkt in der Oberfläche.
- Im Standardmodus werden ausgewählte Bedien- und Datenerklärungen über dezente Info-Schaltflächen geöffnet und bei Außenklick, Touch oder Escape wieder geschlossen.
- Ausführliche Stationsanalyse, Ensemble-Methodik, Bedienhinweise und lange technische Quellen-/Haftungserklärungen werden im erweiterten Modus direkt angezeigt.
- Alte gespeicherte Vollansicht wird automatisch in den erweiterten Modus migriert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.75

- Dezente Tagespfeile der stündlichen Detailansicht stehen nun auf Handy, Tablet im Hoch- und Querformat sowie Desktop dauerhaft bereit.
- Die Pfeile bleiben responsiv: Auf kleinen Smartphones nur als Symbole, auf größeren Displays zusätzlich mit abgekürztem Wochentag.
- Neu angelegte Favoriten werden nicht mehr vorne einsortiert, sondern am Ende der bestehenden Reihenfolge ergänzt.
- Auch importierte, bisher noch nicht vorhandene Favoriten werden hinter den vorhandenen Einträgen angefügt; die Reihenfolge innerhalb des Imports bleibt erhalten.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.74

- Favoriten-Schnellleiste platzsparend als eigene zweite Reihe unter der Kopfleiste reaktiviert.
- Aktuelle Position und alle gespeicherten Favoriten sind wieder direkt auswählbar; aktiver Ort, Standardort, Gruppe sowie Berg-/Ski- und Wassersportprofile bleiben erkennbar.
- Reihenfolge lässt sich unmittelbar in der Schnellleiste per Maus-Drag&Drop und auf Touchgeräten über den Griff verschieben; die neue Reihenfolge wird wie bisher lokal gespeichert.
- Das kleine Verwaltungssymbol öffnet direkt den Favoriten-Unterbereich der zentralen Einstellungen. Umbenennen, Gruppen, Regeln, Import/Export, Standardort und Profile bleiben ausschließlich dort.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.73

- Ensemble-Temperaturtooltip horizontal wieder an Diagramm und Viewport begrenzt; am rechten beziehungsweise linken Rand wechselt die Position automatisch zur sichtbaren Seite.
- METAR-Wolkenhöhe fachlich differenziert: `Ceiling` erscheint nur bei mindestens 5/8 Bewölkung aus BKN/OVC/VV, bei 1/8 bis 4/8 wird die niedrigste FEW-/SCT-Lage als `Wolkenuntergrenze` in hft angezeigt.
- Hyperlokale Stationsanalyse um die separate Wolkenuntergrenze erweitert, ohne aus dünner Bewölkung fälschlich eine Ceiling abzuleiten.
- Stündliche Detailansicht auf Handy und Tablet um dezente Randtasten für den tageweisen Wechsel ergänzt; die gewählte Uhrzeit wird beim Tageswechsel beibehalten.
- Konsistenzpunkte im mobilen 14-Tage-Ensemble-Trend reagieren nun beim ersten Tippen. Hover wird ausschließlich auf Geräten mit echter Maus-/Trackpad-Hoverfunktion verwendet.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.72

- Zentrales Einstellungsmenü ergänzt und die bisher verteilten Kopfbereichsregler dort logisch zusammengeführt.
- Ansichtsoptionen, Farbdesign (Auto/Hell/Dunkel), Windeinheit, Favoritenverwaltung und MID-Systemstatus besitzen eigene Unterbereiche.
- Favoritenverwaltung vollständig als Untermenü eingebettet; Gruppen, Reihenfolge, Standardort, Import/Export sowie Berg-/Ski- und Wassersportprofile bleiben erhalten.
- Permanenten Favoritenstreifen sowie direkte Ansicht-, Design-, Einheiten- und Systemstatusregler aus dem Kopfbereich entfernt. Favoriten bleiben über die Ortssuche schnell erreichbar.
- Kopfbereich auf allen Plattformen auf Ortssuche, Standort, Einstellungen und Neuladen reduziert; responsive Vollbilddarstellung des Einstellungsmenüs auf Mobilgeräten ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.71

- Update-System grundlegend erweitert: Eine neue Version wird vor der Aktivierung vollständig in einen eigenen App-Shell-Cache geladen, einschließlich der tatsächlich im produktiven `index.html` referenzierten JavaScript- und CSS-Dateien.
- Die zuletzt geprüfte Vorversion bleibt erhalten. Schlägt der Start der neuen App fehl und wird innerhalb von 20 Sekunden keine Laufzeit-Gesundheitsmeldung gesendet, schaltet MID automatisch auf die vorherige Version zurück.
- Manuelle Systemverwaltung ergänzt: App-/Worker-/aktive Version anzeigen, MID-Cache neu aufbauen, vorherige Version wiederherstellen und Service Worker samt App-Caches zurücksetzen. Favoriten und Einstellungen bleiben beim Reset erhalten.
- Rückfallversion erhält eine feste Wiederherstellungsleiste, über die die aktuelle Version erneut getestet werden kann.
- Datenabrufe entkoppelt: Best Match, Stationsanalyse, Luftqualität, Radar, amtliche Warnungen und Modellinformationen verwenden getrennte AbortController und blockieren einander nicht.
- Ensemble und Klimatologie laden unabhängig voneinander. Ortswechsel, manuelles Neuladen und Ansichtswechsel brechen veraltete Requests ab, damit alte Ergebnisse keinen neuen Standort überschreiben.
- Such-, Meteogramm- und PX250-Metadatenabrufe zusätzlich gegen überholte Antworten und weiterlaufende Netzwerkzugriffe abgesichert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionssynchronisierung.

# MID v0.7.70.4

- Weltweiten NOAA-AviationWeather-/METAR-Abruf korrigiert: Die geografische Bounding-Box wird entsprechend der aktuellen API-Reihenfolge als Breitengrad/Längengrad übergeben.
- METAR-Zeitfenster auf drei Stunden erweitert und internationale Suchweite außerhalb Deutschlands von 140 auf 220 km erhöht.
- Mehrfachmeldungen derselben ICAO-Station werden auf die jeweils neueste Beobachtung reduziert.
- METAR-Sichtweite wird nun auch über den Worker vollständig an die hyperlokale Analyse weitergereicht.
- Eigener Regressionstest für internationale METAR-Orte ergänzt; funktionale Worker-Änderung, daher Worker vor dem Hauptprojekt bereitstellen.

# MID v0.7.70.3

- Im Ensemble-Niederschlagsdiagramm die getrennten P10-/P90-Kurven durch einen dunkelgrauen P10–P90-Fehlerbalken über dem Best-Match-Niederschlagsbalken ersetzt.
- Fehlerbalken werden nur an Tagen mit Best-Match-Niederschlag angezeigt.

# MID v0.7.70.2

- Mausradnavigation der stündlichen Detailansicht auf die eigentliche SVG-Diagrammfläche begrenzt; Legende, Überschrift, Quickfacts und Stunden-Tooltip scrollen die Seite wieder normal.
- Ursache der ausgefallenen Ensemble-Auswertung behoben: veraltete Open-Meteo-Modellkennungen für Mitgliedsmodelle und Ensemble-Mittel durch die aktuellen API-Kennungen ersetzt.
- Ensemble-Abrufe auf vier parallele Modellanfragen begrenzt und bei HTTP 429/5xx mit kurzen Wiederholungsversuchen abgesichert.
- Ensemble-Mittel-Reserve vollständig auf die aktuellen DWD-, NOAA-, ECMWF-, GEM-, BOM-, UKMO-, MeteoSwiss- und Google-Kennungen aktualisiert.
- Diagnose bei vollständigem Ausfall präzisiert; keine funktionale Worker-Änderung, nur Versionssynchronisierung.

# MID v0.7.70.1

- Ensemble-Diagramm-Tooltip präzisiert: Bei der Sonnenscheindauer heißt der Klammerzusatz nun `P10–P90` statt des unspezifischen Ausdrucks `Bandbreite`.
- Versionsschema auf aufwertungsabhängige Releases umgestellt: Funktionsstände verwenden `0.7.x`, eng begrenzte Wartungsänderungen `0.7.x.y`.
- Versionssynchronisierung, Anzeigeersetzung und Updater-Vergleich für vierteilige Wartungsversionen abgesichert.
- Keine funktionale Worker-Änderung; nur einheitliche Versionssynchronisierung auf `0.7.70.1`.

# MID v0.7.70

- Sichtbare Mess- und Prognosewerte auf einheitliche deutsche Dezimaldarstellung geprüft und erweitert.
- Aktuelle Bewölkung um die METAR-Ceiling in hunderten Fuß über Grund (`hft`) ergänzt; geeignete BKN-, OVC- und VV-Lagen fließen stationsgewichtet in die hyperlokale Analyse ein.
- Desktop-Kacheln der aktuellen Einzelparameter platzsparender angeordnet, sodass bei ausreichender Breite alle Parameter in einer Zeile stehen.
- Cloudflare Worker funktional um strukturierte Wolkenlagen, vertikale Sichtweite und METAR-Rohmeldung erweitert.

# MID v0.7.69

- Sonnenscheindauer in der 7-Tage-Vorhersage und im Ensemble-Tooltip mit maximal einer Nachkommastelle formatiert: volle Stunden erscheinen ohne unnötige Dezimalstelle (`15 h` statt `15,0 h`), Zwischenwerte weiterhin mit deutschem Dezimalkomma.
- Gelb-graue Sonnenscheinlegende im Ensemble-Temperaturdiagramm verkleinert und optisch zurückgenommen, ohne das eigentliche Datenband zu verändern.
- Aktuelle Messwerte um die Karte „Sichtweite“ zwischen Niederschlag und Bewölkung ergänzt.
- Hyperlokale Analyse um Sichtweite erweitert und zugleich Bewölkung sowie Niederschlag in die modellgestützte Restfeldanalyse aufgenommen; Temperatur, Feuchte, Taupunkt, Luftdruck, Wind, Böen, Sichtweite, Bewölkung und Niederschlag nutzen nun alle verfügbaren geeigneten Stationsmessungen.
- Bright-Sky-Sichtweite wird in Metern übernommen; METAR-Sichtweiten werden aus Statute Miles zuverlässig in Meter normalisiert. METAR-Wolkenlagen werden zusätzlich in eine Flächenbedeckung überführt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.67

- Niederschlagsform im stündlichen Detaildiagramm vereinheitlicht: WMO-Wettercode steuert nun Wettertext, Symbol, Balkenmuster, Legende und Stunden-Tooltip konsistent.
- Fehler behoben, durch den reiner Schneefall beziehungsweise Schneeschauer wegen des Wasseräquivalents im Feld `precipitation` fälschlich als Schneeregen oder Schneeregenschauer dargestellt wurde.
- Mischformen werden bei fehlendem geeigneten WMO-Code nur noch dann abgeleitet, wenn gleichzeitig ein messbarer fester und flüssiger Niederschlagsanteil vorliegt.
- Niederschlagsklassifikation in ein separat testbares Modul ausgelagert und mit Regressionstests für Schnee, Schneeschauer, Schneeregen, Schneeregenschauer, Regen und gefrierenden Regen abgesichert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.66

- Bewölkungs-/Sonnenband im Temperaturtrend farblich an die Referenzskala angepasst: kräftiges Gelb für viel Sonne, abgestufte Beige-Töne und neutrales Grau für wenig Sonne.
- Die Bandfarbe wird ausschließlich aus der täglichen Best-Match-Sonnenscheindauer gebildet; ungültige oder physikalisch zu hohe Werte werden auf das lokale Intervall zwischen Sonnenauf- und Sonnenuntergang begrenzt.
- Ensembleabruf um `sunshine_duration` je Mitglied erweitert; tägliche Summen werden modellgewichtet zu P10, Mittel und P90 aggregiert. Modelle ohne diese Variable bleiben durch einen automatischen Fallback weiterhin für Temperatur und Niederschlag nutzbar.
- Tooltip ersetzt „Bewölkung“ durch die Best-Match-Sonnenscheindauer in Stunden sowie die P10–P90-Bandbreite in Stunden mit deutschem Dezimalformat und responsivem Zeilenumbruch.
- Kompakte Sonnen-/Wolken-Farbskala nach Referenzmuster direkt in die Diagrammlegende aufgenommen, ohne die Außenhöhe des Diagramms zu verändern.
- Regressionsprüfung um Best-Match-Datenpfad, Ensemble-Sonnenbandbreite, Tooltiptext und Farbskala ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.65

- Temperatur- und Niederschlagsdiagramm verwenden nun dieselbe symmetrische Tagesachse mit je einem halben Zeitschritt Abstand zu linker und rechter y-Achse; erste und letzte Werte liegen nicht mehr auf den Achsen.
- Abstand, Beschriftung und Innenränder der x-Achsen wurden vereinheitlicht; Bewölkungsband, Temperaturkurven, Niederschlagsbalken und Wahrscheinlichkeitskurve bleiben taggenau deckungsgleich.
- Einheitenfehler der hyperlokalen Windanalyse behoben: Bright-Sky/DWD-Windwerte werden von km/h nach kt umgerechnet, bevor sie mit dem in kt angeforderten Open-Meteo-Hintergrundfeld verrechnet werden.
- Zusätzliche zentrale Normalisierung fängt künftig sämtliche Stationsdatensätze mit `windUnit: kmh` vor Restfeldanalyse und robuster Mittelung ab.
- Regressionsprüfung um symmetrische Diagrammachsen, identische Achsenabstände und Stationswind-Normalisierung ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.64

- Tooltip und interaktive Temperaturlegende räumlich getrennt, sodass der Tooltip die Legende nicht mehr überdeckt.
- Temperatur- und Niederschlagsdiagramm zunächst auf ein gemeinsames Tagesraster ausgerichtet.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.63

- Buildfehler `TS2304: Cannot find name 'RainTooltip'` in der Ensemble-Niederschlagsgrafik behoben.
- Fehlende `RainTooltip`-Komponente wiederhergestellt und gegen nicht numerische beziehungsweise fehlende Diagrammwerte abgesichert.
- Semantische TypeScript-Prüfung der geänderten Ensemble-Komponente sowie die vorhandenen Updater-, Interaktions- und Radarprüfungen erfolgreich ausgeführt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.62

- Ensemble-Konsistenztooltips werden über ein viewportfestes Portal gerendert, an allen Bildschirmrändern automatisch eingerückt und nicht mehr durch horizontal scrollende Kartenbereiche abgeschnitten.
- Hover und Tastaturfokus öffnen den Konsistenztooltip unmittelbar; beim Verlassen schließt er automatisch, Touch/Klick bleibt ergänzend nutzbar.
- Im Diagramm „Temperaturtrend und Prognoseunsicherheit“ zeigt ein tägliches Bewölkungsband direkt oberhalb der x-Achse Grau für wenig Sonne bis Gelb für viel Sonne.
- Das Bewölkungsband wird aus der Best-Match-Sonnenscheindauer relativ zur astronomischen Tageslänge berechnet und im Diagrammtooltip zusätzlich erläutert.
- Höhe, Außenabstände und Achsenreserven des Temperaturdiagramms bleiben unverändert.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.61

- Tageswechsel im Desktop-Detaildiagramm bewahrt die ausgewählte Ortsstunde: Pfeil hoch springt zum Folgetag und Pfeil runter zum Vortag jeweils auf denselben stündlichen Zeitschritt; an Zeitumstellungstagen wird der nächstliegende vorhandene Stundenwert verwendet.
- Native Dropdownlisten übernehmen das aktive Hell-/Dunkel-Farbschema einschließlich expliziter Hintergrund- und Schriftfarben für Optionen und Optionsgruppen.
- Interaktionsprüfung um Regressionstests für Stundenerhalt beim Tageswechsel und Dropdown-Kontrast ergänzt.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

# MID v0.7.60

- Updatearchitektur bereinigt: nur noch ein zentral registrierter Service Worker; Installation und Aktivierung sind getrennt, der Seitenwechsel erfolgt erst nach `controllerchange` und anschließend cachefrei per `location.replace`.
- Such-/Favoritenbereich schließt zuverlässig bei Außenklick, Fokuswechsel, Escape, Ortswahl und über einen dauerhaft erreichbaren Schließen-Button.
- Ensemble-Konsistenzpunkte besitzen einen CSS-gesteuerten Hover-/Fokus-Tooltip, der ohne Klick erscheint und beim Verlassen automatisch verschwindet.
- Desktop-Detaildiagramm erhält native, nicht-passive Eingabehandler: Pfeil hoch/runter wechselt den Tag, Pfeil links/rechts und Mausrad wechseln stündlich.
- Radarabgleich korrigiert DWD-Kartenpixel durch GetFeatureInfo-Punktwerte auch bei scheinbar trockenem PNG-Pixel, begrenzt Teilabrufe, prüft Aktualität und 3-Stunden-Horizont und aktualisiert alle fünf Minuten sowie bei Sichtbarkeit/Fokus.
- GitHub-Pages-Build übernimmt explizite Radar-, Same-Origin- und Fallback-Worker-Endpunkte.
- Automatisierte Prüfungen für Updater, UI-Interaktionen und den konkreten DWD-Radarfehler ergänzt.

# MID v0.7.59

- Updateablauf stabilisiert: kein automatischer Reload beim Aktivieren der Option, keine Update-URL-Schleife und aktualisierter Service-Worker-Cache.
- Such-/Favoritenmenü schließt bei Klick außerhalb und mit Escape.
- Konsistenzpunkte zeigen ihren Tooltip bereits beim Hover/Fokus und schließen beim Verlassen.
- Desktop-Detaildiagramm: Pfeil hoch/runter wechselt tageweise; Mausrad navigiert stündlich.
- Radarabgleich mit Cache-Buster, Wiederholungsversuch und automatischer Aktualisierung alle fünf Minuten robuster gemacht.

# Changelog

## 0.7.59
- Widget: Der Wettertext erhält einen festen, zweizeiligen Bereich mit sauberem Umbruch; beide Textzeilen bleiben vollständig sichtbar und kollidieren nicht mehr mit den Temperaturwerten.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

## 0.7.55
- Desktop: Ansichtswahl aus der breiten Favoriten-/Suchspalte entfernt und als kompakte Auswahl direkt neben Suchfeld und Standortbutton platziert; auf schmalen Ansichten bleibt der gut bedienbare Segment-Schalter erhalten.
- Worker-Aufrufe verwenden nun mehrere konfigurierbare Endpunkte mit automatischem Failover, Zeitlimit und gespeichertem zuletzt erfolgreichen Endpunkt.
- Optionaler gleichursprünglicher Worker-Pfad und zusätzliche Fallback-Adressen schützen insbesondere gegen gesperrte `workers.dev`-Domains; vollständiger Schutz gegen lokale, DNS- oder Unternehmensnetz-Blockaden ist technisch nicht erzwingbar.
- METAR behält den direkten AviationWeather-Fallback; das Meteogramm fällt bei blockiertem Worker automatisch auf Open-Meteo direkt zurück.
- Warnungen, Radar-Nowcast, Kompositdaten, Blitz, 250-m-Radar und Modellkonturen melden nach Ausschöpfen aller Endpunkte eine eindeutige Blockade-/Netzwerkdiagnose.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

## 0.7.54
- Buildkorrektur: Typdeklaration für `import.meta.env` ergänzt, damit `src/pwa.ts` im GitHub-Workflow kompiliert.
- Buildkorrektur: ungenutzten Tageszeit-Helfer entfernt; TypeScript-Prüfung mit `noUnusedLocals` läuft wieder fehlerfrei.
- Tagesbeschreibung, Wetter-Icon und Tagescharakter werden konsequent aus denselben stündlichen Daten abgeleitet; die tägliche Sonnenscheindauer dient nur noch als schwacher Plausibilitätsfaktor.
- Bewölkte Stunden können dadurch nicht mehr zugleich zu einem unpassenden Tagescharakter wie „Heiter“ führen.
- Wettertexte besitzen feste, semantisch gekürzte Längenlimits: Haupttext maximal 30, Zusatztext maximal 28 Zeichen.
- Unnatürliche Zeitspannen wie „nachts bis abends“ entfallen; getrennte Ereignisfenster erscheinen kurz als „nachts/abends“, längere Verteilungen als „zeitweise“.
- Niederschlagswahrscheinlichkeiten werden nicht mehr doppelt im Beschreibungstext wiederholt, da sie bereits in den Tageswerten stehen.
- Cloudflare Worker ohne funktionale Änderung; nur einheitliche Versionsanhebung.

## 0.7.53
- PWA-Manifest, Apple-Web-App-Metadaten und vorsichtiger Service Worker mit Network-First für Navigation und version.json.
- Favoriten und Einstellungen werden zusätzlich in IndexedDB und Cache Storage gespiegelt und bei leerem localStorage automatisch wiederhergestellt.
- Wettercharakter und Icon werden vorrangig aus der stündlichen Tagesbewölkung abgeleitet; Sonnenstunden dienen nur noch als Plausibilitätsfaktor.
- Favoriten-Griff links zwischen Rand und Stern verlegt.
- Updater um Service-Worker-Aktualisierung ergänzt und durch automatisierten Konsistenztest geprüft.

## 0.7.52

- Wetter-Icons werden nun mit der vollständigen Tagesbeschreibung einschließlich Bewölkungstrend abgeglichen.
- Bei „Stark bewölkt, ab Mittag auflockernd“ erscheint ein Sonne-Wolken-Symbol statt einer reinen Sonne.
- „Heiter“ nutzt ein leicht bewölktes Sonnensymbol; „Heiter, später wolkiger“ und ähnliche Übergänge ein repräsentatives Mischsymbol.
- Niederschlags- und Gewittersymbole bleiben bei dominanten oder markanten Ereignissen vorrangig.

## 0.7.51

- Kurze Tagesbeschreibungen berücksichtigen nun markante Wetteränderungen im Tagesverlauf.
- Später einsetzende Schauer, Regen, Schnee oder Gewitter werden direkt mit Tageszeit genannt, z. B. „Sonnig, ab Nachmittag Schauer“.
- Deutliche Bewölkungstrends erscheinen knapp als „ab Mittag wolkiger“ oder „ab Mittag auflockernd“.
- Früh endender Niederschlag wird als Verlauf wie „Schauer am Morgen, später heiter“ beschrieben.

## 0.7.50

- Mobile Detailansicht ohne technische Kürzel wie „NS“ oder „NS-Wkt.“; stattdessen eindeutige Wetter-Symbole und kurze Klartextangaben.
- „UV“ und „UV-Index“ in der Oberfläche konsequent durch „UVI“ ersetzt.
- UVI-Werte werden für Standorte oberhalb von 500 m transparent näherungsweise höhenkorrigiert (+10 % je weitere 1000 m, gedeckelt auf +35 %).
- Die aktuelle UVI-Kachel weist eine aktive Höhenkorrektur samt Zuschlag und Standortshöhe aus.

# v0.7.46

## 0.7.49

- Tagescharakter der 7-Tage-Vorhersage präzisiert: Sonnenscheindauer, Tageslänge und effektive Tagesbewölkung werden gemeinsam bewertet.
- Statt pauschalem „Stark bewölkt“ erscheinen je nach Verhältnis nun kurze Abstufungen wie „Heiter“, „Wolkig, oft sonnig“, „Sonne und Wolken“, „Meist bewölkt“ oder „Bedeckt“.
- Mobile Detailansicht platzsparender beschriftet, unter anderem mit „Σ NS“, „max. NS-Wkt.“, „Temp.“ und „NS-Wkt.“ in der Legende.
- Desktop-Beschriftungen bleiben ausgeschrieben.

## 0.7.48

- Ansichtswahl direkt unter der Favoritenleiste als kompakte Auswahl „Kompakt“ oder „Vollständig“ mit Kurzbeschreibung.
- Höhenkachel aus den aktuellen Wetterdaten entfernt.
- Sonnenscheindauer der letzten Stunde als aktuelle Kennzahl ergänzt.
- Sonnenscheindauer platzsparend in die Tageswerte der 7-Tage-Vorhersage aufgenommen.

## 0.7.47

- Kompakte Startansicht als neuer Standard mit dauerhaft sichtbarer 7-Tage-Vorhersage.
- Stündliche Details der 7-Tage-Vorhersage sind in der kompakten Ansicht einblendbar.
- Kompositbild, 14-Tage-Ensemble, Meteogramm und Widget-Generator sind einklappbar und werden erst beim Öffnen vorbereitet.
- Modulzustände und gewählte Ansichtsart werden lokal gespeichert.
- Fallback-Schalter zur bisherigen vollständigen Ansicht ergänzt.


- Meteogramm-Höhenachsen: Flight Levels werden konsequent nach unten auf volle Zehner gerundet; hft-Angaben nach unten auf durch fünf teilbare Werte.

# 0.7.44 — stabiler heller Meteogramm-Export

- Problematischen geklonten Theme-Export entfernt.
- Meteogramm-PNG wird direkt aus dem sichtbaren Diagrammbaum in einem temporären, festen hellen Export-Theme erzeugt.
- iOS/Safari erhält damit keine leeren schwarzen oder weißen Exportbilder mehr.

## 0.7.42

- Theme-Auswahl um Auto erweitert; folgt der Betriebssystemeinstellung und reagiert live auf Systemwechsel.
- Bestehende Hell-/Dunkel-Auswahl bleibt gespeichert und kompatibel.

# v0.7.41

- Vollständiger TypeScript- und Worker-Check; ungenutzte Imports, Variablen und Hilfsfunktionen entfernt.
- `noUnusedLocals` und `noUnusedParameters` als dauerhafte Build-Prüfungen aktiviert.
- Versionsnummer zentral aus `package.json` synchronisiert (`src/version.ts`, `public/version.json`, Worker), um erneute Updater-Abweichungen zu verhindern.
- Überdimensioniertes Logo von 1672×941 auf 512×288 px reduziert; Darstellung bleibt bei maximal 42 px unverändert, Download- und Projektgröße sinken deutlich.
- Build-Abhängigkeit `@vitejs/plugin-react` korrekt in die Entwicklungsabhängigkeiten verschoben.
- Generierte lokale Build-Artefakte werden nicht mehr ausgeliefert. Keine Funktionsänderung am Worker.

## v0.7.40 – 2026-07-21

- Updater: lokale Laufzeitversion und veröffentlichte `version.json` werden wieder aus demselben Versionsstand erzeugt; die in v0.7.37 verbliebene interne Kennung v0.7.36 wurde korrigiert.
- Ensembles: P25–P75 besitzt in der Legende getrennte farbige Flächenfelder für Tmax und Tmin.

## v0.7.37 – 2026-07-21

- Ensembles: zusätzliches, etwas dunkleres P25–P75-Temperaturband für die Vorhersagetage 1–7; über die Legende ein- und ausblendbar.
- Ensemble-Aggregation liefert dafür gewichtete 25- und 75-Prozent-Quantile für Tagesminimum und Tagesmaximum.
- Kompositbild: aktive Layer (Niederschlag, 250-m-Radar, Satellit, Blitze und Modelllinienmodus) werden separat und dauerhaft im Browser gespeichert und beim nächsten Öffnen wiederhergestellt.
- Worker: keine funktionale Änderung; nur einheitliche Versionsanhebung.

# Changelog

## v0.7.37 — Meteogramm-Datenkonsistenz, exportfeste Linien und kompaktere Mobilkarten

- Fehlende API-Werte werden nicht mehr irrtümlich als `0` interpretiert; die Meteogrammzeitachse endet am letzten zusammenhängenden Boden- und Druckniveau-Datensatz.
- Best Match verwendet für das Druckniveau-Meteogramm eine durchgängige ECMWF-IFS-HRES-Zeitreihe, statt nach kurzer Regionalmodelllaufzeit leere Profilfelder zu erzeugen.
- Linien, Niederschlagsbalken, Schneehöhenkurve und Niederschlagsfarben werden im SVG direkt gesetzt und bleiben dadurch auch im iOS-PNG-Export sichtbar.
- QFF-Achsenwerte werden ohne Tausenderpunkt ausgegeben; die Schneehöhenachse entfällt vollständig, wenn keine messbare Schneehöhe vorliegt.
- Tagesbezeichnungen werden über dem jeweiligen Tagesabschnitt zentriert und überlappen am ersten unvollständigen Tag nicht mehr.
- Mobile 7-Tage-Kacheln enthalten unverändert alle Angaben, benötigen durch kleinere Abstände, kompaktere Typografie und eine flachere Temperaturzeile aber deutlich weniger Höhe.
- NOAA GFS für Druckniveauprofile auf die druckniveaugeeignete 0,25°-Variante vereinheitlicht.

## v0.7.35 — stabiler Meteogramm-Export, echte Tooltips und feste Satellitenstände

- Meteogramm-Export erzeugt nur noch eine PNG-Datei und sperrt Mehrfachauslösungen.
- Export verwendet `toBlob`, einen festen 1120-px-Arbeitsbereich, ein kompaktes Layout und blendet unsichtbare Interaktionsflächen aus.
- Diagramme besitzen sichtbare Hover-/Touch-Tooltips mit Zeit, Niveau und Messwerten.
- Modellabhängige Meteogramm-Laufzeiten werden bereits im Worker angefordert und im Frontend zusätzlich begrenzt.
- Satellitenraster werden während des Zoomens ausgeblendet und danach mit neuem Cache-Schlüssel vollständig geladen.

## v0.7.34 — Kompositkarte und Meteogramm-Feinschliff

- Aktivieren der Modelllinien verändert den Kartenausschnitt nicht mehr.
- Bodendruckzentren werden aus dem Modellfeld erkannt und als H beziehungsweise T mit Druckwert markiert.
- Satelliten-, Radar- und Blitzraster werden nach Zoomwechsel mit eindeutigem Layerstand neu aufgebaut; zeitlose Satellitenlayer werden, sofern möglich, auf den letzten exakten Produktzeitpunkt fixiert.
- Meteogramm-Isolinien dürfen wieder regulär am Diagrammrand oder an Datenlücken enden.
- Relative Feuchte farblich von trockenem Gelb bis feuchtem Grün abgestuft.
- Horizontale Hilfslinien auf sämtlichen Druckniveaus, Hauptflächen stärker hervorgehoben.
- Schneehöhenachse zeigt bei kleinen Werten passende Dezimalstellen statt gerundeter Doppelwerte.
- Worker funktional erweitert: Druckzentren und fixer letzter Satellitenzeitpunkt.

## v0.7.33 — Meteogramm-Konturen, Windfiedern und Download

- Unvollständige Isolinien an internen Datenlücken wurden verworfen; Konturen auf den Datenbereich begrenzt.
- Horizontale Hilfslinien auf ausgewählten Hauptdruckflächen.
- Relative Feuchte mit Isolinien im 20-Prozentpunkte-Raster.
- WMO-Windfiedern zur Herkunftsrichtung verlängert und Windstille als Kreis dargestellt.
- Tooltips für Profil-, Linien-, Niederschlags- und Risikodiagramme erweitert.
- Download mit „Speichern unter…“, System-Freigabe oder Browser-Fallback.
- Worker funktional unverändert; nur Versionsanhebung.


## v0.7.32 — Updater- und Modelllinien-Korrektur

- Zentrale Versionskonstante für App, Zusatzmodul und Meteogramm; der Updater vergleicht nicht mehr irrtümlich die aktuelle Veröffentlichung mit einer veralteten internen Versionsnummer.
- Modelllinien: ungültigen Parameter `elevation=nan` entfernt.
- Modelllinien-Raster weiterhin in kurzen Zeilenabfragen; maximal vier parallele Abrufe.
- Europa: ICON-EU bleibt erste Wahl, bei unvollständiger Modellabdeckung automatischer einheitlicher Fallback auf ICON Global.
- Nordamerika verwendet für Druckniveaukarten GFS 0,25° statt des Modells ohne benötigte Druckniveauvariablen.
- Upstream-Fehlermeldungen werden konkret ausgewertet statt nur als pauschales HTTP 400 angezeigt.

## 0.7.31

- Meteogrammprofile und optionale Risikoebenen vertikal gedreht: hohe Atmosphäre oben, Boden bzw. bodennahe Druckflächen unten
- Wind- und Böenachsen beginnen zwingend bei 0 kt; eingehende Windwerte werden defensiv auf nichtnegative Werte begrenzt
- Windpfeile für helle und dunkle Ansicht mit kontrastreicher Kontur neu gezeichnet
- Cloudflare Worker funktional unverändert, nur einheitliche Versionsanhebung

## 0.7.29

- Modelllinien auf großräumige, ortsabhängige Kartenausschnitte erweitert; für Standorte in Deutschland wird der europäische ICON-EU-Ausschnitt verwendet
- Konturen bilinear verdichtet, zu durchgehenden Pfaden verbunden und geglättet
- Isobarenabstand dynamisch auf 1, 2 oder 4 hPa nach dem Druckgradienten angepasst; Ziel ist eine auch bei schwachen Gradienten erkennbare Liniendichte von ungefähr 100 km
- 500-hPa-Isohypsen auf den meteorologischen Abstand von 8 gpdm umgestellt
- Konturbeschriftungen vergrößert, kontrastreicher gestaltet und entlang langer Linien wiederholt
- EuCom als DWD-Flugwetterprodukt geprüft; mangels öffentlicher, lizenzierter Abrufschnittstelle nicht in den öffentlichen Worker integriert

## v0.7.29

- neue, beim Start geschlossene Kachel „Meteogramm“ unmittelbar vor dem Widget-/PNG-Generator
- Modellauswahl mit Best Match sowie ausgewählten regionalen und globalen deterministischen Modellen
- siebentägiges beziehungsweise auf die verfügbare Modelllaufzeit begrenztes Vertikalprofil von Stationsniveau bis 300 hPa
- relative Feuchte als Höhen-Zeit-Querschnitt sowie kombinierte Temperatur-/Winddarstellung mit Richtungspfeilen
- zusätzliche Zeitreihen für 2-m- und 850-hPa-Temperatur, QFF, Wind/Böen sowie Niederschlag, Niederschlagsform und Schneehöhe
- optional einblendbare diagnostische Höhenbänder für Vereisung sowie Turbulenz/CAT; ausdrücklich nicht als amtliche Flugwetterprodukte gekennzeichnet
- Druckniveaus unterhalb des Geländes werden zeitabhängig ausgeblendet
- Meteogramm wird als eigener Lazy-Load-Chunk geladen; Modelldaten werden erst beim Öffnen der Kachel abgerufen und im Worker zwischengespeichert
- Cloudflare Worker um die Route `mode=meteogram` erweitert; Frontend und Worker einheitlich auf v0.7.29 angehoben

## v0.7.29

- Kompositfilm auf eine feste relative Achse von −1 Stunde bis +2 Stunden umgestellt; nicht vorhandene Layerstände werden weich ausgeblendet, reale benachbarte Frames überblendet.
- RainViewer-Metadaten über eine gecachte Workerroute angebunden; letzter realer Radarstand bleibt mit Zeitstempel sichtbar und wird ohne erfundene Zukunftsframes ausgefadet.
- Satelliten-Aktualitätsprüfung um einen Publikationspuffer erweitert; bis 150 Minuten Historie und verspätet veröffentlichte nominal ältere Bilder bleiben nutzbar.
- DWD-/MTG-LI-Blitzzeitachsen auf bis zu 130 Minuten Historie erweitert; Rasterfallback wird auch dann genutzt, wenn Punktdaten am ausgewählten historischen Zeitschritt fehlen.
- H-SAF-Satellitenniederschlagsrate als ergänzende Radarfläche integriert; automatischer MTG-H40B-Vorrang, sobald der Layer im öffentlichen EUMETView-WMS erscheint, mit MSG-H60B als aktuellem Fallback.
- Ortsabhängige Isobaren und 500-hPa-Isohypsen aus Open-Meteo Best Match ergänzt.
- Gemeinsame `CompositeTimeline`-Logik, Worker-Caching und Rendering von maximal zwei Blendframes reduzieren doppelte Berechnungen und Kartenlast.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.29 angehoben.

# Changelog

## v0.7.26

- 14-Tage-Ensemble: beide Diagramme verwenden nun dieselbe numerische Tagesachse; jeder Vorhersagetag besitzt in Temperatur- und Niederschlagsdiagramm exakt dieselbe x-Koordinate, unabhängig von Balken oder zweiter y-Achse.
- Widget-Export in „in Zwischenablage kopieren“ umbenannt.
- Hochauflösendes Radar: aktuelles nationales DWD-HX-Komposit mit 250-m-Raster als erste Wahl für Deutschland integriert; PX250 bleibt als Standort-Fallback erhalten.
- Große HX-HDF5-Raster werden speicherschonend und geräteabhängig gerendert, ohne die native Quellenauflösung falsch auszuweisen.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.26 angehoben.

## v0.7.25

- Niederschlag 1 km und Niederschlag 250 m als gegenseitig ausschließende Auswahl mit einheitlicher Benennung umgesetzt.
- Veraltete PX250-Metadaten und HDF5-Dateiverweise in Frontend und Worker doppelt abgesichert; PX250 beeinflusst keine fremde Kompositzeitachse mehr.
- Zeitvalidierung für Radar, Satellit und Blitz gegen eine plausible Worker-Serverzeit gehärtet und WMS-Abrufe außerhalb der zulässigen Live-/Nowcast-Fenster blockiert.
- Satellitenlayer werden je tatsächlichem Produktzeitpunkt neu geladen; Quellen ohne verlässliche Zeitdimension verwenden den echten neuesten Stand ohne erfundene Uhrzeit.
- Blitzringe auf eine Blitzortung-inspirierte Altersfarbskala in 20-Minuten-Stufen von Weiß bis Dunkelrot umgestellt; Blitzortung selbst wird wegen der Zugriffs- und Weitergabebedingungen nicht als Rohdatenquelle integriert.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.25 angehoben.

## v0.7.24

- Fehlerhafte Kompositzeiten behoben: Worker-Zeitwerte werden unabhängig davon korrekt verarbeitet, ob sie als ISO-Zeit, Unix-Sekunden oder Epoch-Millisekunden eintreffen; die bisherige Vermischung von Sekunden und Millisekunden kann keine Werte wie „−5555 min“ mehr erzeugen.
- Künstlich erzeugte Radarzeitpunkte entfernt. DWD-Radar, Satellit und Blitzraster werden nur noch mit Zeitstempeln abgefragt, die der konkrete Produktlayer tatsächlich in seinen WMS-Capabilities meldet.
- Leere Radar- und Satellitenkarten behoben: DWD- und EUMETSAT-WMS-Kacheln werden CORS-sicher über den Cloudflare Worker ausgeliefert; beim DWD bleibt der offizielle Ausfallserver als Rückfall aktiv.
- DWD-RV verwendet bevorzugt den expliziten 1-km-RV-Layer und stellt – soweit von der Quelle vorhanden – ausschließlich das reale Fenster von relativ −1 Stunde bis +2 Stunden bereit.
- Satellitenquelle wird anhand der aktuell wirklich verfügbaren Produktzeiten gewählt: bevorzugt hochaufgelöstes MTG-FCI, anschließend MSG-HRV/IR und zuletzt ein aktuelles DWD-Meteosat-Produkt. Bei einem fehlerhaften Tagesbild wechselt MID automatisch auf das IR-Produkt.
- Relative Zeitangabe bezieht sich jetzt auf die aktuelle Uhrzeit; Ortszeit und Prognosekennzeichnung stehen separat darunter. Produktzeiten außerhalb von −1 h bis +2 h werden verworfen.
- Worker-Antwort `composite-times` um reale DWD-Radarzeiten, verwendeten Radar-Layer und Serverzeit ergänzt; WMS-Proxy auf freigegebene Layer und valide Zeitstempel begrenzt.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.24 angehoben.

## v0.7.23

- Kompositbild um einen kleinen „Locate Me“-Button ergänzt, der die verschobene Karte animiert auf den gewählten Standort zurückführt, ohne Zoomstufe oder Layerauswahl zurückzusetzen.
- Höhenkonfiguration des Berg-/Skimodus auf direkt editierbare Meterfelder mit Mobil-Zifferntastatur, zuverlässigem Zwischenzustand und zusätzlichen ±50-m-Schaltflächen umgestellt.
- Tal- und Gipfelwerte weisen die verwendete Höhe nun ausdrücklich in m ü. NHN aus; aktuelle und zeitliche Gipfelprognosen zeigen Temperatur und gefühlte Temperatur gemeinsam.
- Bezeichnung „Schneegrenze“ im Berg-/Skimodus fachlich zu „Schneefallgrenze“ präzisiert.
- Auto-Standort in Schnellzugriff, Suche und Favoritenverwaltung einheitlich von „1. Standort“ zu „Standort“ umbenannt.
- Temperatur- und Niederschlagsdiagramm des 14-Tage-Ensemble-Trends verwenden identische feste Achsenreserven. Das Ein-/Ausblenden der Niederschlagswahrscheinlichkeit verändert damit nicht mehr die horizontale Position der Vorhersagetage.
- Frontend und funktional unveränderter Cloudflare Worker einheitlich auf v0.7.23 angehoben.

## v0.7.22

- Widget- und PNG-Generator um einen direkten PowerPoint-Export erweitert: hochauflösendes PNG wird per Clipboard API kopiert; bei fehlender Browserfreigabe erscheint ein kopierbares Rechtsklick-/Long-Press-Fallbackbild.
- Layerauswahl, Kartenbasis und individuelle Deckkräfte für Niederschlag, Satellit und Blitze dauerhaft gespeichert; Deckkraftregler dynamisch auf aktive Layer begrenzt.
- Gemeinsame Komposit-Zeitachse auf reale verfügbare Produktzeiten begrenzt und bis ungefähr ±1 Stunde erweitert, wo Radar-Nowcast beziehungsweise Historie dies erlauben; Übergänge zwischen Kartenframes geglättet.
- Ortsabhängige Auflösungspriorität dokumentiert und umgesetzt: PX250 250 m, DWD-RV 1 km, OPERA 2 km, anschließend RainViewer.
- Optionalen weltweiten Vaisala-Xweather-/GLD360-Blitzpunktabruf im Worker ergänzt; freie Fallbacks bleiben DWD und EUMETSAT MTG-LI. Blitzpunkte werden als alterscodierte, skalierte Ringe statt gefüllter Kreise dargestellt.
- Favoriten können nun direkt in der Schnellzugriffsleiste auf der Startebene per Maus sowie Touch/Pointer verschoben werden.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.22 angehoben.

## v0.7.21

- DWD-PX250-Abruf vom direkten Browserzugriff auf einen CORS-sicheren Worker-Proxy umgestellt; Verfügbarkeitsprüfung und HDF5-Datei werden über neue Worker-Modi bereitgestellt.
- Sichtbare Radarpriorität korrigiert: DWD-RV, danach EUMETNET OPERA/ORD als europäischer Erst-Fallback und erst anschließend RainViewer. OPERA erhält eine eigene Kartenvisualisierung als RATE-Punktraster.
- Kartenbasis um CARTO Positron und CARTO Dark Matter ergänzt; Auswahl wird je Browser gespeichert.
- DWD-Blitzgeometrien als zeitcodierte, mit zunehmendem Alter verblassende Kreise ergänzt; DWD-Blitzdichte und EUMETSAT MTG-LI bleiben als robuste Raster-Fallbacks erhalten.
- Kompositlegende verschlankt und dynamisch an die aktiven Radar-, Satelliten- und Blitzlayer angepasst.
- Favoritenreihenfolge über einen dedizierten Drag-&-Drop-Griff einschließlich Touch-/Pointer-Unterstützung änderbar; Pfeilnavigation bleibt erhalten.
- Frontend und funktional erweiterter Cloudflare Worker einheitlich auf v0.7.21 angehoben.

## v0.7.20.2

- Die bisherige Niederschlagsradarkachel heißt nun **Kompositbild** und besitzt getrennte Schalter für Niederschlag, natives DWD-PX250-Radar, hochaufgelöste MTG-FCI-Satellitenbilder und MTG-LI-Blitzaktivität.
- DWD-PX250 wird nur angeboten, wenn der gewählte Standort innerhalb der etwa 150-km-Reichweite eines passenden Radarstandorts liegt und eine aktuelle HDF5-Datei verfügbar ist. Die native Rasterweite beträgt 250 m; die Datei wird erst nach Aktivierung geladen und im Browser gerendert.
- Tagsüber verwendet die Satellitenebene den sichtbaren MTG-FCI-HRFI-Kanal VIS 0,6 mit nominal 0,5 km am Nadir; nachts wird automatisch IR 10,5 mit nominal 1 km verwendet. Bei einem nicht verfügbaren Tageslayer fällt MID auf IR zurück.
- Echtzeit-Blitzaktivität verwendet in Deutschland die DWD-NowCastMIX-Blitzdichte im 1-km-Raster mit 5-Minuten-Aktualisierung; außerhalb dient EUMETSAT MTG-LI AFA im 2-km-Raster als NRT-Fallback. Die Anzeige ist keine metergenaue Bodeneinschlagskarte.
- Radarfilm und Nowcast bleiben für DWD-RV beziehungsweise RainViewer erhalten; PX250 ist bewusst ein aktueller hochaufgelöster Einzelstand ohne künstliche Zukunftsframes.
- Frontend und Worker einheitlich auf v0.7.20.2 angehoben; der Worker erhält ausschließlich die neue Versionskennung und bleibt funktional unverändert. `jsfive` wird als eigener Lazy-Load-Chunk erst für PX250 geladen.

## v0.7.20.1

- Angaben zu Temperaturabweichungen, Temperaturunsicherheit und lokaler Modellkorrektur werden nun fachlich korrekt in Kelvin (K) statt in Grad Celsius ausgegeben.
- Absolute Temperaturen bleiben unverändert in Grad Celsius (°C).
- Frontend und kompatibler Cloudflare Worker auf v0.7.20.1 angehoben.

## v0.7.20

- Modellgestützte hyperlokale Analyse für aktuelle Temperatur, relative Feuchte, Taupunkt, QFF sowie Wind und Böen ergänzt.
- Offizielle DWD-Open-Data-Beobachtungen werden über Bright Sky an mehreren Suchpunkten gesammelt; dadurch stehen mehr DWD-Messpunkte als nur die nächste WMO-/METAR-Station zur Verfügung.
- openSenseMap-/senseBox-Außenmessungen als offene Citizen-Science-Zusatzquelle integriert; sie werden wegen uneinheitlicher Aufstellung nur mit geringer Gewichtung und nach strengen Aktualitäts-, Wertebereichs- und Ausreißerprüfungen verwendet.
- Synoptic Data nutzt nun die vollständige `synopticlabs`-QC-Suite mit grundlegenden und erweiterten Prüfungen.
- Stationswerte werden nicht direkt höhenkorrigiert gemittelt: MID ermittelt an jeder Station die Abweichung zum dortigen Open-Meteo-Best-Match-Hintergrund und interpoliert nur diese lokalen Restfelder zum Zielort.
- Gewichtung berücksichtigt Entfernung, Höhenunterschied, Messalter, Netzqualität, Stationsanzahl sowie Stadt-/Umland-/Land-Kompatibilität; private und Citizen-Science-Netze erhalten kürzere Reichweiten und strengere Altersgrenzen.
- Aktuelle-Wetter-Anzeige nennt nun effektiven Analyseradius, Temperaturunsicherheit, lokale Modellkorrektur und beteiligte Netze.
- Cloudflare Worker und Frontend auf v0.7.20 aktualisiert.

## v0.7.19

- Wassersportmodus als aktivierbares Favoritenprofil ergänzt.
- Open-Meteo Marine Best Match für Meeresoberflächentemperatur, Wellenhöhe/-richtung/-periode, Peak-Periode, Windsee, Dünung, Strömung und Wasserstand inklusive Tide integriert.
- modellierte Hoch-/Tiefpunkte, Wasserstandstendenz und 24-Stunden-Spanne ergänzt; nautische Einschränkungen werden deutlich ausgewiesen.
- Wetter-, Sicht-, UV-, Niederschlags- und Gewitterparameter mit konfigurierbaren Schwellen für Wellen, Böen und Kaltwasser kombiniert.
- See- und Flussprofile ersetzen fehlende Binnengewässerdaten nicht durch entfernte Meeresgitter.
- Wassersportmodul wird nur bei aktivem Profil und erst beim Scrollen geladen; Favoritenexport auf Schema-Version 4 angehoben.
- Frontend und kompatibler Worker auf v0.7.19 aktualisiert.


## v0.7.18

- Initiales Laden deutlich verkleinert: Leaflet/Radar und Recharts/Ensembletrend sind in eigene dynamische Chunks ausgelagert und werden erst bei Annäherung an den sichtbaren Bereich geladen.
- Widgetwerkzeuge bleiben bis zum Aufklappen inaktiv; `html-to-image` wird ausschließlich beim tatsächlichen PNG-Export nachgeladen. Der Berg-/Skimodus bleibt an ein aktiviertes Favoritenprofil gebunden.
- Datenabrufe priorisiert: Best Match wird zuerst angezeigt; Stationsdaten, Luftqualität, Radar, Warnungen und Modellstände folgen anschließend. Klimatologie und Ensembles starten erst beim Ensemblebereich.
- Detaildiagramm um eine markante dynamische Jetzt-Linie mit ortslokaler Uhrzeit ergänzt; Position und Beschriftung werden alle 30 Sekunden aktualisiert.
- GeoSphere/TAWES-Druckverarbeitung gehärtet: `PRED` und Stationsdruck `P` werden getrennt, QFF wird höhen- und differenzbezogen plausibilisiert und Werte wie 854 hPa in Sölden werden als Stationsdruck erkannt beziehungsweise verworfen.
- Fehlt ein plausibler TAWES-QFF-Wert, verwendet MID konsequent Open-Meteo `pressure_msl`; der Worker liefert den Rohdruck nur noch separat.
- Frontend und Worker auf v0.7.18 aktualisiert.

## v0.7.17

- Mobile Kopfzeile korrigiert: Die Ortssuche nutzt wieder die vollständige verfügbare Breite und kann nicht mehr auf ein schmales Symbolfeld zusammenschrumpfen.
- Favoriten stehen unmittelbar unter der Suchleiste wieder als einzelne horizontal scrollbarere Bubbles; der dynamische „1. Standort“ und die Verwaltungs-Schaltfläche bleiben integriert.
- Widget- und PNG-Generator ist beim Laden standardmäßig eingeklappt und lässt sich über eine kompakte Schaltfläche öffnen.
- Österreichische TAWES-Druckdaten werden ausschließlich über `PRED` (reduzierter Luftdruck) als Meereshöhendruck/QFF übernommen; der Stationsdruck `P` wird nicht mehr versehentlich angezeigt.
- METAR-QNH und nicht eindeutig reduzierte Stationsdrücke werden nicht als QFF ausgegeben; in diesem Fall fällt MID auf Open-Meteo `pressure_msl` zurück.
- Frontend und kompatibler Workerstand auf v0.7.17 aktualisiert.

## v0.7.16

- Optionale Standortverfolgung als **„1. Standort“** ergänzt: Bei jedem Öffnen wird die aktuelle Geräteposition neu bestimmt und als erster Schnellzugriff angeboten.
- Standardort und zuletzt verwendeter Ort bleiben als Fallback erhalten, falls die Browser-Ortung nicht verfügbar oder nicht erlaubt ist.
- Favoriten-Schnellzugriff direkt unter das Suchfeld verlegt und nach den frei vergebenen Favoritengruppen geordnet.
- Leeres Suchfeld zeigt den aktuellen Standort sowie gruppierte Favoriten ebenfalls in derselben Reihenfolge.
- Berg-/Skimodus wird nun ausschließlich pro Favorit in der Favoritenverwaltung aktiviert; Tal- und Gipfelhöhe werden dort konfiguriert.
- Die deaktivierte Berg-/Ski-Hinweiskarte und die Höhen-Eingabefelder im Dashboard wurden entfernt, sodass der Modus ohne Aktivierung keinen Platz beansprucht.
- Favoriten-JSON auf Schema-Version 3 erweitert; Standortverfolgung und Berg-/Ski-Konfiguration werden exportiert, importiert und aus älteren Einträgen migriert.
- Frontend und kompatibler Workerstand auf v0.7.16 aktualisiert.

## v0.7.15

- Favoriten Phase 2: eigene Anzeigenamen, Gruppen, sortierbare Reihenfolge, Standardort, horizontaler Schnellzugriff und lokale Regeln je Favorit.
- Favoriten lassen sich als versionierte JSON-Datei exportieren und wieder importieren; bestehende v0.7.14-Favoriten werden automatisch migriert.
- Neuer optionaler Berg- & Skimodus mit explizitem Tal-/Gipfel-Höhenvergleich über Open-Meteo, Nullgradgrenze, angenäherter Schneegrenze, Sicht, angenäherter Wolkenuntergrenze, Windchill, Gipfeltrend und Tageslicht-Orientierung.
- Amtliche Lawinenlage wird über den zuständigen europäischen Warndienst verlinkt; alle abgeleiteten Bergindikatoren sind klar als Orientierung gekennzeichnet.
- Beschreibung der Sonnenschein-/Bewölkungsbalken auf das Wesentliche gekürzt und „Tageslicht“ durch „Tagsüber“ ersetzt.
- DWD-Radarkarte wird nur noch dargestellt, wenn die Standortauswertung tatsächlich DWD-RV als Quelle bestätigt; ansonsten erscheint die RainViewer-Kartenebene mit OPERA-/RainViewer-Standortauswertung.
- DWD-Gebietserkennung des Workers an den aufgelösten Ländercode Deutschland gebunden; außerhalb davon werden OPERA/ORD beziehungsweise RainViewer verwendet.
- Frontend und Worker auf v0.7.15 aktualisiert.

## v0.7.14

- Erstes Farbschema orientiert sich ohne vorhandene Nutzereinstellung automatisch am Hell-/Dunkelmodus des Geräts (`prefers-color-scheme`); eine manuell gewählte MID-Einstellung bleibt gespeichert.
- Radarsteuerung auf ein überlaufsicheres Raster umgestellt; der Regler für die Radar-Deckkraft liegt auf Desktop und Mobil vollständig in einer eigenen Zeile.
- Favoriten-Grundfunktion ergänzt: Der aktuelle Ort oder POI kann über einen Stern gespeichert beziehungsweise entfernt werden.
- Gespeicherte Favoriten werden lokal im Browser abgelegt und beim Fokussieren des leeren Suchfelds direkt zur Auswahl angeboten.
- Frontend und kompatibler Workerstand auf v0.7.14 aktualisiert.

## v0.7.13

- Laufender Niederschlag erhält eine belastbare Endzeit aus dem ersten dauerhaft trockenen DWD-Nowcast-Zeitfenster; einzelne trockene Zwischenframes beenden ein Ereignis nicht vorschnell.
- Bleibt Niederschlag bis zum Ende des verfügbaren Radarhorizonts bestehen, kennzeichnet MID die Zeit als „mindestens bis …“ statt ein scheinbar exaktes Ende auszugeben.
- Ohne ausreichend zukünftige Radarframes wird transparent angezeigt, dass noch keine belastbare Endzeit ableitbar ist.
- „Regenradar“ in „Niederschlagsradar“ umbenannt.
- DWD-Zeitdimension robuster aus den WMS-Capabilities gelesen, einschließlich geerbter Zeitdimensionen übergeordneter Layer.
- Mobile Radarsteuerung neu aufgebaut: vorheriger/nächster Zeitschritt, Play/Pause, fortlaufende Radarfilm-Wiedergabe und klarer Frame-Zähler.
- Bei nur einem gelieferten DWD-Zeitpunkt wird die offizielle 5-Minuten-Zeitachse um den validierten Beobachtungszeitpunkt ergänzt, sodass die WMS-Animation mobil bedienbar bleibt.
- DWD-Legende kompakter, ruhiger und besser lesbar gestaltet; sie verdeckt auf kleinen Bildschirmen weniger Kartenfläche.
- Cloudflare Worker und Frontend auf v0.7.13 aktualisiert.

## v0.7.12

- DWD-Auswertung von einer reinen Raster-`GetFeatureInfo`-Abfrage auf eine robuste Kombination aus WMS-`GetMap`-Pixelanalyse und optionaler Punktwertverfeinerung umgestellt.
- Ein transparenter DWD-Kartenpixel wird als erfolgreicher trockener Radarwert (`0 mm/h`) gewertet; nur ein technisch fehlgeschlagener Kartenabruf löst einen Quellen-Fallback aus.
- WMS-Capabilities werden am allgemeinen DWD-Endpunkt geladen und die Zeitdimension gezielt aus dem Block des tatsächlich verwendeten Radarlayers gelesen.
- Der stabile Alias `dwd:Niederschlagsradar` wird vor dem konkreten RV-Layer verwendet; Primär- und Backup-Geoserver bleiben erhalten.
- Zentrum und Umgebung werden aus derselben Radar-PNG ausgewertet. Dadurch sinkt die Zahl externer Worker-Unterabfragen, während trockene und nasse Standorte zuverlässig unterscheidbar bleiben.
- Auffällige `GRAY_INDEX`-Werte werden mit dem sichtbaren Kartenpixel plausibilisiert und können nicht mehr allein als extreme Niederschlagsrate übernommen werden.
- DWD-Radarlegende als kompakte, kontrastreiche MID-Leseskala mit mm/h-Stufen und Intensitätsklassen neu gestaltet.
- Cloudflare Worker und Frontend auf v0.7.12 aktualisiert.

## v0.7.11

- DWD-Radarzeitachse wird aus der tatsächlichen WMS-Zeitdimension statt aus geratenen Fünf-Minuten-Zeitpunkten übernommen.
- DWD-GetFeatureInfo nutzt Primär- und Backup-Geoserver sowie den stabilen Alias `dwd:Niederschlagsradar` als Fallback.
- Radar-Unterabfragen wurden deutlich reduziert, damit Cloudflare-Subrequest-Limits nicht überschritten werden.
- Trockene Radarwerte (`0 mm/h`) gelten nun ausdrücklich als erfolgreiche DWD-Auswertung und nicht als fehlende Abdeckung.
- Die Radar-Karte übernimmt die exakten verfügbaren DWD-Zeitstempel aus der Standortanalyse.
- Bei einem temporären Quellenfehler wird zwischen vorhandener Radarabdeckung und tatsächlich fehlender Abdeckung unterschieden.

## 0.7.10

- DWD-RV-GetFeatureInfo strikt auf den tatsächlichen Niederschlagswert beschränkt; Zeitstempel und andere numerische Metadaten können nicht mehr als Radarintensität fehlinterpretiert werden.
- DWD-RV-Werte werden entsprechend der WMS-Einheit direkt als mm/h verwendet und nicht erneut heuristisch hochskaliert.
- Fehlwerte und unplausible Radarwerte oberhalb des technischen Plausibilitätsbereichs werden verworfen.
- Extremwerte werden ohne irreführende Zehntelgenauigkeit als extremes Radarecho bzw. > 50 mm/h gekennzeichnet; isolierte Spitzen erhalten einen Unsicherheitshinweis.
- Ankunfts-, Datenstands- und Endzeiten werden in der Ortszeitzone in Klammern ergänzt; der +120-Minuten-Horizont kann nicht mehr als 120–130 Minuten ausgegeben werden.
- RainViewer-Intensität aus der offiziellen Universal-Blue-Palette statt aus einer fehleranfälligen Alpha-Heuristik angenähert; Reflektivitäten unter 10 dBZ werden nicht als Niederschlag gewertet.
- Ein Echo in der Umgebung wird nicht mehr automatisch als sicherer Standorttreffer formuliert; Mittelpunkt und Umgebung werden getrennt bewertet.
- Radarlegende automatisch an die dargestellte Ebene angepasst: offizielle DWD-RV-Legende beziehungsweise RainViewer Universal Blue in dBZ.
- Cloudflare Worker auf v0.7.10 aktualisiert.

## 0.7.9

- Aktuelle Niederschlagswahrscheinlichkeit um eine standortbezogene Radar-Nowcast-Auswertung ergänzt.
- Quellenpriorität: DWD-RV in Deutschland, EUMETNET OPERA/ORD in Europa, RainViewer als globaler Fallback, anschließend Open-Meteo Best Match.
- DWD-Zukunftsframes bis +120 Minuten werden direkt ausgewertet; OPERA und RainViewer erhalten eine eigene räumlich-zeitliche Bewegungsnäherung aus zurückliegenden Frames.
- Dynamische Radar-/Modellgewichtung nach Vorlaufzeit und Datenqualität umgesetzt.
- Radarquellen, Qualitätsstufe, aktuelle Intensität sowie grobe Ankunfts- und Endzeit werden kompakt in der vorhandenen Niederschlagskachel angezeigt.
- OPERA-Kompositprodukte werden mit CC-BY-4.0-Hinweis verwendet; RainViewer bleibt ausdrücklich als best-effort Fallback gekennzeichnet.
- Cloudflare Worker auf v0.7.9 erweitert (`mode=radar-nowcast`).

## 0.7.8
- Standortbezogene Zeitzonenlogik für automatische Stundenwahl, Kurzfristniederschlag, Radar, amtliche Warnungen, Tagesdiagramm, Sonnenauf-/untergang und Widget.
- Stündliche und 15-minütige Open-Meteo-Zeitstempel werden mit der IANA-Zeitzone des Zielorts in echte Zeitpunkte überführt.
- Datumsbeschriftungen verwenden den lokalen Kalendertag des Vorhersageorts und können nicht mehr durch die Gerätezeitzone verschoben werden.
- Ortssuche um OpenStreetMap/Photon-POIs erweitert, einschließlich Berggipfeln, Hotels, Hütten und Sehenswürdigkeiten.
- POI-Typ und OpenStreetMap-Herkunft werden kompakt in den Suchtreffern gekennzeichnet.

## 0.7.7

- Nachtstunden im Tages-Detailansichtsdiagramm vor Sonnenaufgang und nach Sonnenuntergang dezent diagonal schraffiert
- orts- und tagesgenaue Sonnenauf- und Sonnenuntergangszeiten unmittelbar an den Übergängen im Diagramm eingeblendet
- Darstellung ohne zusätzliche Karten- oder Diagrammhöhe umgesetzt
- bestehende Sonnenschein-/Bewölkungsbalkenlogik für Tageslicht und Nacht unverändert beibehalten

## 0.7.6

- Ursache der falschen Jahresdarstellung „5026“ beseitigt: Versionsnummern werden nur noch in Texten mit vorangestelltem `v` ersetzt
- Datumsangaben bei „Aktualisiert“, im Widget und im Update-Hinweis gegen unbeabsichtigte Versionsersetzung abgesichert
- Nachtlogik der Sonnenschein-/Bewölkungsbalken überarbeitet: bei klarem Himmel kein Balken, bei Bewölkung ausschließlich Grau
- Tageslogik beibehalten und feiner skaliert: unter 50 % Bewölkung Gelb, ab 50 % Grau; Linienstärke jeweils proportional in vier Stufen
- Tag/Nacht weiterhin aus der stündlichen Open-Meteo-Angabe `is_day` abgeleitet

## 0.7.5

- platzsparende Modellstand-Information in den Titelzeilen der 7-Tage- und 14-Tage-Ansicht ergänzt
- Open-Meteo-Metadaten für Init- und Verfügbarkeitszeit geeigneter deterministischer und tatsächlich aktiver Ensemblemodelle eingebunden
- Best Match ehrlich als automatische, je Ort, Variable und Horizont wechselnde Modellkombination gekennzeichnet
- wahrscheinliche Quellenkette regionaler und globaler Modelle separat als Schätzung ausgewiesen
- Modellstände in einem aufklappbaren Popover dargestellt, sodass im geschlossenen Zustand nahezu kein zusätzlicher Platz benötigt wird

## 0.7.4

- Detaildiagramm am Desktop fokussierbar gemacht
- Navigation mit Pfeiltaste links und rechts nach einem Klick in die Diagrammfläche ergänzt
- bestehende Stundenlogik einschließlich automatischem Wechsel zum vorherigen oder nächsten Tag wiederverwendet
- Standard-Scrollverhalten nur bei aktivem Diagrammfokus und nur für die horizontalen Pfeiltasten unterdrückt
- visuellen Fokusrahmen für die Tastaturbedienung ergänzt

## 0.7.3

- flächigen Bewölkungsverlauf im Tagesdetail durch eine horizontale Balkenzeile direkt unter den Wetterpiktogrammen ersetzt
- sonnige beziehungsweise überwiegend klare Phasen gelb dargestellt; größere Linienstärke bedeutet klareren Himmel
- bewölkte Phasen grau dargestellt; größere Linienstärke bedeutet stärkere Gesamtbewölkung
- vier Linienstärken für beide Zustände ergänzt und gelbe Sonnenscheindarstellung auf Tagesstunden begrenzt
- kompakte Legende und Erläuterung der Balkenlogik ergänzt

## 0.7.2

- Verlauf der Gesamtbewölkung im Tagesdetail in einen eigenen oberen Diagrammbereich über der Temperaturkurve verschoben
- Temperatur- und Niederschlagsbereiche des Detaildiagramms für eine klare vertikale Trennung neu angeordnet
- `version.json` als cache-frei abgerufene Quelle für die veröffentlichte MID-Version ergänzt
- automatischer Versionsvergleich beim Start mit Hinweis „MID wurde aktualisiert – jetzt neu laden“
- optionale, lokal gespeicherte automatische Neuladung bei künftigen Updates ergänzt
- Versionsprüfung bei Rückkehr aus dem Hintergrund, bei `pageshow`, bei Fokus und regelmäßig während der Nutzung ergänzt
- Cache-Busting beim Neuladen verhindert, dass eine installierte iOS-Web-App erneut den alten Einstiegspunkt öffnet
- Koordinatensuche ergänzt die Geländehöhe über Open-Meteo; das Widget verwendet zusätzlich die Vorhersagehöhe als Rückfall und zeigt nicht mehr fälschlich 0 m an
- Widget-Auswahl für Tage, Layout, Wind, Niederschlag und Hazards wird direkt im React-Zustand aus dem lokalen Speicher wiederhergestellt und bei jeder Änderung gespeichert

## 0.7.1

- alle wesentlichen Reihen der 14-Tage-Temperatur- und Niederschlagsdiagramme lassen sich direkt über die Legende einzeln ein- und ausblenden; die Auswahl wird lokal gespeichert
- Tagesdetaildiagramm um einen kompakten stündlichen Verlauf der Gesamtbewölkung einschließlich Wert der gewählten Stunde ergänzt
- Abruf amtlicher Warnungen für Desktop-Browser durch CORS-sicheren Neuversuch, HTTPS-Normalisierung, Cache-Umgehung und verständlichere Fehlermeldung stabilisiert
- Ortssuche akzeptiert Dezimalkoordinaten, deutsche Dezimalkommas sowie N/S/E/W-Angaben und ergänzt den Ortsnamen per Reverse-Geocoding
- Widget-/PNG-Generator speichert Tage, Layout und sichtbare Parameter; angezeigter Ortsname und PNG-Dateiname können je Standort angepasst werden
- Fehler bei der GeoSphere-GeoJSON-Zuordnung behoben: `properties.station` wird nun als Stations-ID erkannt
- GeoSphere Austria/TAWES zusätzlich serverseitig in den gemeinsamen Cloudflare Worker integriert
- Worker nutzt bei nicht verfügbaren Detailparametern automatisch einen reduzierten TAWES-Parametersatz
- mehrere passende österreichische Stationen werden im Frontend robust und höhengewichtet zusammengeführt
- Windwerte aus dem direkten TAWES-Abruf werden vor der Stationsmittelung korrekt von m/s in kt umgerechnet
- METAR- und Stationszeitstempel aus ISO-Text, Unix-Sekunden oder Unix-Millisekunden werden einheitlich normalisiert
- Worker-Diagnose ergänzt GeoSphere Austria einschließlich `sourceRows` und möglicher Abruffehler

## 0.7.0

- optionale hyperlokale Stationsnetze Netatmo, Synoptic Data und Xweather zusätzlich zu Weather Underground integriert
- weiterhin nur ein gemeinsamer Cloudflare Worker für Stationsdaten und amtliche Warnungen erforderlich
- aktuelle Beobachtungen aus mehreren geeigneten Stationen werden entfernungs-, höhen-, aktualitäts-, QC- und anbietergewichtet zusammengeführt
- robuste Median-/Abweichungsfilter entfernen einzelne Stationsausreißer vor der Mittelung
- zirkuläre Mittelung der Windrichtung ergänzt
- Stationsanzeige nennt Anzahl und Quellen des lokalen Mittels sowie die Temperaturstreuung
- ENS-Mittel für Tmin/Tmax im 14-Tage-Diagramm über die Legende ein- und ausblendbar
- klimatologisches Tmin-/Tmax-Mittel 1991–2020 aus ERA5-Land ergänzt und über die Legende schaltbar
- Klimadaten werden kalendertagsbezogen verdichtet und 180 Tage lokal zwischengespeichert
- Worker-Gesundheitstest zeigt aktivierte optionale Datenanbieter ohne Offenlegung von Secrets

## 0.6.2

- weiterhin nur ein gemeinsamer Cloudflare Worker für weltweite METAR-Stationsdaten und amtliche Warnungen erforderlich
- weltweiten NOAA-AviationWeather-METAR-Abruf vom veralteten Parameter `hours` auf `hoursBeforeNow` umgestellt
- Stationsantwort um Diagnosewerte für Radius, Trefferzahl und Providerfehler ergänzt
- Länderbezeichnungen aus Suche und lokal gespeicherten Orten auf ISO-Zweibuchstabencodes normalisiert und alte Ortsdaten automatisch migriert
- Länderermittlung im Worker um Orts-/Regionsauswertung, BigDataCloud-Reverse-Geocoding und konservative geografische Rückfälle ergänzt
- Cagliari/Sardinien wird zuverlässig dem italienischen MeteoAlarm-Feed zugeordnet
- MeteoAlarm-Atom/CAP-Parser unterstützt nun eingebettete beziehungsweise XML-maskierte CAP-Meldungen, `content src` und relative CAP-Verknüpfungen
- Regionsbegriffe Sardegna, Sardinia und Sardinien für die örtliche Warnungszuordnung gleichgesetzt

## 0.6.1

- Abruf deutscher Warnungen auf den offiziellen DWD-WFS-Layer `dwd:Warnungen_Gemeinden` umgestellt
- exakte standortbezogene Filterung über die amtlichen Warnpolygone
- DWD-CAP-Atom-Feed als automatische Rückfallquelle beibehalten
- MeteoAlarm-Atom/CAP-Abruf nach Ort, Bezirk und Region priorisiert
- Zahl externer CAP-Unteranfragen begrenzt, damit der Cloudflare-Free-Worker nicht das Subrequest-Limit überschreitet
- Worker-Endpunkt `?mode=health` und Versions-/Zeitangaben zur Diagnose ergänzt
- GitHub-Actions-Workflow bindet `VITE_METAR_PROXY_URL` und `VITE_ALERT_PROXY_URL` aus Repository-Variablen ein
- Fehler aus dem Warnungsproxy werden im Dashboard nicht mehr als scheinbare Entwarnung behandelt

## 0.5.7

- kontinuierliche Farbskala für Prognosekonsistenz (0–100 %)
- Konsistenzpunkte farblich exakt nach Prozentwert interpoliert
- Schaltflächen für hohe/mittlere/geringe Konsistenz entfernt
- kompakte Farbverlaufslegende ergänzt

## 0.5.6

- Linie der gefühlten Temperatur im hellen Layout deutlich kontrastreicher dargestellt
- Legendenmuster für die gefühlte Temperatur an die neue Linienfarbe angepasst
- Warntexte und Warnflächen im hellen Layout für Gelb, Orange, Rot und Violett kontrastreich überarbeitet
- grüne Entwarnung im hellen Layout ebenfalls besser lesbar gestaltet

## 0.5.5

- Groß-/Kleinschreibung in sekundären Tageswetterhinweisen korrigiert, z. B. „leichter Sprühregen“ statt „leichter sprühregen“.
- 7-Tage-Tageszeilen in Hoch- und Querformat neu gerastert, um Überlappungen zwischen Wetterbeschreibung, Tmin/Tmax und Temperaturbalken zu verhindern.
- Wettertexte erhalten einen klar begrenzten, umbrechenden Bereich; der Temperaturbalken wird auf schmaleren Displays in einer eigenen Zeile dargestellt.

## 0.5.4

- Bewölkung in aktuellen Daten und Stunden-Tooltip auf n/8 umgestellt
- Tageswettercharakter auf eine gewichtete stündliche Auswertung umgestellt
- Niederschlagsereignisse werden nur bei ausreichender Dauer, Menge oder Wahrscheinlichkeit zum dominierenden Tagescharakter
- kurze Ereignisse mit geringer Wahrscheinlichkeit erscheinen nur als sekundärer zeitbezogener Hinweis

## 0.5.3

- Niederschlagsklassifikation zentral und strikt nach WMO-Wettercodes überarbeitet
- Sprühregen ausschließlich für WMO 51/53/55, gefrierender Sprühregen ausschließlich für 56/57
- normaler Regen für 61/63/65 und gefrierender Regen für 66/67 eindeutig getrennt
- Regenschauer 80/81/82, Schneefall 71/73/75, Schneegriesel 77 und Schneeschauer 85/86 eindeutig getrennt
- zusätzliche Unterstützung für WMO-Mischcodes 68/69 (Schneeregen) sowie 83/84 (Schneeregenschauer)
- Gewitterniederschlag und Gewitter mit Hagel getrennt
- gemischte Niederschlagsformen werden nur bei gleichzeitig messbaren flüssigen und festen Anteilen abgeleitet

## 0.5.2

- Niederschlagsarten anhand von WMO-Code, Regen-, Schauer- und Schneefallkomponenten neu klassifiziert
- Sprühregen wird nicht mehr als pauschaler Fallback verwendet
- Kurzfristkarte zeigt Niederschlagsart sowie voraussichtlichen Beginn und das Ende auf Basis der 15-Minuten-Best-Match-Daten
- Radarzeitleiste innerhalb der DWD-Radarabdeckung bis +60 Minuten erweitert; außerhalb werden optionale RainViewer-Nowcast-Frames verwendet

## 0.5.1

- Stunden-Navigation der Detailansicht springt an Tagesgrenzen automatisch zum angrenzenden Tag
- 23:00 Uhr → nächster Tag 00:00 Uhr; 00:00 Uhr → vorheriger Tag 23:00 Uhr
- Niederschlagsart Drizzle projektweit als „Sprühregen“ bezeichnet

## 0.5.0

- stündliche Kachelmatrix entfernt und durch dauerhaft sichtbare, kompakte Stunden-Detailanzeige am Diagramm ersetzt
- Stundenwahl erfolgt durch Klick ins Diagramm oder Vor-/Zurücknavigation im Tooltip
- UVI verwendet ausschließlich den tatsächlich erwarteten, bewölkungsberücksichtigten Open-Meteo-Wert; Klarhimmelvergleich und zusätzliche Eigenkorrektur entfernt
- Niederschlag aus dem Tooltip für Temperaturtrend und Prognoseunsicherheit entfernt
- Minor-Release wegen substanzieller Änderung der Bedienstruktur

## 0.4.9

- restriktives Versionsschema dokumentiert; diese Änderung bleibt ein Patch-Release
- 14-Tage-Tooltip klar in Best Match, ENS-Mittel, P10–P90, Niederschlag und Prognosekonsistenz gegliedert
- große stündliche Detailkarten entfernt und durch ein kompaktes Tooltip direkt am Tagesdiagramm ersetzt
- Tooltip erscheint beim Klick auf eine Stunde im Diagramm oder auf eine Stundenkachel
- UV-Logik korrigiert: tatsächlicher cloud-adjustierter Open-Meteo-UVI ist Primärwert; Klarhimmel-UVI wird nur als Vergleich/Fallback verwendet
- UV-Fallback um Wolkenschichten, Sichtweite, Wetterzustand und mögliche Cloud-Enhancement-Situationen erweitert

## 0.4.8

- Tooltip-Reihenfolge im 14-Tage-Temperaturtrend bestätigt und konsistent belassen
- UV-Index auf effektive Werte umgestellt: bewölkungs- und wetterkorrigierte Anzeige statt unkorrigierter Rohwerte
- UV-basierte Hazard-Logik und Tages-Hazards greifen nun auf die effektiven stündlichen UV-Werte zurück

## 0.4.7

- Tooltip im 14-Tage-Temperaturtrend angepasst: "Best Match Tmin/Tmax" statt Minimum/Maximum
- ENS-Mittel im Tooltip getrennt für Tmin und Tmax ausgewiesen

## 0.4.6

- Hazard-Schwellen überarbeitet: farbige Abstufung orientiert an DWD, Meteoalarm und NWS
- Niederschlagsformen in der 7-Tage-Detailansicht erweitert und vereinfacht benannt: Regen, Schauer, Schnee, Schneeschauer, Schneeregen und Schneeregenschauer
- dynamische Detail-Legende für Niederschlagsarten ergänzt
- Hochformat-/Mobil-Lesbarkeit bei langen Bezeichnungen verbessert

# Changelog

## 0.4.4

- Header bereinigt: neben dem Logo wird nur noch die Versionsangabe angezeigt
- Detailansicht um Niederschlagswahrscheinlichkeits-Linie und kompakte Legende erweitert
- Hazard-System auf vier Warnstufen (gelb, orange, rot, violett) erweitert
- zusätzliche Hazard-Prüfung für UV-Index sowie feinere Stufen für Böen, Starkregen, Hitze, Frost und Gewitter
- tägliche Hazard-Pills in 7-Tage-Ansicht und Widget entsprechend erweitert

## 0.4.3

- HTML-Seitentitel auf „MID - Meteorological Information Dashboard“ gesetzt
- MID-Logo in Header und als Favicon eingebunden
- Versionsnummer auch in der kompakten mobilen Kopfzeile sichtbar
- 14-Tage-Niederschlagsdiagramm zeigt die Best-Match-Niederschlagsmenge des Ortes statt des Ensemble-Mittels
- mobile Kopfzeile für Hochformat angepasst; Reload- und Lokalisierungs-Buttons sauber ausgerichtet
- README und Changelog aktualisiert

## 0.4.2

- Autolokalisierung benennt den Standort nach Geodatenbank und kennzeichnet dies deutlich
- helle Layout-Umschaltung auch im mobilen Layout sichtbar
- Niederschlagswahrscheinlichkeit im 14-Tage-Niederschlag per Legende ein-/ausblendbar
- Widgets nochmals kompakter gestaltet
- Tooltip im 14-Tage-Temperaturtrend zeigt für Best Match Min-/Max-Werte

## 0.4.1

- Changelog-Link im Footer
- leerer Erststart ohne Standardort; lokales Merken des zuletzt gewählten Ortes
- kombinierte Wind-/Windrichtungskachel bei den aktuellen Daten
- kompaktere mobile Kacheln
- Feinschliff der 14-Tage-Ensemble-Darstellung
- Niederschlagswahrscheinlichkeit in der 14-Tage-Übersicht und im Niederschlagstrend
- adaptive PNG-Abmessungen und kompakte nebeneinanderliegende Widget-Tage

## 0.4.0

- Suchfeld ist beim ersten Aufruf leer und dient nur der gezielten Orts-/Standortsuche
- stündliche Wetterpiktogramme in der Detailansicht ergänzt; aktuelle Stunde wird standardmäßig vorausgewählt
- stündliche Kacheln in der Detailansicht um Windrichtung und Wind erweitert
- Detaildiagramm größer und besser lesbar skaliert
- Widget-/PNG-Generator gestalterisch an das übrige MID-Design angepasst
- neue Option zum Ein-/Ausblenden von Hazards im Widget und PNG-Export

## 0.3.9

- Persistente 14-Tage-Ensemble-Übersicht
- korrigierte Open-Meteo-Ensemblemodell-IDs
- standortbezogene Modellwahl und Gewichtung
- robuster P10–P90-Ausreißerfilter und Ensemble-Mean-Fallback
- direkt anklickbares Tagesdiagramm mit separater Niederschlagswahrscheinlichkeit
- gefühlte Temperatur in Hitze-Hazards
- kompakteres responsives Layout
- erweiterter WMO-/METAR-Stationsabgleich

## 0.3.8

- 14-Tage-Ensemble-Kachelübersicht mit Konsistenzpunkten
