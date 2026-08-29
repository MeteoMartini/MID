# MID – Apple WidgetKit

Der fachliche Widgetvertrag bleibt `mid.native.widget.v1`. Seit MID 0.9.71.0
liegt die ausführbare iOS-/iPadOS-WidgetKit-Struktur direkt im bestehenden
Capacitor-Xcode-Projekt unter `ios/App/MIDWidgets`; es entsteht kein eigener
Wetter-Fachkern und kein iOS-Fork.

## In Xcode strukturell integriert

- Target `MIDWidgets` als eingebettete WidgetKit App Extension im bestehenden
  `ios/App/App.xcodeproj`
- Produkt `MIDWidgets.appex` wird über `Embed Foundation Extensions` in die
  Haupt-App eingebettet und ist als Target-Abhängigkeit verdrahtet
- `Info.plist` nutzt `com.apple.widgetkit-extension`
- iOS-/iPadOS-Deployment-Target 17.0 für die Widget Extension, weil die
  Konfiguration `AppIntentConfiguration` / `WidgetConfigurationIntent` nutzt;
  das Capacitor-Haupttarget bleibt unverändert auf iOS 15.0
- produktiver HTTPS-Feed `https://mid-data-proxy.midwx.workers.dev/?mode=native-widget-feed`
- JSON-Decodierung akzeptiert ausschließlich den unveränderten Vertrag
  `mid.native.widget.v1`
- systemSmall, systemMedium, systemLarge sowie Lock-Screen-Familien
  accessoryInline, accessoryCircular und accessoryRectangular sind für das
  iOS-/iPadOS-Target vorbereitet
- `accessoryCorner` bleibt im gemeinsamen Swift-Quellstand ausschließlich für
  ein späteres watchOS-Target kompiliert

## Bewusst noch nicht aktiviert

Für den aktuellen netzwerkbasierten `mid.native.widget.v1`-Feed ist **keine App
Group erforderlich**. Deshalb wird in diesem kostenfreien Quellmilestone weder
eine App Group registriert noch eine Entitlement-Datei erzeugt. Eine App Group
wird erst benötigt, wenn die Haupt-App später lokale Favoriten/Snapshots direkt
mit der Extension teilen soll.

Ebenso noch nicht Teil dieses Milestones:

1. Apple-Developer-Signierung und Geräteinstallation
2. TestFlight/App-Store-Veröffentlichung
3. ein eigenes watchOS-Target; die accessory-Familien sind nur quellenmäßig
   vorbereitet, Apple-Watch-Komplikationen werden erst mit einem watchOS-Target
   ausgeliefert
4. Favoritenwahl über `AppEntity`
5. appseitige `WidgetCenter.shared.reloadTimelines`-Trigger nach lokalen
   Datenänderungen

Diese Punkte bleiben an den folgenden Apple-Milestones bzw. am ausdrücklichen
Kosten-/Kontogate. Browser/PWA und iOS-WebView verwenden weiterhin denselben
React/Vite-/Worker-Fachkern.
## Push und Background Refresh – Quellvorbereitung ab v0.9.72.0

Die Haupt-App enthält `MIDNativePushPreparation.swift` und `MIDBackgroundRefreshPreparation.swift` als kompilierbare, aber dormant gehaltene Quellen. APNs-Berechtigung/Registrierung, Token-Upload, `aps-environment` und `UIBackgroundModes` werden nicht aktiviert. Der vorbereitete BGTask-Identifier lautet `app.midwx.weather.background-refresh`. Details und Gate-Grenzen stehen in `MID_APPLE_PUSH_BACKGROUND_CONTRACT.md`.

