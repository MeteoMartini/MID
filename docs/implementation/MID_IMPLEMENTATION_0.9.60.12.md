# MID v0.9.60.12

- Komposit-Zeitpfeil Geo-Vertrag v6: Pfeilspitze ist der Leaflet-Anker und endet exakt am ausgewählten Standort/Favoritenort.
- Keine Zeitmarke am Ort; Zeit-Ticks bleiben upstream und werden aus denselben Geo-Punkten wie die Skala erzeugt.
- Pfeilkopf skaliert kompakt mit der sichtbaren Achse; Zoom/DPR verschieben den Endpunkt nicht mehr.
- Komposit-Layerzustände, Kartenstil, Zeitpfeilmodus und sämtliche Layer-Transparenzen werden weiterhin persistent in `mid:composite-settings:v3`/`mid:composite-layers:v3` gespeichert und wiederhergestellt.
- Worker-Fachlogik unverändert.
