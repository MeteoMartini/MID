# MID v0.9.85.403 – Kartenstart im Hintergrund vorbereiten

- **Karten schneller erreichbar:** Nach einem erfolgreich geladenen Wetterstand bereitet MID die benötigten Kartenmodule in einer freien Browserphase vor, damit beim späteren Wechsel zum Kartenbereich weniger Code nachgeladen werden muss.
- **Rücksicht auf Mobilgeräte und Datenvolumen:** Bei aktivem Datensparmodus, sehr langsamer Verbindung, Offline-Zustand, verborgenem Tab oder geöffneter Suche wird kein automatisches Karten-Vorladen gestartet. Eine bewusste Kartenwahl lädt den Bereich weiterhin direkt.
- **Unveränderte Wetterdaten und Einstellungen:** Keine Änderung an DWD-Warnungen, RUC-/Modellwerten, Karten-Layern, Akkumulation, Gültigkeitszeiten, Favoriten oder gespeicherten Einstellungen.

**Hinweis:** Die Optimierung betrifft ausschließlich Code-Chunks, keine zusätzlichen Wetterdatenabrufe. Eine bestimmte Verbesserung der vollständigen Kartenladezeit wird erst nach vergleichbaren Messungen auf realen Geräten beansprucht.
