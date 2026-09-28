# MID v0.9.0.0 – professionelles Synoptik- und Frontmodul

## Versionsbewertung

Die Fortschreibung auf **0.9.0.0** ist sachlich erforderlich, weil MID nicht nur eine weitere Karte erhält, sondern ein eigenständiges professionelles Teilsystem mit neuer Worker-API, objektiver Multimodell-Frontdiagnostik, Ereignisarchiv, Assimilation und persönlicher Auswirkungslogik. Die bestehende Best-Match-, Wetterzwilling-, Nowcast-, Ensemble- und Verifikationsarchitektur bleibt die Grundlage und wird nicht dupliziert.

## Ausbaustufe 1 – amtliche Referenz und verständlicher Wetterwechsel

- unveränderte amtliche DWD-Bodenanalyse als klar gekennzeichnete Referenz
- separate interaktive MID-Karte mit vorhandenen Modellisobaren und Druckzentren
- Stationsplots aus offiziellen beziehungsweise professionellen Beobachtungsnetzen
- kompakte Karte „Nächster markanter Wetterwechsel“
- Vorher–Während–Nachher-Darstellung
- sichtbarer Datenstand und Quellenkennzeichnung

## Ausbaustufe 2 – objektive Frontdiagnostik und Timing

- vollständige Modellfelder von DWD ICON-EU, ECMWF IFS und NOAA GFS
- Frontkandidaten aus Temperatur- und Taupunktgradienten, Druckrinne, Winddrehung, Bewölkung und Niederschlagsstützung
- verbindliche Kennzeichnung: **„MID-Frontkandidat · objektive Modellanalyse“**
- Fronttyp- und Timingübereinstimmung mehrerer Modelle
- stromaufwärtiger Beobachtungskorridor
- begrenzte Beobachtungs- und Radarassimilation des Fronttimings
- ereignisbezogene Timingverifikation

## Ausbaustufe 3 – lokales Alleinstellungsmerkmal

- standortgebundenes Analogarchiv verifizierter Frontpassagen
- Unsicherheitsbudget nach Modell-Timing, Fronttyp, Beobachtungsdichte, Datenalter, Analogfällen und Nowcast
- persistente Ereignisobjekte mit Lebenszyklus: erkannt, annähernd, Durchgang, abziehend, verifiziert oder nicht mehr aktiv
- erklärbare Kausalkette für Timing- und Prognoseänderungen
- persönliche Auswirkungen anhand der bestehenden Wetterzwilling-Aktivitätsprofile

## Responsive Architektur

- kompakter Standardmodus ohne technische Überlastung
- vollständige Diagnostik nur im erweiterten Modus
- Kartenhöhe über `clamp()` statt fester Desktopgröße
- automatische Einspalten-Darstellung für Tablet und Smartphone
- Phasen-, Auswirkungs-, Modell-, Stations- und Unsicherheitsraster mit flexiblen `minmax()`-Spalten
- keine horizontale Mindestbreite des Gesamtmoduls

## Worker-Erweiterungen

- `mode=synoptic-analysis`
- `mode=dwd-surface-analysis-image`
- automatische Ermittlung und CORS-sichere Weitergabe des aktuellen amtlichen DWD-Kartenbildes
- objektive Multimodell-Frontdiagnostik
- Beobachtungskorridor und Timing-Assimilation

## Schutz bestehender Funktionen

Unverändert angebunden bleiben insbesondere:

- Best Match als operative Hauptprognose
- kohärente Wetterbündel und Reparaturstrategie
- lokaler Wetterzwilling und Standortprofil
- Prognoseverifikation
- Szenariocluster und Ensemble-Konsistenz
- Modelllaufänderungsradar
- Radar-, Blitz- und Gewitternowcasting
- Modellkonturen, Isobaren und Druckzentren des Kompositmoduls
