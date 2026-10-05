# MID v0.9.85.169 · schonende Wartung

## Verifizierte Basis
main = mid-stable = 9fc04b670047ebe00f61ef4e6e376e4a69972b55, v0.9.85.168. Ursprünglicher Wartungscommit 2e7ac19 wurde verlustfrei auf den neuen Stable-Stand übernommen; die .168-Releasepfad-Beschleunigung bleibt vollständig erhalten. Auditbefunde aus .166 wurden gegen .167 nachgeprüft. Die gemeinsame Kartenarchitektur sowie alle Fach-, Daten-, PWA-/iOS- und Exportverträge bleiben erhalten. Isoliertes Worktree; ursprüngliches Audit-Worktree einschließlich seiner Builddateien unangetastet.

## Änderungen
- Unreferenziertes temporäres iOS-Splash-Artefakt (2.883.584 Byte) entfernt. Alle in Contents.json genannten aktiven Bilder bleiben vorhanden.
- Acht benachbarte CSS-Regelpaare mit identischem Selektor im selben Kontext zusammengeführt; vier davon in kanonischen styles-src-Dateien, styles.css anschließend regeneriert. Alle Deklarationen bleiben in ursprünglicher Reihenfolge; keine globale Deduplication über intervenierende Regeln.
- Vorhandene Kopf-/Favoritenregeln korrigiert statt eine weitere globale CSS-Datei einzuführen. Ausschließlich Button-/Location-/Manager-Selektoren; keine Badge-/Icon-/Griff-Vergrößerung. 44 px Mindestzielgröße, horizontale Favoritenleiste bleibt bedienbar. Tatsächliche gesamte CSS-Kaskade im Browser geprüft.
- AppleWidgetSettings und DashboardModuleSettingsPanel laden in eigenständigen Lazy-Chunks erst beim Öffnen ihrer Einstellungsfläche; lokale Suspense-Grenzen halten die restliche Ansicht verfügbar. Props werden aus den Originalsignaturen typisiert; keine Laufzeit-Zyklen. Dashboard-Reihenfolge und Apple-Feed-UI bleiben erhalten.
- Capacitor Core/iOS/CLI 8.5.2, Share 8.0.2 und jsfive 0.4.2 exakt gepinnt; Lockfile sowie native SPM-Referenzen synchronisiert. Keine Overrides, erzwungenen Downgrades oder größeren Framework-Upgrades.

## Bewusste Grenzen
Widget-/PNG-Generator und Bergwetter sind weiter im gemeinsamen App-Modul: eine vollständige Auslagerung würde die zahlreichen gemeinsam genutzten Renderer und Fachhelfer umfassen und ist kein geprüftes Ergebnis dieses kleinen Wartungsstands. Die initiale Verwaltungslast wird hier zuerst durch die isolierbaren Einstellungsflächen reduziert. Haupt-JS sinkt von 1.485.131 auf 1.477.248 Byte; CSS von 1.759.651 auf 1.759.462 Byte. Die bestehenden Budgets werden nicht erhöht; CSS bleibt eng und verlangt weiterhin gezielte komponentenweise Konsolidierung.

## Prüfungen
- TypeScript 7 und Vite-Produktionsbuild, Worker-Syntax, Dependency-Policy und Bundle-/Feature-/Gesamtbudgets.
- iOS cap sync erfolgreich; native Xcode-Kompilierung ist im Linux-Workspace nicht möglich und wird nicht behauptet.
- 14 Browserfälle mit allen aktiven globalen Styles: 320×568, 390×844, 412×915, 844×390, 834×1194, 1024×768, 1440×900 jeweils Light/Dark. Touchziele, Seitenüberlauf, tatsächliche optionale Einstellungen, On-demand-Netzwerkkanten und Laufzeitfehler geprüft. Dies ist eine Komponenten-/Shell-Fixture, kein Live-DWD-Nachweis.
- 12 bestehende App-/Widget-Browserfälle einschließlich tatsächlichem PNG-Export, echten Quartilen, Nachtflächen und Datenlücken erfolgreich.
- Neue Pflichtregression test-maintenance-safe-loading-0985168.mjs; unter Actions führt sie die neue Browsermatrix aus.
- Bestehende statische Versionsprüfungen werden auf die freigegebenen Patchstände aktualisiert. Frühere Implementierungsnachweise bleiben historisch unverändert. Alte 32-/38-px-Literalanker werden durch 44-px-Erwartungen ersetzt und durch reale Browsermaße ergänzt. Keine Funktions- oder Meteorologieprüfung gestrichen.
- Produktionsaudit: 0 bekannte Schwachstellen. Vollständiger Audit: 3 bekannte moderate Entwicklungswerkzeugbefunde (Capacitor CLI → xcode → uuid); kein kompatibler erzwungener Fix.

## Veröffentlichung
Nur Source-PR → Source-PR-Gate → SHA-gebundener Release-Bot → serverseitiges ZIP → Installer/Pages/Worker-Prüfung → Stable-Promotion. Keine lokale ZIP oder direkte main-/Stable-Änderung. Worker-Fachcode unverändert; reine Versionsspiegel folgen dem bestehenden Gate-Vertrag.

## Übernahme auf den zwischenzeitlichen Stable-Stand
Die Kollisionen betrafen ausschließlich Versionsspiegel und Release-Dokumentation. Die veröffentlichte .168-Dokumentation und alle .168-Pipeline-/Regressionsrunner-Änderungen bleiben erhalten; Wartungsnotizen sind separat als .169 abgelegt. Die neue Pflichtregression wird zusätzlich zu den .168-Prüfungen registriert: 912 Tests insgesamt. Keine Workflowänderung Bestandteil dieser Wartungs-PR.
