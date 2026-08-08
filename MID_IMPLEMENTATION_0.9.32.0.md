# MID v0.9.32.0

## 24-h-Wetterprofil: Thermik, Hazards und kontinuierliche Wolkenschichten

- Klickauswahl erhält eine senkrechte Zeitschrittmarkierung über alle Profilspuren.
- Zeitskala kennzeichnet Stunden des Folgetages zusätzlich mit dem Datum.
- Die bisherige abgeleitete Wolkenbasis wird vollständig entfernt.
- Temperaturdifferenzen (u. a. T–Td und Differenz Gefühlte-/Lufttemperatur) werden in Kelvin dargestellt.
- Neues Band **Thermisches Empfinden** auf Basis der Best-Match-Gefühlten-Temperatur; fachliche Einordnung nach den DWD-Klassen von sehr kalt bis sehr heiß sowie Benennung prägender Einflussfaktoren.
- **Wetter-Hazards** sind davon getrennt und umfassen Gewitter, gefährliche Niederschlagsarten, Böen sowie Sicht-/Nebelbelastung.
- Vollständige Windrichtungspfeile für jeden Zeitschritt; Farbe über die bestehende MID-Windwarnstufenlogik (grün unterhalb einer Schwelle, danach Warnfarben).
- Wolkenschichten ohne Zwischenraum in meteorologisch/vertikal richtiger Reihenfolge **H / M / L** (oben nach unten). Zeitliche Deckung wird interpoliert; sehr starke stündliche Änderungen erhalten bewusst einen schärferen Übergang.

## Ensemble-Temperaturdiagramm

- Sonnenscheinband auf die gewünschte stärkere Grauabstufung kalibriert: **≤ 50 %** der astronomisch möglichen Sonnenscheindauer ist Grau; **50–100 %** läuft von Grau bis Gelb.
- Legende und Erklärung auf diese Kalibrierung angepasst.

## Regression

- Neue Regression: `scripts/test-mid-weather-profile-thermal-sun-09320.mjs`.
- Bestehende v0.9.31.0-Wetterprofilregression auf die absichtlich entfernte Wolkenbasis aktualisiert.
- Baseline-Vertrag um die neue Regression erweitert.

## Worker

Keine funktionale Worker-Änderung. Der Worker wird ausschließlich auf die Releaseversion synchronisiert.

## Verifikation

- 326/326 automatisch erkannte MID-Regressionstests bestanden.
- 87 TypeScript-/TSX-Dateien syntaktisch mit dem verfügbaren TypeScript-Parser geprüft.
- Worker und beide Service Worker mit `node --check` geprüft.
- Vollständiger `npm ci`/Vite-Produktionsbuild konnte in der isolierten Umgebung nicht ausgeführt werden, weil der interne npm-Registry-Mirror `yallist-3.1.1.tgz` mit HTTP 404 beantwortet und daher keine `node_modules` installiert werden.
