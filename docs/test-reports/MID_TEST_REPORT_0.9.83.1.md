# MID v0.9.83.1 – Freigabeprüfung

## Gezielte Prüfungen
- Klima-/Hazard-/Widget-Vertrag: grün.
- Klima-Grundvertrag: grün.
- Cockpit-/Widget-Layoutvertrag: grün.
- TSX-Parser/Transpile-Prüfung für `App.tsx` und `ClimatePanel.tsx`: grün.
- Nice-Scale-Beispiele geprüft: −8…27 °C → −10/0/10/20/30 °C; 21…34 °C → 20/25/30/35 °C.
- Widget enthält den Text „keine MID-Hinweise“ nicht mehr und rendert den Hazardbereich nur bei tatsächlichen Ereignissen.
- Klima-Windanzeige nutzt zentral ganzzahlige Formatierung.

## Release-Verträge
Nach Versionssynchronisierung erfolgreich: Versionsschema, Maintenance-Modularisierung, Aggregate-Version, Release-Lineage, Worker-Syntax und Bytegleichheit der beiden Worker-Aggregate. `App.tsx` und `ClimatePanel.tsx` wurden zusätzlich mit dem lokal verfügbaren TypeScript-Parser transpiliert.

Der unmittelbar vor der Paketbildung erneut geprüfte GitHub-Zweig `mid-stable` steht weiterhin auf v0.9.82.1. Die Arbeitsbasis v0.9.83.0 ist der in diesem Chat danach erzeugte, noch nicht installierte neuere Projektkandidat; v0.9.83.1 führt diesen Stand fort und fällt nicht auf den älteren Stable-Code zurück.

Ein vollständiger npm-/Vite-Produktionsbuild ist in dieser isolierten Umgebung weiterhin nur möglich, wenn die lockfile-genauen Projektabhängigkeiten verfügbar sind; der GitHub-Installer bleibt dafür fail-closed.
