# MID v0.9.53.51

## Netatmo OAuth Navigation – iOS/PWA-Härtung

- Netatmo-OAuth startet nun über einen direkten GET-Redirect des Cloudflare Workers (`mode=netatmo-auth-redirect`) statt über eine vom Browser nach zwei asynchronen API-Schritten ausgeführte Navigation zur externen Netatmo-URL. Der Worker speichert den OAuth-State und antwortet unmittelbar mit HTTP 302 zur offiziellen Netatmo-Autorisierung.
- Der OAuth-Callback transportiert Netatmo-/Tokenfehler sanitisiert als `mid_station_detail` plus `mid_station_stage` zurück zur App, sodass Fehlschläge nicht mehr wie eine wirkungslose Rückkehr in die Einstellungen erscheinen.
- Die Stations-Einstellungen bewahren Callback-Meldungen gegen parallel eintreffende Status-Refreshes und zeigen den konkreten Fehler an.
- Erfolgreiche Verbindungen aktivieren weiterhin die private Netatmo-Station und den Lüftungsassistenten; an der meteorologischen Verarbeitung wurde nichts geändert.
