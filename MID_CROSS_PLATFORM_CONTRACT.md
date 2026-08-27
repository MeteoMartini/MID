# MID – Browser-/iOS-Cross-Platform-Vertrag

## Gemeinsamer Produktkern

MID wird als Browser-/PWA-App und als native iOS-App parallel weiterentwickelt.
Es gibt keinen separaten iOS-Fachfork. React-Oberfläche, Wetterlogik,
`displayHours`/`displayMinutes15`, Modellfusion, Warnungen, Favoriten,
Persistenzverträge, Worker-Routen und Regressionstests bleiben gemeinsame
Quellen der Wahrheit.

Die Etappenfolge und der fortsetzbare Arbeitsstand stehen verbindlich in
`MID_IOS_ROADMAP.md` und `MID_IOS_STATUS.json`.

Die iOS-App verwendet eine Capacitor-Hülle um den gebauten Vite-Stand. Native
Funktionen werden ausschließlich über kleine Adapter ergänzt. Ein Adapter darf
keine zweite Wetter-, Niederschlags-, Warn-, Event-, Einheiten- oder
Favoritenlogik einführen.

## Auslieferung und Prüfung

Jede gemeinsame Änderung muss weiterhin den Browser-Produktionsbuild und die
vollständige MID-Regressionssuite bestehen. iOS-relevante Änderungen prüfen
zusätzlich den gebündelten WebView-Build und die Capacitor-Synchronisierung.

- Browser/PWA bleibt über die unversionierte Professional-ZIP auslieferbar.
- Der Worker bleibt ein eigenständiges, unversioniertes Releaseartefakt.
- Das iOS-Projekt wird aus demselben `dist`-Build synchronisiert.
- Service Worker und PWA-Installationshinweise sind im nativen Container
  deaktiviert; im Browser bleiben sie unverändert aktiv.
- Native Safe Areas, App-Lifecycle und URL-Öffnungen werden über
  `src/runtimePlatform.ts` vermittelt.

## Daten- und Kostenvertrag

Ortsfavoriten, Event-Favoriten, Einstellungen und Wetterzwilling-Daten behalten
ihre bestehenden Schutzverträge. Eine spätere native Speicherung muss
verlustfrei migrieren und darf Webdaten weder ersetzen noch still begrenzen.

Apple-Developer-Mitgliedschaft, Signierung, TestFlight, App-Store-Einreichung
oder kostenpflichtige macOS-CI werden erst nach transparenter Kostenangabe und
ausdrücklicher Nutzerfreigabe aktiviert. Bis dahin werden alle lokal und auf
kostenfreien Laufzeiten möglichen Schritte selbstständig vorbereitet.
