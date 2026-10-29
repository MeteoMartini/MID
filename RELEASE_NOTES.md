# MID v0.9.85.360

## Verlässliche und datensparsame Widget-Fehlerdiagnose

- Widget-Exports zeichnen Browser-Netzwerkanfragen nun schon vor der ersten Seitennavigation auf. Der erste Wetterabruf geht nicht mehr wegen einer verspäteten DevTools-Anbindung verloren.
- Der Erstfehlerbericht unterscheidet HTTP-Fehler samt Rate-Limits, DNS-/Verbindungsfehler, Zeitüberschreitungen, Abbrüche und noch ausstehende Requests. Er enthält nur begrenzte Zähler, Statusgruppen und Laufzeiten – niemals URLs, Queryparameter, Koordinaten, Cookies oder Zugriffstokens.
- Atomare Erstfehlerberichte, private Browserprofile, zwölf Pflicht-Widget-Varianten und die Veröffentlichungsblockade bei unvollständigen Ergebnissen bleiben erhalten. Ein neuer deterministischer Test deckt die Netzwerkereignisse und das Fehlen sensibler Werte ab.

Wettermodelle, Vorhersagewerte, Wetterfarben, amtliche Warnungen und RUC-Daten bleiben unverändert.
