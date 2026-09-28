# MID v0.9.32.6

## 24-h-Wetterprofil – Warnlogik, Achsen und Bedienzustand

- „Wetterberuhigung“ aus den abgeleiteten Signalen entfernt.
- „Max. Wetter-Hazard“ durch „Stärkste Einschränkung“ ersetzt.
- Hazard-Band und stärkstes Einschränkungssignal verwenden unmittelbar `dwdWarningSignalsAt(...)` und `DWD_WARNING_COLORS`; damit gelten dieselben zentralen MID/DWD-Warnschwellen und Farben wie appweit.
- Kurzfristpunkte führen die vorhandenen Niederschlagskomponenten Regen, Schauer und Schnee mit, damit die zentrale Warnlogik ohne vereinfachte Ersatzbewertung arbeiten kann.
- Legendenstatus des 24-h-Profils wird favoritenübergreifend unter `mid:forecastCockpit:profileLegendVisible` gespeichert.
- Pille „Stündlich · ein Blick“ sowie der 24-h-Leistenhinweis „Seitlich wischbar …“ entfernt.
- Temperatur-, Niederschlags- und Windachsen einschließlich Einheiten/Skalen links ausgerichtet.
- Temperaturmarkierungen: Tmax wird nur angezeigt, wenn das tatsächliche Tagesmaximum im sichtbaren Zeitfenster liegt; Tmin wird einmal je zusammenhängender Nacht bestimmt und ebenfalls nur bei sichtbarem tatsächlichem Minimum markiert.
- Info-Schaltfläche der Einzeldaten kompakt in die Überschriftszeile verschoben.
- Wärmster/kühlster Zeitpunkt, Windhöhepunkt und Niederschlagsspitze erhalten vor der Uhrzeit „heute“ bzw. „morgen“.

## Qualitätssicherung

- Neue Regression `scripts/test-mid-weather-profile-ux-hazards-09326.mjs`.
- Betroffene Altverträge für Wetterprofil, Achsen, Einzeldaten und Kurzfristdarstellung synchronisiert.
- 331/331 automatisch erkannte MID-Regressionstests bestanden.
- Versionen auf 0.9.32.6 synchronisiert.
