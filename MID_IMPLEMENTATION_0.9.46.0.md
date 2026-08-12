# MID v0.9.46.0 – Events/Flugwetter: amtliche Hazardquellen

## Event-Center

- Kompakte Böenangabe verwendet jetzt appweit konsistent **G** (Gusts) statt **B**.

## Flugmeteorologische Hazard-Fusion

Die Aktivität **Flug** kombiniert die bestehende MID-Druckniveaudiagnostik nun mit amtlichen, zeit- und ortsbezogenen Flugwetterprodukten. Amtliche Signale haben bei gleicher oder höherer Gefahrenstufe Vorrang in der sichtbaren Hazardbewertung.

### Ohne zusätzliche Zugangsdaten

- **ICAO International SIGMET** weltweit über NOAA AviationWeather/AWC; die Meldungen stammen aus den nationalen Meteorological Watch Offices.
- **TAF** nationaler Provider weltweit über den internationalen AWC-Austausch.
- Bei Nahterminen zusätzlich **METAR/SPECI** sowie **PIREP/AIREP**.
- In den USA zusätzlich die jeweils räumlich zuständigen **US SIGMET, G-AIRMET, AIRMET Alaska, CWA und TCF**.

### Mit autorisiertem Worker-Secret

- `MID_WIFS_API_KEY`: **WAFS SIGWX** aus den IWXXM-Forecasts von **WAFC Washington** und **WAFC London**. Polygon- und Punktgeometrien werden am Eventstandort geprüft; auch Hazard- und Intensitätskennungen in IWXXM-/xlink-Attributen werden ausgewertet. Damit können u. a. moderate/starke Vereisung und Turbulenz, CB/Gewitter, Vulkanasche, tropische Wirbelstürme, Staub/Sand und radiologische Signale die Eventbewertung anheben.
- `MID_KNMI_API_KEY`: direkte nationale **KNMI AIRMET- und SIGMET**-Open-Data-Pfade für die Amsterdam FIR als zusätzliche amtliche Quelle.

Direkt zugangsbeschränkte oder vom Anbieter nicht zur automatischen Weiterverarbeitung freigegebene nationale SWC-/Spezialprodukte werden nicht gescraped. Ihre international verbreiteten ICAO-SIGMET/TAF fließen bereits über den amtlichen Austausch ein. Für Deutschland betrifft der zusätzliche direkte DWD-Flugwetter-Datenserver einen vertraglich autorisierten Zugang; ohne einen solchen Vertrag wird er bewusst nicht simuliert oder aus geschützten Webseiten extrahiert.

## Bedienung

- Die Ergebnisfläche bleibt kompakt.
- Quellenhierarchie, Verfügbarkeit und ggf. fehlende Zugangskonfiguration stehen ausschließlich hinter dem Info-Button des Flugwetter-Screenings.
- Das Screening bleibt eine Planungsunterstützung und ersetzt kein vorgeschriebenes amtliches Flugwetterbriefing.

## Worker

**Worker-Deployment erforderlich.** Neuer Modus `aviation-hazards`; zusätzlich werden WIFS- und KNMI-Zugänge im Worker-Healthstatus ausgewiesen.
