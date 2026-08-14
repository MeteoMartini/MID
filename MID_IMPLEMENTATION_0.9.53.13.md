# MID v0.9.53.13

## Event-Favoriten und Ortssuche

- Event-Favoriten besitzen eine eigene Revisionszeit und bleiben vollständig unabhängig von den normalen Ortsfavoriten. Ein Ort kann gleichzeitig in beiden Favoritenarten geführt werden.
- Wetteraktualisierungen verändern den Event-Favoritenstatus nicht. Der Geräte-Sync führt Wetterplan und Event-Favoritenstatus getrennt nach ihrer jeweiligen Frische zusammen.
- Bestehende Legacy-Event-Favoriten werden beim Einlesen konservativ mit einer eigenen Favoritenrevision versehen; explizite spätere Änderungen gewinnen anschließend eindeutig.
- Die Ortssuche im Eventeditor folgt der appweiten Suche: Live-Suche, kurzer Debounce, Abbruch veralteter Requests, PLZ/ICAO/POI-Unterstützung, mobile Search-Semantik und MID-Touchgrößen.
- Worker fachlich unverändert.
