# MID 0.9.68.0 – nativer Standortadapter

## Meilenstein

Der in `MID_IOS_STATUS.json` ausgewiesene Meilenstein
`native-location-adapter-with-browser-fallback` ist im gemeinsamen React-/Vite-
Kern umgesetzt. Es existiert kein iOS-Fachfork.

## Umsetzung

- `src/locationPlatform.ts` kapselt die einmalige Standortermittlung.
- Browser/PWA verwenden weiterhin `navigator.geolocation` mit denselben
  Genauigkeits-, Timeout- und Cacheparametern wie zuvor.
- Im nativen Container wird `@capacitor/geolocation` erst bei einer konkreten
  Standortanforderung geladen. Berechtigungen werden geprüft und nur bei einem
  noch offenen Zustand angefordert.
- Bei einer nicht berechtigungsbedingten Störung der nativen Brücke bleibt der
  Browserpfad als Fallback verfügbar. Eine ausdrückliche Ablehnung wird nicht
  durch wiederholte Prompts umgangen.
- Der Adapter startet keinen Watcher, enthält keine Hintergrund-Ortung und
  persistiert selbst weder Koordinaten noch Favoriten.
- `Info.plist` enthält die von Capacitor 8 verlangten iOS-Beschreibungen für
  Standortnutzung im Vordergrund; der Text stellt die fehlende
  Hintergrund-Ortung klar.

## Fachliche Isolation

Reverse-Geocoding, Auswahl des aktuellen Orts, Favoritenabgleich, Persistenz,
Wetterabruf und Warnlogik bleiben unverändert in ihren bestehenden kanonischen
Pfaden. Der Adapter liefert ausschließlich Gerätekoordinaten.

## Regression

`scripts/test-native-location-adapter-09680.mjs` schützt nativen und
Browserpfad, Berechtigungsgrenze, fehlendes Hintergrundtracking, iOS-Manifest,
Baseline-Registrierung und die nächste Roadmap-Etappe.

## Abschlussvalidierung

- TypeScript und Browser-Produktionsbuild: bestanden
- gezielte Standort-, Favoriten-, Rückkehr-, Cross-Platform- und Safe-Area-
  Regressionen: bestanden
- vollständige MID-Suite: 554/554 bestanden
- `worker/metar-proxy.js` und `worker.js`: Syntaxprüfung bestanden
- Capacitor-Sync: bestanden; `@capacitor/geolocation` 8.2.2 ist im Swift-
  Package registriert und das iOS-WebView-Bundle ist bytegleich zum Browserbuild
- Xcode-Struktur: Bundle-ID `app.midwx.weather`, Marketingversion `0.9.68`,
  Build `1`, beide Standort-Berechtigungstexte vorhanden
- Dependency-Policy und High-Severity-Gate: bestanden; drei moderate Hinweise
  verbleiben in der reinen Capacitor-CLI/Xcode-Entwicklungskette

## Auslieferung

Die Cloudflare-Worker-Fachlogik wurde nicht geändert. Ein Worker-Upload ist für
diesen Meilenstein nicht erforderlich; ein versionssynchrones Worker-ZIP bleibt
Teil des gemeinsamen Releasepaars.
