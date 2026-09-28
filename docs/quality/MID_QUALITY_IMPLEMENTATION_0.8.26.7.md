## MID v0.8.26.7 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.26.6**. Die vor dem Audit vorhandene Ensemble-Funktionalität wird wiederhergestellt und die Recharts-3-Laufzeitdarstellung korrigiert, ohne neue fachliche Hauptfunktion einzuführen.

### Umgesetzte Punkte

1. **Ensemble-Diagramme vollständig wiederhergestellt**
   - Temperatur-, Niederschlags- und Wind-/Böendiagramm erhalten wieder ihre vollständigen interaktiven Tooltips.
   - Das Temperaturdiagramm zeigt weiterhin die Sonne-/Wolken-Kästchen, die Niederschlagssymbolik und die Hazardmarker je Vorhersagetag.
   - Linien, Flächen, Fehlerbalken, Schalter, Legenden und PNG-Export bleiben erhalten.

2. **Recharts-3-Liveframe stabilisiert**
   - Breite und Höhe werden mit `ResizeObserver` am realen Diagrammcontainer gemessen.
   - Recharts erhält explizite Pixelabmessungen statt eines kollabierenden responsiven Prozentpfads.
   - Bildschirm- und Exportdarstellung nutzen weiterhin getrennte, deterministische Geometrien.

3. **Vertikale Tagesausrichtung vereinheitlicht**
   - Gleiche linke und rechte Achsenreserve in allen drei Diagrammen.
   - Identische numerische Tagesdomäne und Tickfolge.
   - Einheitliche Plot- und Exportbreite von 992 px innerhalb des 1096-px-Exportbereichs.

4. **Achsenbeschriftung angebunden**
   - Der Titel „Vorhersagetag“ sitzt direkt unter der Datumsachse.
   - Eine dezente Trennlinie verbindet Beschriftung und Diagramm optisch.
   - Mobile und Desktopgeometrie bleiben konsistent.

### Worker

- Kein funktionaler Worker-Umbau.
- Worker ausschließlich auf **v0.8.26.7** versionssynchronisiert.
