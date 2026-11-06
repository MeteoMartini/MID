# MID C438 · ruhiger Kartenrand, kurze Kurzfristzeile, regionale Wetterlagen

Basis: main=mid-stable v0.9.85.437, 1301b311f4b17841569d0ab0bbcbd6cdb5deedbe. PR670 und Installer42172316849 vollständig erfolgreich, inklusive Source-Gate, drei originaler RUC-Läufe, Worker, Pages und Finalize. Parallele offene Drafts live erneut geprüft; kein ungeprüfter Fremdstand übernommen.

## Kartenrand und Kurzfrist

Touch-/Mausfokus des MapLibre-Canvas bzw. der Kompositkarte erhält keinen farbigen Browserrahmen. Der strukturelle Kartenrand wird neutral und dezent; Tastaturfokus bleibt separat sichtbar. Keine Radar-/Satellitenpixel, NoData-Masken, Abdeckung oder amtliche Originalkontur wird verändert. Die Cloud-Browserprüfung konnte die Karte wegen fehlender WebGL-Unterstützung nicht rendern; deshalb keine reale iOS-/Safari-Abnahme behauptet. Die bestehende echte Karten-Browsermatrix erhält zusätzliche Pointer-/Tastatur-Fokusprüfungen.

Die Teilabdeckungszeile lautet „Keine markanten Signale in den verfügbaren Daten.“ Der technische 24h-Abdeckungszusatz entfällt. Vollständigkeits-, Intervall-, Missing- und Extremwertlogik bleibt unverändert; eine ausdrückliche Entwarnung für die nächsten24h bleibt weiterhin an vollständige gültige Daten gebunden. Drei bestehende sprachliche Tests aktualisiert; ihre fachlichen Negativfälle bleiben erhalten.

## Aufnahme von DWD / ECMWF

- DWD-WLK: offizieller regionaler Zirkulationsindex mit40 Klassen; 12UTC-Analyse und native Vorhersagevorläufe0/12/24/36/48/60/72/96/120/144/168h. Keine lokale Wetterprognose, keine Warnung, keine zusätzliche Best-Match-Stimme. Klasse und fünfstellige Kennung werden gemeinsam verifiziert, nicht aus MID-Wetterwerten rekonstruiert. XX bedeutet unbestimmte Hauptadvektion, nicht kreisförmiger Wind. Feuchteklasse ist eine Luftmasseneigenschaft, keine lokale Trocken-/Regenzusage.
- Nur in erweiterter Ansicht des Witterungstrends/46d, unterhalb der bestehenden Wochenvorhersage. Lazy-Komponente, keine neuen Abfragen in der Basisansicht. Konservative MID-Relevanzfenster für diesen regionalen Kontext: DWD47–55,76°N/5–16°E, innerhalb des veröffentlichten DWD-Eingangsgitters. Euro-atlantischer Quellenkontext30–75°N/25°W–45°E. Das sind ausdrücklich UI-Relevanzfilter, keine Behauptung offizieller lokaler Modellgebiete. Außerhalb erscheint kein unpassender Regimeblock. Favoriten ohne Länderkennung funktionieren anhand der Koordinaten.
- DWD-Grafik: native Zeitleiste mit Advektionspfeil, Feuchteklasse, Hoch-/Tiefdruckprägung; genaue UTC-Provenienz, lokale/UTC-Anzeige aus dem gemeinsamen Zeitformatter. Keine Interpolation fehlender Klassen. 950-/500hPa-Charakter und Originalklasse im aufklappbaren Detail. 44px-Ziele, Tastaturfokus, horizontales Scrollen innerhalb der Zeitleiste, Light/Dark.
- ECMWF: vier Euro-Atlantik-Regime NAO+/NAO−/Blocking/Atlantic Ridge und nicht zugeordnete Mitglieder. Offizielle Unterlagen nennen etwa6Wochen,101 Mitglieder und7-Tage-Mittel. Das ist kein Punktprodukt. CC BY4.0 plus ECMWF-Zusatzbedingungen verlangen Attribution; öffentliche Chart-HTML-Ausgabe enthält laufabhängige temporäre SVG-URLs und teilweise „unavailable“. Webzugriff zeigte auch eine Anubis-Sperre. Deshalb kein fragiles Hotlinking, kein Iframe, kein aus Grafiken zurückgerechneter Prozentwert und keine vorgetäuschte numerische ECMWF-Integration: erweiterte Ansicht bietet den offiziellen, nutzerinitiierten Originalgrafik-Zugang mit Vorhersagen. Ein dauerhaft dokumentierter numerischer Regime-Feed bleibt eine getrennte spätere Qualifikation.

