# MID v0.9.76.14 – CI-Vertragsmigration für das modernisierte 24-h-Wetterprofil

## Anlass

GitHub-Installerlauf #788 bestätigte für v0.9.76.13 bereits erfolgreich:

- sichere ZIP-Validierung und vollständige Übernahme des Professional-Releases,
- reproduzierbares `npm ci` mit 244 Paketen,
- 0 hohe Produktionsabhängigkeitsrisiken,
- TypeScript 7.0.2 für App und Node im No-Emit-Strict-Gate,
- Vite 6.4.3 Produktionsbuild.

Der Lauf scheiterte erst anschließend an drei historischen Regressionstests, die
noch das vor der mobilen Profilverdichtung gültige Layout erwarteten.

## Korrektur

Es wurde **kein Produktcode zurückgerollt**. Stattdessen wurden ausschließlich die
drei veralteten Regressionserwartungen auf den aktuellen verbindlichen
24-h-Profilvertrag migriert:

1. `scripts/test-cockpit-meteogram-overlay-scale-09186.mjs`
   - gemeinsame epoch-basierte Geometrie bleibt geschützt,
   - die entfernte dominante Kalenderzeile wird jetzt ausdrücklich ausgeschlossen,
   - `showDateMarker -> major` und `profile-bottom-date` werden geschützt.
2. `scripts/test-mid-weather-profile-axes-09322.mjs`
   - kompakte Seitenränder `68/76/88` links und `34/38/44` rechts,
   - ruhigeres oberes Zeitband (`top: 5px`, 58-%-Shell-Hintergrund),
   - untere Tagesmarker und überdeckungsfeste Achsenbeschriftungen.
3. `scripts/test-mid-weather-profile-thermal-sun-09320.mjs`
   - neuer `major`-Tageswechsel statt altem `other-day`-Vertrag,
   - untere Tagesmarker,
   - expliziter Ausschluss des entfernten Kalender-Overlays.

## Erhalt der parallelen v0.9.76.11-Linien

Der konsolidierte Produktstand bleibt unverändert erhalten:

- standort-/favoritenzentrierter DWD-Originalbildausschnitt in Deutschland,
- Originallegende und inverse Originalpixel-Auswertung,
- rollendes Wetterprofil `jetzt -> +24 h`,
- gemeinsame senkrechte Zeitachse für alle Parameter,
- DWD-Windwarnschwellen, dezente Nachtbereiche und Solarereignisse,
- kompaktere mobile Diagrammränder und vereinheitlichte Achsen.

## Plattform- und Worker-Vertrag

Browser, PWA und iOS-WebView verwenden weiterhin denselben React/Vite-Fachkern.
Die Worker-Fachlogik wurde nicht verändert; nur die zentral synchronisierte
Releaseversionskonstante wird fortgeschrieben. Ein manueller Worker-Upload ist
nicht erforderlich.
