# MID – Apple WidgetKit/Komplikationen

Dieser Ordner enthält das fachliche Startgerüst für iOS-/iPadOS-Widgets und
watchOS-Komplikationen. Das gemeinsame native App-Target liegt ab MID 0.9.67.0
unter `ios/App` und wird über Capacitor aus demselben Browserbuild synchronisiert.

## Vorbereitet

- stabiler Worker-Endpunkt `?mode=native-widget-feed`
- versionierter JSON-Vertrag `mid.native.widget.v1`
- gemeinsames Swift-`Codable`-Datenmodell
- `AppIntentTimelineProvider`
- Darstellungen für `systemSmall`, `systemMedium`, `systemLarge`, `accessoryInline`, `accessoryCircular`, `accessoryRectangular` und `accessoryCorner`

## Noch in Xcode erforderlich

1. Widget Extension für iOS/watchOS im vorhandenen `ios/App`-Projekt hinzufügen
2. App Group für App und Widget Extension registrieren
3. produktive Worker-Adresse in `MIDWidgetProvider.swift` einsetzen
4. Signierung und Deployment Targets nach Kostenfreigabe festlegen
5. Favoriten später über `AppEntity` statt manueller Koordinaten konfigurierbar machen
6. Widget-Timelines nach App-Datenänderungen mit `WidgetCenter.shared.reloadTimelines` aktualisieren

Die bestehende PWA allein kann keine echten WidgetKit-Widgets oder Apple-Watch-Komplikationen installieren; das Gerüst ist für die spätere native App-Generierung vorgesehen.
