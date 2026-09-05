# MID 0.9.78.60 – Testbericht

## Ergebnis

- TypeScript-Prüfung: bestanden
- Vite-Produktionsbuild: bestanden
- Neue Komposit-Zeit-/Zugspurenregression: bestanden
- Gezielte Radar-, Satelliten-, K3D-, Niederschlagsart-, Responsive- und Performance-Regressionen: bestanden
- Vollständige Regressionen: 679 von 679 bestanden

## Geprüfte Fachverträge

- Nur echte Produktzeitstempel innerhalb −1 bis +2 Stunden
- Keine Fortschreibung von Live-only-Layern in Vergangenheit oder Zukunft
- Radarpriorität DWD → OPERA → RainViewer
- Echoanker, Korridortreffer und Qualitätsgrenze als Voraussetzung für eine ETA
- Stabiles Vordergrundbild beim Laden eines Radar-/Satellitenframes
- Fehlerquorum und kontrollierte Wiederholung statt sofortigem Layerausfall
- Layerreihenfolge: Kartenbasis → Wetter → Referenzgrenzen → Zugspuren/Zellen → Standortmarker
- Persistente Layer-, Deckkraft-, Kartenbasis- und Moduseinstellungen
- Responsive Kompositbedienung auf Desktop, Tablet und Smartphone

## Buildhinweis

Der Produktionsbuild meldet ausschließlich die bereits bekannte Warnung zu großen, getrennten Vendor-/MapLibre-Chunks; es gab keinen Buildfehler.
