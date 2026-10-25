# MID 0.9.85.334 – Dunkles horizontales Wortbild

## Änderung

`public/mid-logo-dark-horizontal.png` verwendet nun die bereitgestellte Dark-Mode-Horizontaldatei aus `MID-logo-dark-assets(1).zip`. Das PNG hat 2048 × 768 Pixel, einen transparenten Hintergrund und SHA-256 `62435a0b4e03faeb719717c36ef8ad24937e9e1be3b62025723a4d3b4a138bd6`.

Die bestehende Boot-Logo-Auswahl in `index.html`, der responsive Marken-Kopf und der Offline-Shell-Cache verweisen bereits auf diesen stabilen Pfad. Der neue Schriftzug macht die dunkle horizontale Variante zum Gegenstück des bestehenden hellen Wortbilds. Es werden keine weiteren Bilddateien oder Runtimepfade geändert.

## Asset-Abgleich

Die gelieferten kompakten Light-/Dark-Logos, Favicons, Apple-Touch-Icons, PWA-Icons, App-Icons und das helle horizontale Logo stimmen bytegenau mit den jeweils verwendeten Stable-Dateien überein. Der neue dunkle Horizontal-Schriftzug ist die abweichende Datei.

## Regression

`scripts/test-logo-theme-assets-09748.mjs` prüft jetzt zusätzlich PNG-Abmessungen und SHA-256 des dunklen horizontalen Logos. Die Prüfung der Theme-Auswahl, Boot- und Headerpfade, Manifest-Icons, Offline-Cache-Einträge und iOS-Kataloge bleibt unverändert. `scripts/test-visible-solar-clock-0985326.mjs` bestätigt außerdem bereits den separaten Screenshot-Auftrag: kein Timer im Hintergrund, sofortiger Aktualisierungslauf bei Rückkehr und DST-Epochenprüfung.

Diese Änderung betrifft nur das Markenbild. Es gibt keine Änderung an Wetterdaten, Karten, Zeitzonen, Worker-Verhalten oder meteorologischen Berechnungen. Physische iOS-/VoiceOver-Abnahme ist nicht Teil dieses Asset-Updates.
