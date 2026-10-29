# MID-C49 · v0.9.85.357 · astronomische Skybar-Zustände

## Verifizierte Basis und konkreter Fehler

`main = mid-stable = 4595367c3439639b25c7decd23d39d57ab66ed92`, freigegebene .356. Offene PRs vor Beginn abgeglichen; keine überlappende neue Skybar-Integration. #490-Codefixes sind bereits veröffentlicht; die Code-Scanning-Alert-API bleibt über den Connector unzugänglich, also keine erfundene Alert-Schließung.

Auf unverändertem Stable-Source reproduziert: `astronomicalIsDayAt` benötigt bislang beide lokalen Sonnenereignisse in der Reihenfolge sunrise < sunset. Tromsø, 21.06.2026 12 UTC mit Fallback false ergibt fälschlich Nacht inklusive ganztägigem Nachtband; 21.12.2026 mit Fallback true fälschlich Tag ohne Nachtband. Das ist ein reproduzierter Source-Befund mit absichtlich gegensätzlichem Providerwert, keine Behauptung, dass der Provider diese falschen Flags tatsächlich ausliefert.

## Vollständige Zustandsentscheidung

- Normale lokale Ereignisfolge behält exakt sunrise <= epoch < sunset.
- Sunrise nach sunset: lokale Nacht nur zwischen sunset und sunrise.
- Nur sunrise oder nur sunset: Wechsel exakt an diesem echten Ereignis.
- Kein tägliches Ereignis: begrenzte nächste-Rise-/Set-Suche mit Astronomy Engine, beide Richtungen +1/-1, maximal 370 Tage. Nächster sunset vor nächstem sunrise bedeutet Tag, umgekehrt Nacht. Keine erfundenen lokalen Zeitstempel und kein abweichendes Altitude-/Twilight-Modell.
- Gleiche reale SearchRiseSet-Definition (Sonnenoberkante, Refraktion, Beobachter) wie normale MID-Sonnenereignisse. Ergebnis im bestehenden 96-Tagescache. Bei nicht bestimmbarer Astronomie bleibt der ausdrücklich übergebene Fallback erhalten.
- Gemeinsamer Ereignisordnungshelfer auch für 15-/60-Minuten-Kurzfristinterpolation. Kanonische Hour-/Minute15-Mapper, Zeitachsen und gemeinsame Skybar-Verbraucher erben die astronomische Entscheidung.

Context7: `/cosinekitty/astronomy`, JavaScript SearchRiseSet, Recherche 29.10.2026; gegengeprüft mit tatsächlich installiertem Lockfile-Paket. Keine Dependency-Migration. Nächste Ereignissuche ausschließlich für Tage ohne lokale Ereignisse; normale lokale Tage erhalten keinen zusätzlichen Jahressuchlauf.

## Reproduzierbare Abnahme

`scripts/test-skybar-polar-solar-0985357.mjs` führt den kompilierten Produktionscode aus: 1.128 geprüfte Zeitachsenpunkte, beide Hemisphären und geografische Pole, 1/7/14 Tage, beide Provider-Fallbacks, tatsächliche Tromsø-Übergangstage mit einseitiger bzw. inverser Ereignisfolge, exakte Ereignisepochen ±1 ms, unabhängige direkte Astronomy-Engine-Next-Event-Abfrage und Altitude-Plausibilität weit vom Horizont. Zusätzlich echte mapHours/mapMinutely15-Eingaben mit gegensätzlichen Providerflags und immutable Quellobjekten. Normale 23-/25-h-DST-Grenzen, reale 0/Missing und unveränderte Niederschlagsmengen/-intensitäten/-geometrien bleiben geschützt. Test in beiden Baseline-Inventaren.

