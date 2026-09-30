# MID Qualitäts- und Quellenprüfung – v0.8.20.0

Stand: 30.07.2026

## 1. Blitzdaten von nowcast/LINET

### Ergebnis

nowcast bietet LINET-Blitzdaten als professionellen, vertraglich bereitgestellten Datenservice an. Dokumentiert sind Pull-Zugänge über SFTP, HTTPS und SOAP über HTTPS sowie Push-Zugänge über FTP/SFTP; die Daten werden als XML oder CSV geliefert. LINET view ist eine Kunden-Webanwendung mit Einzelblitzen, Zelltracking, ETA/ETD und Exportfunktionen. Ein frei dokumentierter, anonymer Browser- oder REST-Endpunkt für die Übernahme in MID wurde nicht gefunden.

### Konsequenz für MID

- Kein Scraping von LINET view und keine Verwendung undokumentierter interner Endpunkte.
- Eine belastbare Integration ist technisch möglich, sobald nowcast Zugangsdaten und die konkrete Schnittstellenspezifikation bereitstellt.
- Die Integration muss serverseitig im MID-Worker erfolgen; Zugangsdaten dürfen nicht in das Frontend gelangen.
- Benötigter Mindestdatenvertrag: Zeit, Breite/Länge, Blitztyp, Amplitude, Wolkenblitzhöhe und Qualitätskennzeichen. Für Zellprodukte zusätzlich Zell-ID, Bewegungsvektor, ETA/ETD, Intensität und Prognosegeometrie.
- Bis dahin bleiben DWD NowCastMIX/KONRAD3D, DWD NCEW, MTG-LI und optional lizenzierte Xweather-/GLD360-Daten die aktiven Quellen.

## 2. Hyperlokale Analyse

### In v0.8.20.0 umgesetzt

1. **Physische Stationsentdopplung**
   - dieselbe Messstelle aus DWD/Bright Sky, METAR oder einem weiteren Spiegel wird nicht mehr mehrfach gewichtet;
   - Zusammenführung über Stationskennung, Position, Höhe, Messzeit und Temperaturplausibilität;
   - gleichlautende Kennungen an weit entfernten Standorten werden nicht versehentlich zusammengeführt.

2. **Richtungsfeld statt linearem Windmittel**
   - die lokale Windrichtung wird als zirkuläres Restfeld gegenüber dem Best-Match-Hintergrund analysiert;
   - der Übergang 359°/0° bleibt korrekt;
   - schwacher Wind erhält weniger Gewicht.

3. **Thermodynamische Konsistenz**
   - Temperatur, Taupunkt und relative Feuchte werden abschließend gemeinsam plausibilisiert;
   - Taupunkt kann die Lufttemperatur nicht überschreiten;
   - widersprüchliche Feuchte-/Taupunktpaare werden konsistent zusammengeführt.

4. **Wind-/Böenkonsistenz**
   - die finale hyperlokale Wind-/Böenkombination durchläuft dieselbe Paarprüfung wie die übrige App;
   - Böen können nicht unterhalb des Mittelwinds liegen.

5. **Qualitätsabhängige Feldfreigabe**
   - Sichtweite, Bewölkung, Wolkenuntergrenze, Ceiling und Niederschlag werden nur aus amtlichen bzw. professionellen Quellen in das lokale Restfeld übernommen;
   - Bürger- und PWS-Daten bleiben für geeignete Temperatur-/Feuchtefelder nutzbar, bestimmen aber keine flugmeteorologisch sensiblen Felder.

6. **Weniger redundante Abrufe**
   - GeoSphere und Bright Sky werden nicht mehr grundsätzlich parallel zum bereits aggregierenden MID-Worker doppelt abgefragt;
   - direkte Abrufe dienen nur als Rückfall, wenn die betreffende Quelle im Workerergebnis fehlt;
   - der zweite, umfangreichere Stationslauf erfolgt nur noch bei geringer Quellendichte, hoher Unsicherheit oder großer effektiver Entfernung.

### Empfohlene nächste Quellenausweitungen

Priorität A:
- direkter DWD-Open-Data-Fallback aus aktuellen SYNOP-/POI-Daten, unabhängig von Bright Sky;
- numerische Assimilation des MTG-Satelliten-Wolkenprodukts statt rein visueller Darstellung;
- zeitlich einheitliche Niederschlagsintervalle, da 10-, 15- und 60-Minuten-Messungen derzeit nicht durchgängig denselben Bezugszeitraum besitzen.

Priorität B:
- weitere amtliche nationale Stationsnetze, sofern anonyme oder vertraglich nutzbare Schnittstellen vorliegen;
- Geländesichtbarkeit und Exposition je Messstation aus DEM/Landnutzung, besonders für Wind, Nebel und nächtliche Kaltluft;
- rückblickende stationsbezogene Bias-Kalibrierung getrennt nach Tageszeit, Wetterlage und Jahreszeit.

## 3. App-weite Prüfung

### Sofort umgesetzt

- unnötige Doppelabrufe im Stationspfad reduziert;
- Qualitätskriterien entscheiden über einen zweiten Analyseabruf;
- Quellenalias-Dopplungen werden vor der Gewichtung entfernt;
- sensible Felder erhalten strengere Quellenanforderungen;
- physikalische Endkontrollen verhindern inkonsistente Kombinationen.

### Wichtigste weitere Potenziale

1. **Quellenregister zentralisieren**
   - Endpunkte, Cachezeiten, Lizenz, räumliche Abdeckung und Gesundheitsstatus liegen derzeit über mehrere Module verteilt.
   - Ziel: ein gemeinsames Quellenregister mit Circuit Breaker, Fehlerbudget und transparenter Diagnose.

2. **Große Kernmodule aufteilen**
   - `App.tsx`, `weather.ts` und `styles.css` sind sehr groß.
   - Ziel: fachliche Teilmodule für Suche, Stationsassimilation, Nowcast, Warnungen, Diagramme und Quellenstatus. Das reduziert Build- und Regressionrisiken.

3. **Einheitlicher Zeit- und Mengenvertrag**
   - jede Beobachtung sollte Messzeit, Gültigkeitszeitraum, Akkumulationsdauer und Einheit explizit tragen.
   - Besonders wichtig für Niederschlag, Sonnenschein, Böen und Blitzraten.

4. **Stale-while-revalidate appweit vereinheitlichen**
   - vorhandene Caches arbeiten teilweise mit unterschiedlichen Schlüsseln und Zeitgrenzen.
   - Ziel: gemeinsame Cachemetadaten mit Datenalter, Quelle, letzter erfolgreicher Aktualisierung und Rückfallqualität.

5. **Automatische Quellen-Gegenprüfung**
   - für Temperatur, Bewölkung, Wind und Niederschlag sollten Abweichungen zwischen Best Match, amtlichen Stationen, Radar und Satellit dauerhaft erfasst werden.
   - Daraus kann der lokale Wetterzwilling quellen- und wetterlagenabhängige Vertrauenswerte lernen.

6. **Buildsicherheit**
   - zusätzlich zu den Regressionstests sollte im lokalen Arbeitsprozess möglichst immer ein realer `tsc -b && vite build` mit installierten Abhängigkeiten laufen.
   - Die GitHub-Pipeline bleibt die verbindliche vollständige Produktionsprüfung.
