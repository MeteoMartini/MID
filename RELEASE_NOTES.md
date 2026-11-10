# MID v0.9.85.453

- Zwei eigenständige Saisonkarten ergänzen den bestehenden Karten-Parameterselektor ohne zusätzliche Navigation: **Winter & Berge** kombiniert stündlichen DWD-ICON-D2-Gesamtniederschlag mit 2-m-Temperatur-Isothermen, **Sommer** denselben Niederschlag mit 10-m-Böen-Isolinien.
- Beide Originalfelder werden per SHA-256, Modelllauf, Gültigkeitszeit, Raster und Einheit geprüft. Fehlende Rasterzellen bleiben fehlend, auch in der Karte, den Ortswerten und dem gemeinsamen PNG-/SVG-Export.
- Die Darstellungen sind keine Schneehöhen-, Schnee-/Eisregen-, Glätte-, CAPE-, Windscherungs-, Blitz- oder amtliche Gewitterwarnkarten. Solche Parameter sind erst nach eigenständiger DWD-Originaldatenprüfung verfügbar.
- Der WXCharts-Vergleich diente ausschließlich als fachliche Orientierung: Es werden keinerlei MetDesk-/WXCharts-Inhalte, APIs oder Karten übernommen. DWD Open Data · CC BY 4.0; bestehende Radar-, Satelliten-, Karten-, Light-/Dark- und Mobilfunktionen bleiben erhalten.