`tools/qa/skybar-polar-browser.mjs` ist eine zusätzliche ausführbare Fixture mit echtem ShortTermRibbon und gemeinsamem SVG-Renderer, 90min/24h plus 12h/24h/7d/14d-Tracks. Matrix: 320/390/430/834/1024/1440px × Light/Dark × band/squares × sechs Szenarien (Polartag, Polarnacht, einzelner Sonnenaufgang, inverse Ereignisfolge, beide Berliner DST-Tage). Prüft Laufzeitfehler, Overflow, alle sechs 90-Minuten-Slots, zeitliche Registrierung, kein Gelb in Nachtbändern und echtes SVG→Canvas→PNG inklusive Pixelprobe. Der Bericht wird erst nach vollständig erfolgreicher Matrix geschrieben; Screenshots für sechs 390px/Light/Band-Szenarien.

Lokale Ausführung nutzt ein separates Playwright-Modul und `CHROMIUM_PATH`, ohne Produktionsabhängigkeit:

```sh
MID_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/absolute/path/to/chrome-headless-shell \
MID_SKYBAR_QA_DIR=/absolute/path/to/output \
node tools/qa/skybar-polar-browser.mjs
```

## Tatsächlich ausgeführte lokale Prüfungen

- Node-Produktionstest einschließlich echter mapHours/mapMinutely15: erfolgreich, 1.128 Zeitachsenpunkte plus Ereignis-/Mapper-Assertions.
- Browser: Chromium Headless Shell **141.0.7390.37**, **144/144 Fälle**, **576 Trackprüfungen**, SVG→PNG und Pixelproben erfolgreich. Maschinenlesbarer vollständiger Bericht: `MID_C49_SKYBAR_POLAR_BROWSER_357.json`. Screenshotserie zusätzlich erzeugt; Polartag-Screenshot visuell geprüft; keine Produktiv-/Gerätefreigabe daraus abgeleitet.
- `npm ci`, TypeScript-7-App-/Node-Prüfung und Produktionsbuild erfolgreich; 118 gebaute Assets. Performance-Vertrag erfolgreich. `npm audit --omit=dev`: 0 bekannte Schwachstellen.
- Lokaler vollständiger Core-Lauf: 1.027/1.031 beim ersten Lauf erfolgreich. Zwei alte Transpile-Harnesses strippten alle Imports; sie binden jetzt den tatsächlichen Produktions-Ereignishelfer ein, ohne Assertions zu ändern. Beide erneut erfolgreich. Zwei RUC-Tests benötigten die vorhandenen CI-Python-Requirements; nach Installation beide unverändert erfolgreich (einschließlich echtem GRIB-/Bitmap-/Gebietsvertrag). Damit alle 1.031 Core-Prüfungen ausgeführt und nachgewiesen, vier gezielte Wiederholungen; kein blinder Gesamtretry.
- Source-/Installer-/Releasebelege werden am exakten Source-Head im PR ergänzt; kein Grün aus einem noch laufenden Gate behauptet.

## Grenzen und verbleibende Aufträge

Kein Schluss auf physische iOS-/WKWebView-/VoiceOver-Abnahme aus Chromium. Die zusätzliche Matrix ist eine Produktionskomponenten-Fixture mit vollständiger eager CSS-Kaskade, kein Screenshot sämtlicher Appnavigation, aller Widgets oder sämtlicher URL-Exportflüsse. Die rasterisierte Exportprobe verwendet denselben gemeinsamen SVG-Renderer; sie ist keine vollständige native Widget-Auslieferungsabnahme. Native Worker-Provider-Astronomie bei fehlenden täglichen Providerereignissen und die gesonderte Qualifikation täglicher Sonnenschein-/Tageslängensummen sind nicht Teil dieser Tag-/Nachtzustandskorrektur. Kein CSS-Split, keine Vollgebiets-/ECMWF-Produktivaktivierung, keine Wetterdaten-/Schwellenänderung. #374 bleibt für diese weiteren Abnahmen offen.

Release ausschließlich Source-PR → vollständiger SHA-Gate → bestehender MID-Bot → Server-ZIP → Installer → Worker/Pages → Stable. Lauf- und Commitnachweise werden nach tatsächlicher Bestätigung im PR/Issue ergänzt; keine Veröffentlichung aus lokalen Tests ableiten.
