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
