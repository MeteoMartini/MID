# MID 0.9.68.1 – native externe Navigation und Deep-Link-Rückkehr

## Meilenstein

Der in `MID_IOS_STATUS.json` ausgewiesene Meilenstein
`native-external-navigation-with-deep-link-return` ist im gemeinsamen
React-/Vite-Kern umgesetzt. Es existiert kein iOS-Fachfork.

## Umsetzung

- `src/externalNavigation.ts` kapselt die externe OAuth-Navigation.
- Der native Container öffnet Netatmo über den von Capacitor bereitgestellten
  `SFSafariViewController`; Browser/PWA behalten ihren bestehenden
  `window.open`-/Same-Window-Fallback.
- Die native Rückkehr erfolgt ausschließlich über den registrierten Deep Link
  `midwx://oauth/netatmo`.
- Protokoll, Host, Pfad, Ergebnis und Verbindungskennung werden vor Übernahme
  validiert. Fremde oder unvollständige URLs werden verworfen.
- Der Worker akzeptiert `capacitor://localhost` nicht allgemein, sondern nur
  beim Netatmo-OAuth-Start zusammen mit dem exakten registrierten MID-Deep-Link.
- Warme `appUrlOpen`-Ereignisse und kalte Starts über `getLaunchUrl()` werden
  verarbeitet. Ein Rücksprung vor dem React-Mount bleibt bis zur Übernahme
  gepuffert.
- Der bestehende Netatmo-Callback, die serverseitige OAuth-State-Prüfung und
  die kanonische Stationspersistenz bleiben unverändert.

## Fachliche Isolation

Der Adapter transportiert ausschließlich die geprüfte Navigation und den
Rücksprung. Wetterwerte, Stationseinstellungen, Favoriten, Persistenz,
Modellfusion und Warnlogik werden darin weder berechnet noch verändert.

## Regression

`scripts/test-native-external-navigation-096681.mjs` schützt nativen und
Browserpfad, HTTPS-/Deep-Link-Allowlist, Warm-/Kaltstart, iOS-Schema,
Worker-Rücksprung und die nächste Roadmap-Etappe.

## Abschlussvalidierung

- TypeScript und Browser-Produktionsbuild: bestanden
- vollständige MID-Suite: 555/555 bestanden
- Worker-Syntax und Aggregatsynchronität: bestanden
- Capacitor-Sync: bestanden; Capacitor Browser 8.0.4 ist neben App,
  Geolocation, Splashscreen und Statusbar im Swift-Paket registriert
- Browser- und iOS-WebView-Build: bytegleich
- Xcode-Struktur: Bundle-ID `app.midwx.weather`, Marketingversion `0.9.68`,
  Build `2`, URL-Schema `midwx` registriert
- Dependency-Policy und High-Severity-Gate: bestanden; drei moderate Hinweise
  verbleiben ausschließlich in der Capacitor-CLI/Xcode-Werkzeugkette

## Auslieferung

Die Worker-Rücksprung-Allowlist wird für das eng begrenzte native URL-Schema
erweitert. Professional-App und Cloudflare-Worker müssen deshalb gemeinsam
aktualisiert werden.
