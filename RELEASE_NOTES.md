# MID v0.9.85.126

- Behoben: „Aktuell"-Ansicht sprang nach Wetterdaten-Laden automatisch auf „Vorhersage" zurück, wenn die zuletzt gespeicherte Ansicht „Vorhersage" war und der Nutzer zuvor auf „Aktuell" getippt hatte.
- Ursache: Der Startup-Restore-Effekt lief nach dem Laden der Wetterdaten und überschrieb die explizite Nutzer-Navigation mit der gespeicherten Sektion.
- Fix: Ein `userNavigatedRef` verfolgt, ob der Nutzer bereits aktiv navigiert hat. Der Startup-Restore wird übersprungen, wenn der Nutzer vorher eine andere Ansicht gewählt hat.

# MID v0.9.85.125

- App-Absturz beim Start behoben: PollenForecast-Komponente führte Datenabruf während der Render-Phase durch (React-Side-Effect) statt in useEffect. Dies konnte zu Endlos-Schleifen und Abstürzen führen.
- UTCI-Windgeschwindigkeits-Übergabe abgesichert: Math.max(0.5, NaN) gab NaN zurück statt 0.5. Jetzt mit Number.isFinite-Prüfung.

# MID v0.9.85.124

- UTCI (Universal Thermal Climate Index) ersetzt die gefühlte Temperatur in der Aktuell-Ansicht. Korrekte Polynom-Koeffizienten nach Brode et al. (2012). Keine separate Sektion mehr — UTCI-Wert und Belastungskategorie direkt in der aktuellen Wetteranzeige.
- Pollenflug-Vorhersage kompakter: Chip-basierte Anzeige statt großer Tabelle. Details aufklappbar.

# MID v0.9.85.123

- UTCI (Universal Thermal Climate Index) als gefühlte Temperatur in der Aktuell-Ansicht: wissenschaftlich fundiertes thermisches Komfortmodell nach WMO/ISB mit 10 Belastungskategorien.
- Pollenflug-Einstellung und weitere Inhaltsmodule unter "Inhalte & Navigation" umgruppiert (zuvor in allen Einstellungsbereichen sichtbar).
- Pollenflug-Einstellung dauerhaft gespeichert (gerätelokal, nicht von Gerätesynchronisation überschrieben).

# MID v0.9.85.122

- Fehler behoben: Pollenflug-Einstellung wurde beim App-Neustart nicht dauerhaft gespeichert (Gerätesynchronisation hat Schlüssel entfernt).
- Fehler behoben: Zuletzt angezeigte Ansicht wurde beim Wiederaufrufen der App nicht wiederhergestellt (IntersectionObserver und Forecast-Horizon-Event haben gespeicherte Ansicht beim Start überschrieben).

# MID v0.9.85.121

- Pro-Parameter Datenqualitätsindikator in der Aktuell-Ansicht: kompakte Qualitäts-Badges für Temperatur, Wind, Niederschlag, Feuchte und Luftdruck mit Quellen- und Altersangabe.
- Erweiterte Ansicht zeigt aktive Modellläufe mit Initialisierungszeit, Auflösung und Vorhersagehorizont.

# MID v0.9.85.120

- Pollenflug-Vorhersage kann in den Einstellungen ein- und ausgeschaltet werden.
- Pollenflug-Komponente an das MID-Designsystem angeglichen (forecast-entry-head, Card-Oberfläche, Parameter-Farben).

# MID v0.9.85.119

- Pollenflug-Vorhersage für Deutschland: DWD-Pollendaten (8 Allergene, 27 Regionen, 3 Tage) in der Aktuell-Ansicht.
- Hoher-Kontrast-Modus (WCAG 2.1 AA) als vierte Theme-Option in den Einstellungen.
- Fehler behoben: Changelog-Link aus der App startete die App neu statt den Changelog zu öffnen.

# MID v0.9.85.116

- Nachtstunden sind im Dark-Design in Skybar und Temperaturverlauf deutlicher erkennbar.
- Die Nachtflächen bleiben weich an Sonnenuntergang und Sonnenaufgang ausgeblendet und überdecken Temperaturkurve oder Wetterfarben nicht.
- Das Light-Design bleibt unverändert; meteorologische Logik, Solarberechnung, Wetterfarben und Datenquellen bleiben unangetastet.
