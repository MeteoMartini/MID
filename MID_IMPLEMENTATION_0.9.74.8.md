# MID Implementation v0.9.74.8

## Anlass

Die neu finalisierten hellen und dunklen MID-Logo-Sets sollen verbindlich im nächsten MID-Release verwendet werden. Bisher nutzte v0.9.74.7 zwar zwei wählbare quadratische Logos, verwendete dasselbe Format jedoch für Header, Bootscreen und Favicon. Außerdem war die automatische Zuordnung noch auf den früheren Kontrastvertrag „dunkles Logo auf heller Fläche“ ausgerichtet und die manuelle Auswahl wurde im React-Pfad nicht zurückgeschrieben.

## Umsetzung

- Verbindlicher `MID_LOGO_ASSET_CONTRACT.md` mit Light-Set für Light Mode und Dark-Set für Dark Mode.
- Getrennte Assets für App-/PWA-Icon, Apple-Touch-Icon, Kompaktmarke, horizontale Wortmarke, Favicon, Social Card und nativen Splashscreen.
- App-Kopf verwendet die transparente Kompaktmarke; der Web-Bootscreen verwendet die vollständige horizontale Wortmarke.
- Frühe Boot-Auflösung synchronisiert Wortmarke, Favicon und Apple-Touch-Icon noch vor React.
- Einstellungen zeigen echte Light-/Dark-Vorschaubilder; `Auto` folgt dem wirksamen Theme.
- Manuelle Logoauswahl wird dauerhaft unter `mid:brandLogoVariant` gespeichert und aktualisiert das Favicon unmittelbar.
- Manifest enthält echte 192-/512-PWA-Icons; Service Worker und Legacy-Service-Worker cachen beide Theme-Sets offline.
- Open Graph, Twitter und strukturierte Metadaten verwenden die neue 1200 × 630 px Social Card.
- iOS `AppIcon.appiconset` und `Splash.imageset` enthalten eine universelle helle sowie eine `luminosity: dark`-Variante. Der gemeinsame React/Vite-Kern bleibt unverändert.

## Regression

`scripts/test-logo-theme-assets-09748.mjs` prüft:

- verbindliche Pfade und Pixelgrößen,
- unterschiedliche Light-/Dark-Dateien,
- korrekte Auto-Auflösung und Persistenz,
- Boot-, Favicon-, Apple-Touch-, Metadaten- und Offline-Pfade,
- PWA-Manifest,
- systemabhängige iOS-App-Icon- und Splash-Kataloge,
- Baseline- und Versionssynchronität.

Der reproduzierbare TypeScript-/Vite-Produktionsbuild, die Worker-Syntaxprüfung und alle **579 von 579** automatisch erkannten MID-Regressionen sind erfolgreich. Zwei historische Splash-Assertions wurden auf das neue horizontale 512 × 200-Asset umgestellt; die Cross-Platform-Regression prüft nun beide systemabhängigen Xcode-App-Icon-Varianten statt des entfernten Einzelicons.

`npm run ios:sync` hat anschließend denselben geprüften `dist`-Stand in `ios/App/App/public` übernommen. Die iOS-Shell-, Safe-Area-, WidgetKit- und Privacy-Manifest-Prüfungen sind grün. Apple-SDK-Build und Simulatorstart bleiben ordnungsgemäß das nächste macOS-/Xcode-Gate.

## Worker

Forecast-Fusion, Datenabruf, RUC, Warnungen und Worker-Runtime wurden nicht fachlich verändert. Workerquellen erhalten lediglich die synchronisierte Releaseversion; ein manueller Worker-Upload ist für v0.9.74.8 nicht erforderlich.

Das unversionierte Releasepaar besteht aus `MID-professional-replacement.zip` ohne `dist/`, `node_modules/`, `.git/` und temporäre Testausgaben sowie `MID-worker.zip` mit ausschließlich dem bytegleichen `worker.js`.
