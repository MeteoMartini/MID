# MID v0.9.84.93 – Implementierungsbericht

## Ausgangslage
Verbindliche stabile Basis ist `mid-stable` v0.9.84.91 (Commit `fd3d886018e917962a2c5a6f5d82fb1ad48ea1e4`). Der darauf aufbauende Kandidat v0.9.84.92 wurde in Installer #1046 vollständig installiert, typgeprüft und erfolgreich mit Vite gebaut. Erst die nachgelagerte Regressionensuite stoppte den Release mit genau zwei Fehlschlägen von 786 Tests. Dadurch wurden Capacitor-Übernahme, Worker-Deploy, Pages-Deployment und Stable-Promotion korrekt übersprungen.

## Ursache und Korrektur

### 1. Gepufferte Komposit-Wiedergabe
Die v0.9.84.92-Persistenz wurde absichtlich von einem einzelnen direkten `writeCompositeSettings({...})`-Effekt auf einen synchron gehaltenen `compositeSettingsRef` plus `flushCompositeSettings()` umgestellt. `playbackSeconds` ist weiterhin Bestandteil dieses vollständigen Zustands und wird beim Flush geschrieben. Der alte Test suchte jedoch ausschließlich nach einem entfernten exakten Quelltextfragment und meldete deshalb fälschlich einen Funktionsverlust.

Die Regression prüft jetzt den aktuellen Vertrag: `playbackSeconds` muss im synchronen Kompositzustand stehen und dieser Zustand muss durch `writeCompositeSettings(compositeSettingsRef.current)` persistiert werden. Die fachliche Produktionslogik wurde dafür nicht zurückgebaut.

### 2. 500-hPa-Isohypsen
Die v0.9.84.92-Änderung führt `vectorIsoheightFrame` ein: ein vektorfähiger `dominantGridFrame` wird bevorzugt; nur wenn er noch keine verwertbaren Isohypsen enthält, darf ein vektorfähiger `dominantModelFrame` einspringen. Gerendert wird weiter über `MemoContours`/`Contours` als geglättete Leaflet-`Polyline` mit `type="isoheights"`, gestrichelter Gold-/Amber-Darstellung und gpdm-Labels.

Der alte Test verlangte statisch den früheren direkten Ausdruck `dominantGridFrame.isoheights` und war deshalb mit der ausdrücklich vorgesehenen Fallback-Architektur unvereinbar. Er prüft jetzt Grid-first-Präferenz, sicheren Modellframe-Fallback und das tatsächliche Polyline-Rendering gemeinsam.

## Release-/Worker-Hinweis
Für v0.9.84.93 wurde keine neue fachliche Workerlogik ergänzt. Die Worker-Änderung aus v0.9.84.92 (gebündelter Modellgitterabruf) konnte in Installer #1046 wegen des vorherigen Regression-Gates jedoch nicht ausgerollt werden. **Für den kumulativen nächsten erfolgreichen Installer bleibt der Worker-Deploy daher erforderlich.**