## Quelle, Zeit, Cache, Kosten

Offiziell live gelesen: DWD-WLK-Vorhersagedatei, text/plain;charset=UTF-8,2.281.783Bytes, letzter Originaldatensatz20261105/12UTC, SHA256 c51e0de61a0d3c090993eafe965f1170ad7c29199f58441deee0c67c7b72603f. Quellenprobe und alle40 unabhängig aus Originaldaten beobachteten Klasse/Kennung-Paare in c438/. Die Quelldatei selbst wird nicht als2MB-Appasset ausgeliefert.

Neuer additiver Worker-GET-Modus dwd-weather-regimes: fester DWD-Endpunkt, keine frei wählbare URL, keine Favoritenkoordinaten im Transport, ein globaler Abruf mit Inflight-Zusammenführung, eine Stunde erfolgreicher Cache, maximal4MB Quelldaten, Date/Lead/Class/Code-Prüfung. Fehler werden nicht als Erfolg gecacht. Maximal48h Analysealter und10min Uhrtoleranz sind konservative MID-QA-Regeln, keine amtlichen Wetter- oder Warnschwellen. Client validiert Schema, Herkunft, SHA-Format, exakte12UTC-Analyse, native Vorläufe und Klassen erneut. Keine veralteten Ersatzwerte über der Altersgrenze; sichtbare Daten laufen spätestens am Ablaufzeitpunkt aus. Stündliche/Foreground-Aktualisierung und Abort-/Timer-Cleanup. Keine neue kostenpflichtige Infrastruktur, kein zusätzliches Tracking und kein Eingriff in Fusion/Warnings/RUC-Pipelines.

Primärquellen:
- https://www.dwd.de/DE/leistungen/wetterlagenklassifikation/wetterlagenklassifikation.html
- https://www.dwd.de/DE/leistungen/wetterlagenklassifikation/beschreibung.html
- https://www.dwd.de/DE/leistungen/wetterlagenklassifikation/gitter.html
- https://www.dwd.de/DE/leistungen/wetterlagenklassifikation/online_wlkvorhersage.txt?view=nasPublication&nn=16102 (enthält die tatsächliche Vorlauf-Formatbeschreibung am Ende)
- https://charts.ecmwf.int/products/extended-regime-probabilities?forecast_from=latest
- https://apps.ecmwf.int/datasets/licences/general/

## QA-Stand

Gezielte Kurzfristtests und40-Klassen-/Provenienz-/UTC-/Missing-/Frische-/Cache-/Fehler-/Regionsprüfungen lokal erfolgreich. App-TypeScript erfolgreich. Zusätzliche echte Browserabnahme für320/390/768/844/1024/1440px in Light/Dark, Basis-/Erweitert-Modus, Regionen, Touch/Fokus und Overflow implementiert und im Pflichtinventar. Lokaler Chromium-Start bleibt durch Socket-/ptrace-Verbot blockiert; kein lokales Browser-Gesamtgrün behauptet. Produktionsbuild/Budgets und vollständige Source-/Installer-/Worker-/Pages-/Stable-Gates müssen auf dem endgültigen SHA erfolgreich sein. Kein Bypass, keine physische iOS-/VoiceOver-Abnahme behauptet.

Lokaler Produktionsbuild erfolgreich:133 Dateien, Code/Text gzip1.888.350 B, statische Medien4.593.259 B. RadarPanel140,30kB, neues Wetterlagenmodul5,80kB JS und1,82kB CSS ausschließlich lazy; alle bestehenden globalen und Feature-Budgetgrenzen unverändert eingehalten. App-/Tooling-TypeScript, Worker-Syntax und gezielte fachliche Tests bestanden. Kein vollständiges lokales Browsergrün behauptet.
