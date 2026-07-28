# MID – Apple WidgetKit/Komplikationen

Dieser Ordner ist das native Startgerüst für iOS/iPadOS-Widgets und watchOS-Komplikationen.

## Vorbereitet

- stabiler Worker-Endpunkt `?mode=native-widget-feed`
- versionierter JSON-Vertrag `mid.native.widget.v1`
- gemeinsames Swift-`Codable`-Datenmodell
- `AppIntentTimelineProvider`
- Darstellungen für `systemSmall`, `systemMedium`, `systemLarge`, `accessoryInline`, `accessoryCircular`, `accessoryRectangular` und `accessoryCorner`

## Noch in Xcode erforderlich

1. natives MID-App-Target anlegen
2. Widget Extension für iOS/watchOS hinzufügen
3. App Group für App und Widget Extension registrieren
4. produktive Worker-Adresse in `MIDWidgetProvider.swift` einsetzen
5. Bundle-IDs, Signierung und Deployment Targets festlegen
6. Favoriten später über `AppEntity` statt manueller Koordinaten konfigurierbar machen
7. Widget-Timelines nach App-Datenänderungen mit `WidgetCenter.shared.reloadTimelines` aktualisieren

Die bestehende PWA allein kann keine echten WidgetKit-Widgets oder Apple-Watch-Komplikationen installieren; das Gerüst ist für die spätere native App-Generierung vorgesehen.
