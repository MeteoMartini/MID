# MID v0.9.85.402 – Wetterhinweise belastbarer, Kartenbedienung kompakter

- **Verlässlichere MID-Prognosehinweise:** Regen-, Schnee-, Frost-, Hitze- und Schneeverwehungshinweise berücksichtigen nur vollständig belegte Zeitfenster. Unbekannte Teilwerte werden nicht als trockene oder windstille Stunden ausgegeben; gültige Nullwerte bleiben erhalten.
- **Nachvollziehbare Windrichtung:** Fehlende Windrichtungen werden nicht mit Norden gleichgesetzt. Eine echte Nordrichtung von 0° bleibt erhalten.
- **Bessere Kartenbedienung:** Beobachtungs- und Modelleinstellungen sind übersichtlicher gruppiert, ohne Funktionen zu entfernen. Der Komposit-Kartenbereich ergänzt zur relativen Zeit die lokale absolute Gültigkeitszeit, soweit ein bestätigter Datenframe vorliegt.
- **Kartenladeweg vorbereitet:** Wetterkarten-Code wird beim sichtbarkeitsabhängigen Öffnen vorgewärmt. Eine konkrete Beschleunigung wird erst nach vergleichbaren Browsermessungen beansprucht.
- **Einstellungen erhalten:** Die Migration älterer Kartenansichten erhält gültige Zoom-/Darstellungswünsche und überschreibt beschädigte Browser-Speicherwerte nicht mit scheinbar gültigen Defaults.
- **Extremwetterkarte effizienter:** Identische, bereits berechnete Gefahrenkonturen werden innerhalb eines unveränderten Datensatzes gemeinsam für Karte und Regionalübersicht verwendet. Modellwerte, Warnstufen und Quellen bleiben unverändert.

**Hinweis:** MID-Prognosehinweise sind eigene Modellbewertungen und keine amtlichen DWD-Warnungen. Amtliche Warnungen bleiben vorrangig. Weder unbekannte Daten noch fehlende Kartenausgaben gelten als Nullwerte. Browser-/iOS-/VoiceOver-Gesamtabnahme ist nicht Teil dieser Behauptung.
