# MID .150: Bottom Bar auf iOS

Ausgangsbasis: main = mid-stable = e6386ca6ed8fbab563261e7b78a96ea15e015c17, veröffentlichtes .149. Fremde Worktrees und offene Dependabot-Arbeit bleiben unangetastet. Runde Kartenskalen, temporäre Ortswerte und parallele Navigation aus .149 bleiben erhalten. Der getrennte Auftrag zur empirischen 14-Tage-Kalibrierung wird nicht durch ungeprüfte Score-Änderungen vorweggenommen.

## Befund und Abgrenzung

Der Nutzerscreenshot zeigt .149 und eine deutlich zu hoch stehende Hauptnavigation. Die vollständige bestehende Chromium-Positionsprüfung bestand auch mit zusätzlicher Bottom-Gap-Assertion; ein normaler CSS-Offset ist damit nicht reproduziert. Apple/WebKit dokumentieren vergleichbare Fixed-Layer-Verschiebungen nach Tastatur-/Scroll-Übergängen. Das ist eine plausible Plattformursache, keine behauptete physische iPhone-Reproduktion:

https://developer.apple.com/forums/thread/800125
https://bugs.webkit.org/show_bug.cgi?id=297779

## Eng begrenzte Korrektur

Der bestehende Body-Portal-Pfad bleibt bestehen. useBottomNavigationAnchor arbeitet ausschließlich auf schmalen iOS-Flächen (iPhone/iPad, einschließlich Desktop-iPad-UA, maximal 850 px). Dort wird die feste Compositor-Schicht durch absolute Dokumentkoordinaten ersetzt: Scrollposition plus sichtbare Viewport-Unterkante minus gemessene Leistenhöhe und kanonischer CSS-Safe-Area-Abstand. Veraltetes offsetTop wird auf die geometrisch mögliche Differenz begrenzt; pageTop wird nicht blind übernommen. Andere Browser und breite Flächen behalten position:fixed. Die sichtbare Leiste bleibt beim Scrollen am Bildschirmrand.

Scroll, Resize, Pageshow und VisualViewport-Ereignisse werden per requestAnimationFrame gebündelt. ResizeObserver berücksichtigt Höhe und Textänderungen. Listener, Observer und Inline-Overrides werden bei Unmount/Moduswechsel vollständig entfernt. Beim Tablet-Breakpoint wird das originale Styling wiederhergestellt. Keine neue Portal-, Dismiss-, Wetter-, Einheiten- oder Kalibrierungslogik; globale CSS-Datei und Budgets bleiben unverändert.

## Prüfvertrag

Die unverändert verpflichtende vollständige Karten-Browsermatrix prüft nun auch den tatsächlichen unteren Rand der mobilen Navigation, nicht nur feste Lage beim Scrollen. Zusätzlich: iOS-UA, veraltetes offsetTop, Größenänderung/Tastatur-Rückkehr, Scroll-up und beide Themes. Der optionale --navigation-only-Lauf beschleunigt gezielte Diagnose, ersetzt aber nicht den vollständigen Standardlauf. Ein optionaler WebKit-Lauf ergänzt die Engine-Prüfung; er ersetzt weder die Chromium-Matrix noch einen physischen iPhone-Test.

Die gezielte Chromium-Navigationsmatrix bestand auf fünf Größen, in beiden Themes und mit/ohne iOS-UA einschließlich simuliertem stale offsetTop. Der zusätzliche Linux-WebKit-Lauf war wegen fehlender Systembibliotheken nicht ausführbar; die reguläre Bibliotheksinstallation scheiterte am Repository-Transport. Ein physischer iPhone-Nachweis wird nicht behauptet.

Lokaler Abschluss: npm run verify erfolgreich (899/899), vollständige Karten-/WMS-/Navigationsmatrix erfolgreich, separate Navigationsmatrix visuell geprüft; npm run audit:dependencies erfolgreich. Keine Änderung an Abhängigkeiten, globalem CSS oder CI-Grenzen. Main-JS 1.494.828 Bytes bleibt unter 1.500.000 Bytes, globales CSS 1.759.941 Bytes bleibt unverändert unter 1.760.000 Bytes.

Veröffentlichung ausschließlich über Source-PR Gate, bestehenden Release-Bot, Installer/Pages und Stable-Promotion. Worker-Fachcode bleibt unverändert.
