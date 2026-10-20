# MID-C37 · Sonnenschein-Viertelstunden · .304

Basis main=mid-stable=6c3137426f332fb86369ac8f82783180a8b2f296, .303. Installer39410945206 erfolgreich, Kern1003/1003 in857,3s und fünf Heavygruppen grün, Pages1 erfolgreich, Stable-Promotion11:09UTC bestätigt. Keine Änderung am parallelen Draft425.

## Reproduktion und Korrektur

Bei der Fortsetzung von #428 wurde ein unabhängig korrigierbarer Akkumulationsfehler gefunden: minutelySunshineValuesForHour suchte Viertelstunden mit gleichem Stundenpräfix. Die tatsächliche mapHours-Regression auf unverändertem .303 ergab3100 statt1000 Sekunden am11:00-Endstempel. 11:15/30/45 lagen in der Zukunft dieses Rohintervalls. Ein vorheriger Teststart während npm ci schlug mitETXTBSY fehl; das war ein Umgebungs-/Installationszustand, kein roter Produktnachweis. Erst die numerische Assertion3100≠1000 ist der Red-Beleg.

Der neue gemeinsame Selektor sunshineQuarterValuesForHour fordert exakt die vier Endstempel T−45/30/15min,T innerhalb(T−60min,T]. Ungeordnete Quellen werden sortiert; Dubletten, Lücken oder Offgrid-Endstempel verhindern eine Ersetzung. Unbekannte Viertelstunden lassen den vorhandenen Stundenwert greifen. Die bereits gültige Begrenzung0–900s jeViertel und0–3600s jeStunde bleibt bestehen. Keine Rohdatenmutation, keine Änderung von Niederschlag, nativen15min-Werten, Skybar-Klassen, Eventzeiten oder Symbolgrenzen.

Raw Open-Meteo-ISO-Endstempel werden ausschließlich für diese Zuordnung mit dem festen Antwortoffset verglichen; expliziteOffsets bleiben absoluteInstants. Das ist keine vollständige Migration der aktuellen/stündlichen Zeitparser, Dailyprodukte oder Caches. #428 bleibt ausdrücklich offen. Die fortgesetzte Migration muss all diese Grenzen und abgeleitete Ensemble-/Modellprodukte zusammen prüfen.

## Dokumentationsabgleich

Context7/Primärquelle https://open-meteo.com/en/docs/dwd-api benennt sunshine_duration als Summe der vorangegangenen Stunde bzw.15Minuten. Gleicher Vertrag auf https://open-meteo.com/en/docs/gfs-api und /gem-api. Die festeAntwortoffset-Semantik ist zusätzlich unter /cma-api und /jma-api dokumentiert. Kein neuer WMO-Schwellenwert oder Datenprovider eingeführt.

## Prüfung

Dynamische Pflichtregression mit echten mapHours/mapMinutely15, Lücken, Dubletten, Offgrid, Null, ungeordneter Eingabe, gemischten explizitenISO-Offsets, nativenViertelstunden und unveränderter Quelle. Direkter Selektor zusätzlich über beideDST-Wechsel, Mitternacht und+05:45/−03:30. Weitere Gates erst nach tatsächlichem Abschluss ergänzen. Browser-/physischeiOS-/WKWebView-/VoiceOver-Evidenz aus .303 wird nicht als neue .304-Abnahme umetikettiert.

Der erste lokale Build enthielt übernommene alte dist-Assets zusätzlich zu neuen (167 statt115); die unveränderte Budgetprüfung meldete deshalb2.941.241B Main-JS. Das gesamte eigene gemischte dist wurde recoverable außerhalb des Repos aufbewahrt und sauber neu gebaut (115Assets). Ein noch laufender erster Suiteversuch meldete während dieses Neubaus zusätzlich fehlende Warnzeit-CSS-Regeln. Gleichzeitige Aggregatgenerierung ist dafür die naheliegende Erklärung; ein Dateitrace wurde nicht erfasst. Nach Buildabschluss bestehen Budget- und Warnzeitprüfung unverändert. Der erste Lauf wurde über seine Session abgebrochen (Exit130), nicht als bestanden gewertet. Kein Budget/Test verändert. Die erneute Vollsuite läuft erst nach abgeschlossenem sauberem Build; ihre Ergebnisse sind maßgeblich.

Finale .304 umfasst zusätzlich die ausdrücklich angeforderte natürliche7d-Sprache. Build/Typen/Worker-Syntax und Audit erfolgreich. Lokale Suite: alle1008 ausgeführt in2101,7s;1007 erfolgreich, ein alter exakter Gewittertextvergleich anschließend korrigiert. Abschließende gezielte Nachprüfung7/7 grün, einschließlich tatsächlicher Sonnenschein-Mapping- und gemeinsamerSkybar-Fälle. Details/Belege im begleitenden MID_C37_NATURAL_SUMMARY_0.9.85.304.md. Der Vollsuite-Lauf mit dem alten Textvergleich wird nicht nachträglich als vollständig grün bezeichnet. Vollständiger Source-/Installer-Gate bleibt vor Veröffentlichung verbindlich. #428 und physische/öffentliche Live-Abnahmen bleiben gesondert offen.
