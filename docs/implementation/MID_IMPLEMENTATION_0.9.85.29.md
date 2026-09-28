# MID v0.9.85.29 – MID-C9 durchgehender Kartenzeitraum

## Ziel

Der Kartenbereich soll der meteorologischen Zeitfolge folgen, nicht den bisherigen Modus-Schaltern. Beobachtung, Nowcast und Modell bleiben eigene Datenarten, bilden aber eine gemeinsam bedienbare Zeitachse.

## Umsetzung

- `RadarPanel` lädt die zeitgestempelten Modellkonturen unabhängig von der freiwilligen Live-Überlagerung vor.
- Alle bestätigten Modelltermine ergänzen die Zeitachse. Beim gewählten Modelltermin erscheinen Isobaren und 500-hPa-Isohypsen automatisch; der Status lautet sichtbar `Modell · Synoptik`.
- Die vom Nutzer gewählte Linienanzeige bleibt für Livebilder erhalten. Der automatische Kartenwechsel greift ausschließlich am echten Modelltermin.

## Fachliche Grenzen

Radar, Satellit und Blitzdaten bleiben an ihren real gemeldeten Zeitstempeln. Sie werden nicht in die Zukunft fortgeschrieben. MID blendet keine künstlichen Übergangsbilder ein und trennt Beobachtung, Nowcast und Modell im Zeitstatus weiterhin deutlich.

## Regression

Die C9-Regression sichert das Vorladen der Modelltermine, deren Aufnahme in die Zeitachse, die automatische synoptische Darstellung nur am Modelltermin sowie die explizite Kennzeichnung.
