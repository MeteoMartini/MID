# MID v0.9.53.2

## Wartungsrelease

- Hyperlokale Analyse in der aktuellen Wetterkarte deutlich verdichtet: sichtbar bleiben nur Messpunktstatus plus kompakte Ergebniszeile aus Modellhintergrund, lokaler Temperaturkorrektur und relevanter Windkorrektur. Gelände-, Expositions-, Oberflächen-, Messnetz- und Methodikdetails liegen hinter dem appweiten Info-Button.
- „Event aktualisieren“ führt nun tatsächlich eine neue Eventanalyse aus statt nur den vorhandenen Stand erneut zu speichern.
- Manuelle/automatische Event-Center-Aktualisierungen aus dem Hintergrund synchronisieren einen geöffneten Event-Datensatz sofort in die Detailansicht; der sichtbare „Stand“-Zeitpunkt folgt damit dem neu berechneten `refreshedAt`.
- Bestehende Event-Änderungslogik bleibt erhalten: Hinweise werden weiterhin nur bei meteorologisch relevanten Änderungen hervorgehoben, nicht bei jedem Modelllauf.
- Keine Worker-Funktionsänderung; Cloudflare-Worker-Upload ist für dieses Wartungsrelease nicht erforderlich.
