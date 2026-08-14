# MID v0.9.53.18 – Datenabruf-Stabilisierung

Die ab v0.9.53.8 eingeführte automatische Eventüberwachung erzeugte zusammen mit Wetterzwilling-Favoritenlernen, Modellmetadaten, Forecast-Fusion und dem sichtbaren Core-Forecast einen unnötigen Request-Sturm. Besonders problematisch waren Start/Focus/Resume, ein 5-Minuten-Metadatenpolling je Eventort sowie der zusätzliche erzwungene 30-Minuten-Fullrefresh. Dadurch konnten sowohl der direkte Open-Meteo-Pfad als auch der gemeinsame Worker-Pfad in Rate-Limits laufen.

## Neuer Vertrag

- Foreground zuerst: automatische Hintergrundjobs starten erst nach erfolgreichem sichtbaren Core-Forecast und 45 Sekunden Ruhezeit.
- Hintergrundjobs werden appweit seriell ausgeführt.
- Eventpflege: 60 Minuten Fälligkeit, 15-Minuten-Prüfung, max. vier Events je Lauf, sequenziell; kein separates Modellmetadatenpolling. Neue Modellläufe werden mit der nächsten regulären Event-Neuberechnung übernommen.
- Manuelle Event-Reloads bleiben echte Fresh-Reloads.
- Aggregierter Best-Match-Modellstand wird 20 Minuten lokal gecacht.
- Ein erkannter Open-Meteo-429-Cooldown bleibt über PWA-Neustarts erhalten. Währenddessen priorisiert der Core-Forecast Worker/Cache statt einen bereits limitierten Direktpfad erneut anzufragen.
- Automatisches Favoritenlernen des Wetterzwillings ist Opt-in; bei Aktivierung nutzt es denselben seriellen Hintergrundpfad.

Die meteorologische Best-Match-, Hyperlokal-, Radar-, PoP-, Ensemble- und Darstellungslogik wird dadurch nicht zurückgesetzt. Geändert wird ausschließlich die interne Abruf- und Hintergrundsystematik.
