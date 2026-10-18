# MID v0.9.85.287

- **Tagesniederschlag mit verlässlichem Datenstatus:** Fehlt eine Tagesmenge beim Wetterdatenanbieter, erscheint sie als nicht verfügbar statt fälschlich als 0 mm. Eine wirklich gemessene oder vorhergesagte Null bleibt 0 mm.
- **Tagesprognosen und Widgets:** Niederschlagsmenge und -wahrscheinlichkeit werden unabhängig voneinander als verfügbar oder fehlend gekennzeichnet. Auch 7-/14-Tage-Ansichten und Widget-Darstellungen übernehmen diese Unterscheidung.
- **Wetterlage bleibt erkennbar:** Vorhandene Regen- und Schneesignale werden nicht durch eine fehlende Tagessumme zu trockenem Wetter umgedeutet. Vollständige Stundenfolgen können eine fehlende Tagessumme weiterhin nach dem bestehenden Kalendertagsvertrag ersetzen.
- **Keine Änderung** an amtlichen Warnungen, RUC-Kompression, numerischen Wettermodellen oder Wettervorhersageschwellen.
