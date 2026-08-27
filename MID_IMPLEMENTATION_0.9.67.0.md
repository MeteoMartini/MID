# MID 0.9.67.0

## Gemeinsamer Browser-/iOS-Produktkern

MID erhält ein Capacitor-8-iOS-Gerüst, ohne die Browser-/PWA-App abzuspalten.
Der Vite-Produktionsstand bleibt die gemeinsame Oberfläche und Fachlogik. Der
Cloudflare Worker und sämtliche bestehenden Daten-, Modellfusions-, Warnungs-,
Favoriten-, Persistenz-, Sunshine- und Niederschlagsverträge bleiben
unverändert verbindlich.

`src/runtimePlatform.ts` kapselt die Erkennung des nativen Containers,
App-Lifecycle-Ereignisse, Deep-Link-Ereignisse, Statusbar und Splashscreen. Im
nativen Container werden Service-Worker-Registrierung und PWA-Installation
unterdrückt. Im Browser bleiben Update-/Rollback-System und Installation aktiv.
Safe-Area-Abstände werden für iPhone und iPad ergänzt.

Das bestehende Swift-WidgetKit-Gerüst und der versionierte
`mid.native.widget.v1`-Workerfeed bleiben erhalten und werden in einer späteren
Etappe in das generierte Xcode-Projekt aufgenommen.

Kostenpflichtige Apple-, Signierungs-, TestFlight- oder CI-Schritte sind nicht
Teil dieses Releases und bleiben gemäß `MID_COST_GOVERNANCE_CONTRACT.md`
freigabepflichtig.

## Regression

`scripts/test-cross-platform-ios-shell-09670.mjs` schützt den gemeinsamen Kern,
die gepinnte Capacitor-Werkzeugkette, den lokalen WebView-Build, die native
Laufzeitgrenze, die PWA-Isolation und die fortbestehende Browser-Auslieferung.

Das generierte Xcode-Projekt ist mit MID-Icon und Splashscreen, iOS-15-Ziel,
Bundle-ID, gekoppelter Build-/Marketingversion und deutschen Standort-/
Bewegungsberechtigungstexten vorbereitet. `MID_IOS_ROADMAP.md` und
`MID_IOS_STATUS.json` bilden den fortsetzbaren Etappenvertrag. Nach Umstellung
alter Wartungsversionsprüfungen auf semantische Mindestversionen bestehen
548/548 automatisch erkannte Regressionstests.
