# MID-C18 Nebel und Phasenprüfung

Basis main = mid-stable add98dc0030c1b3d174567577a84fdaa41dc81a7 (.173).

Bestätigter Fehler: kein Niederschlag ist keine wolkenbasierte Wetterklasse. Gemeinsame dryWeatherLabel-Ableitung erhält die vorhandenen Nebel-, Reifnebel- und Dunstcodes in Kurzfrist, Routen, Veranstaltungen, Wasser- und Bergsport. Aktuell-Fallback überschreibt nur echte Himmelscodes. Periodenrenderer war bereits entsprechend geschützt.

Native snowfall_height wird in Bergwetter-Kennwert, Stunden-, Perioden- und Tagessummaries vorrangig genutzt. Vorhandene DWD-850-hPa-Näherung bleibt als Rückfall erhalten. Das bestehende Ensemble bleibt methodisch unverändert, da eine Mischung nativer Mittel mit anders abgeleiteten Streuungen nicht gerechtfertigt ist.

Feuchtkugeltemperatur wird bereits abgefragt, für Schneequalität verwendet und in der allgemeinen Plausibilitätsprüfung angenähert. Kurzfrist- und 15-Minuten-Fusion reichen nun auch Temperatur und Taupunkt weiter. Keine ungeprüfte Schneeerzeugung, keine fixe Talabsenkung, keine doppelte Verdunstungs-/Schmelzabkühlung. Ohne vertikales Feuchte-/Temperaturprofil und Tal-Luftaustausch ist kein quantitativ belastbarer zusätzlicher Talwert verfügbar.

Quellen: https://open-meteo.com/en/docs/dwd-api ; https://www.dwd.de/DE/leistungen/pbfb_verlag_promet/pdf_promethefte/98_pdf.pdf?__blob=publicationFile&v=2

Tests mit alten Quelltextmustern wurden auf dryWeatherLabel aktualisiert; Verhaltenstests sichern weiterhin Oktas 0–3 und zusätzlich Nebel/Dunst 5/10/11/12/40–49. Die Extraktions-Hashfixture wurde nur für die absichtlich geänderten Bergwetter-Deklarationen aktualisiert (Methodik, aktuelle Kennwerte, Perioden, Stunden); CSS-Reihenfolge und alle anderen Deklarationen unverändert.
