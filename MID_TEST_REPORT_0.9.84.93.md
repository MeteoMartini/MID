# MID v0.9.84.93 – Testbericht

## GitHub-Fehleranalyse
- Verbindliche stabile Basis vor dem Hotfix: `mid-stable` v0.9.84.91, Commit `fd3d886018e917962a2c5a6f5d82fb1ad48ea1e4`.
- Fehlgeschlagener Release: Installer #1046, Run `34804929829`, Head `8b28579109f5cdd26f44d5aca6c05e21887a81b2`.
- `npm ci`, Dependency-Audit, TypeScript-Prüfung und Vite-Produktionsbuild waren im GitHub-Installer erfolgreich.
- Exakt 2 von 786 Regressionen blockierten anschließend den Release: `test-composite-buffered-playback-097881.mjs` und `test-synoptic-isoheight-visibility-098455.mjs`.
- Nach dem Regression-Gate wurden Capacitor-Übernahme, Worker-/Pages-Deploy und `mid-stable`-Promotion korrekt nicht ausgeführt.

## Ursache
Beide Fehler waren veraltete statische Quelltextverträge gegenüber der bewusst geänderten v0.9.84.92-Architektur:
1. Die Wiedergabegeschwindigkeit wird weiterhin gespeichert, inzwischen aber über `compositeSettingsRef` + Flush statt über den historischen einzelnen Direkt-Effekt.
2. 500-hPa-Isohypsen bevorzugen weiterhin den Modellgitter-Frame, besitzen jetzt aber bewusst einen vektorfähigen Modellframe-Fallback über `vectorIsoheightFrame`; der alte Test verlangte ausschließlich den früheren Direktzugriff.

## Korrekturprüfung
Lokal bestanden:
- `test-composite-buffered-playback-097881.mjs`
- `test-synoptic-isoheight-visibility-098455.mjs`
- `test-bottom-bar-current-persistence-isohypses-098492.mjs`
- `test-composite-synoptic-completeness-098456.mjs`
- `test-ios-floating-bottom-bar-098489.mjs`
- `test-navigation-composite-ruc-098491.mjs`
- `test-versioning.mjs`
- `test-release-lineage.mjs`
- `test-release-upload-budget-097410.mjs`
- Worker und beide Service Worker per `node --check`.

Die Wiedergabe-Regression wurde lokal mit der vorhandenen TypeScript-Parserlaufzeit ausgeführt; die definitive projektgepinnte `typescript-strada`-Version bleibt Bestandteil des GitHub-Installer-Gates.

## Responsive / Lesbarkeit
Da v0.9.84.93 keinen UI-/Produktionscode gegenüber v0.9.84.92 verändert, wurden die bestehenden Viewport-Verträge gezielt erneut ausgeführt. Bestanden haben unter anderem:
- Viewport-/Textfluss für Header, Bottom-Navigation, Prognose-Kompass und 24-h-Einzeldaten,
- mobile/querformatige Overlay- und Tooltip-Geometrie,
- Karten-/Diagramm-Querformat,
- Header-/Versions-/Favoriten-Lesbarkeit,
- Sekundärdetails/Popover,
- appweite Visualisierungs-/Textlesbarkeit und Touch-Responsivität.

Damit bleiben die bereits für typische iPhone-/Smartphone-, Tablet-/iPad- und Desktopbreiten abgesicherten Layoutverträge unverändert. Es wurde für diesen reinen Release-Gate-Hotfix keine neue visuelle Geometrie eingeführt.

## Produktionscode-Differenz
Gegenüber dem hochgeladenen v0.9.84.92-Kandidaten wurde kein fachlicher App-/Radar-/Synoptik-Produktionscode verändert. Geändert wurden ausschließlich:
- die zwei veralteten Regressionstests,
- Versionsmetadaten auf v0.9.84.93,
- Changelog sowie Implementierungs-/Testbericht.

Workerdateien unterscheiden sich fachlich nicht zusätzlich von v0.9.84.92; dort wurde nur die Releaseversion synchronisiert. Die noch nicht ausgerollte fachliche Workeränderung aus v0.9.84.92 bleibt kumulativ enthalten.

## Lokale Voll-Gate-Grenze
Der lokale `npm ci` konnte in der isolierten Ausführungsumgebung nicht abgeschlossen werden, weil diese Umgebung aktuell keine DNS-/Netzwerkauflösung für `registry.npmjs.org` bzw. GitHub besitzt. Ein Offline-Lauf scheiterte erwartungsgemäß an einem nicht gecachten Paket (`yauzl-2.10.0.tgz`). Deshalb wird kein lokaler 786/786-Gesamtlauf behauptet.

Das Risiko ist klar eingegrenzt: Derselbe v0.9.84.92-Produktionscode hat im Installer #1046 bereits `npm ci`, Dependency-Audit, TypeScript 7 und den Vite-Produktionsbuild erfolgreich bestanden; anschließend scheiterten nur die beiden jetzt korrigierten Tests. Der nächste GitHub-Installer bleibt das definitive vollständige Gate mit der projektgepinnnten Umgebung.
