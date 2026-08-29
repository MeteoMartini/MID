# MID 0.9.68.2 – natives Teilen, Import und Export

## Meilenstein

Der in `MID_IOS_STATUS.json` ausgewiesene Meilenstein
`native-share-import-export-with-browser-fallback` ist im gemeinsamen
React-/Vite-Kern umgesetzt. Es existiert kein iOS-Fachfork.

## Umsetzung

- `src/filePlatform.ts` kapselt die Dateiübergabe ohne Kenntnis der Inhalte.
- Im nativen Container wird die erzeugte Datei über Capacitor Filesystem in
  einen temporären Cache geschrieben und über Capacitor Share an das iOS-
  Systemmenü übergeben.
- Die temporäre Cachedatei wird nach Abschluss oder Abbruch zuverlässig
  entfernt. Dauerhafte Dateisystemrechte und Hintergrundzugriffe sind nicht
  erforderlich.
- Browser/PWA behalten Web Share und den bisherigen Downloadfallback.
- MID-Vollsicherungen und Favoritenexporte nutzen denselben Adapter.
- Sicherungs- und Favoritenimporte behalten ihre Dateitypfilter. WKWebView
  öffnet dafür den nativen iOS-Dokumentwähler; Browser verwenden unverändert
  ihren Dateidialog.
- Integritätsprüfung, Größenbegrenzung, Schemaauswertung und fachliche
  Wiederherstellung verbleiben vollständig in den bisherigen Fachmodulen.

## Regression

`scripts/test-native-share-import-export-096682.mjs` schützt nativen Share-
und Cachepfad, Aufräumen, Web-Share-/Downloadfallback, Dokumentwähler,
Fachisolierung, Abhängigkeitspins und die nächste Roadmap-Etappe.

## Abschlussvalidierung

- TypeScript und Browser-Produktionsbuild: bestanden
- vollständige MID-Suite: 556/556 bestanden
- Worker-Syntax und Aggregatsynchronität: bestanden
- Capacitor-Sync: bestanden; Capacitor Filesystem 8.1.3 und Share 8.0.1 sind
  gemeinsam mit App, Browser, Geolocation, Splashscreen und Statusbar im
  Swift-Paket registriert
- Browser-`dist` und alle gemeinsamen iOS-WebView-Dateien: bytegleich
- Xcode-Struktur: Bundle-ID `app.midwx.weather`, Marketingversion `0.9.68`,
  Build `3`
- Produktionsabhängigkeiten: 0 bekannte Schwachstellen; drei moderate Hinweise
  verbleiben ausschließlich in der Capacitor-CLI/Xcode-Werkzeugkette. Das
  angebotene erzwungene Downgrade wurde nicht durchgeführt.

## Auslieferung

Die Cloudflare-Worker-Fachlogik bleibt unverändert. Das Worker-ZIP wird als
versionssynchrones Releasegegenstück mitgeliefert; ein Worker-Upload ist für
diesen Meilenstein nicht erforderlich.
