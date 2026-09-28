# MID v0.9.32.15

## Favoriten dauerhaft und POI-sicher

- Favoritenaktionen über den Stern schreiben den neuen Favoritenbestand unmittelbar nach `localStorage` und aktualisieren zugleich den Persistenz-Referenzstand.
- Die bisherige verzögerte Speicherung bleibt als zusätzliche Sicherung für Profil-/Metadatenänderungen bestehen.
- Für gespeicherte Favoriten gilt eine eigene Identitätslogik: exakte Koordinaten, stabile Orts-/OSM-ID oder gleicher Name mit enger räumlicher Toleranz (POI 120 m; Nicht-POI 450 m).
- Die großzügigere Nahbereichserkennung (350/900 m) bleibt auf automatisches GPS-/Standorttracking beschränkt.
- Damit können benachbarte POIs wie Stadien, Parkplätze, Haltestellen oder Gastronomieeinträge unabhängig gespeichert werden.
