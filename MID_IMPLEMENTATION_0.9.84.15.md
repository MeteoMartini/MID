# MID v0.9.84.15 – Grundaudit, Update-Recovery und Laufzeithärtung

## Anlass

Der App-Stand v0.9.84.14 wurde von Grund auf auf fachliche Logik, Start-/Update-Lifecycle, Netzwerkverhalten, Speicherwachstum und vermeidbare Laufzeitblockaden geprüft. Besonderer Schwerpunkt war der reproduzierbare Zustand nach App-Updates, bei dem die Oberfläche sichtbar blieb, jedoch keine Wetterdaten eintrafen und häufig erst ein vollständiges Schließen/Neustarten half.

## Update- und Start-Recovery

- Start-Preloads für Kernforecast, Stationsdaten und Ensemble besitzen jetzt harte Zeitbudgets und echte Abort-Signale.
- Der reguläre Best-Match-/Worker-Forecastpfad kann nicht mehr unbegrenzt auf einzelne Netzwerkanfragen warten; vorhandene Cache- und Stale-Fallbacks bleiben erhalten.
- Die Foreground-Netzwerksperre wird nach terminalem Erfolg **oder** Fehler freigegeben. Ein älterer abgebrochener Request darf einen neueren Lauf nicht freigeben.
- Ein neuer Service Worker wird beim Download nur vorbereitet. Die laufende App bleibt vollständig unter dem alten Controller, bis der Nutzer die Aktualisierung ausdrücklich aktiviert.
- `activeCache` und Service-Worker-Controller wechseln erst im tatsächlichen `activate`-Schritt gemeinsam auf die neue Version. Bis dahin wird die ausführbare Shell cache-first aus genau dem alten aktiven Cache bedient; eine bereits neu veröffentlichte Server-`index.html` kann deshalb nicht mehr mit alten Assets vermischt werden.
- Die neue App-Version gilt nicht mehr bereits nach zwei React-Frames als gesund. MID wartet nach einem Update bis zu 20 s auf nutzbare Kernforecastdaten; bleibt dieser Nachweis online aus und ist genau dieses Update noch pending, wird der vorherige Stand gezielt reaktiviert und neu geladen.
- Service-Worker-Updateprüfungen, Shell-/Versionsabrufe und Update-Asset-Downloads sind zeitlich begrenzt. Parallele Focus-/Visibility-Prüfungen werden entdoppelt. `version.json`/Manifest werden trotz Cache-Buster nur unter kanonischen Cache-Schlüsseln gespeichert.
- Die Navigation nach erfolgreicher Service-Worker-Aktivierung wird ausschließlich vom neuen Worker durchgeführt. Nach einem realen `controllerchange` startet die alte Seite keinen zweiten zeitversetzten `location.replace()` mehr; das vermeidet einen verbliebenen WKWebView-Navigationsrace.

## Performance und Glitch-Härtung

- Große Wetterzwilling-Historien und das verschlüsselte Langzeitarchiv werden nicht mehr vor dem ersten sichtbaren Render vollständig verarbeitet, sondern anschließend idle-/chunk-basiert fortgesetzt.
- Gerätesynchronisation und Archivabrufe besitzen getrennte, endliche Zeitbudgets; große Archiv-Aktualisierungen werden bei Sichtbarkeitswechseln gedrosselt.
- Direkte Radar-/Rasterpfade (DWD-Niederschlagsart, DWD-HX, HY-ME-C/NG, OPERA, RADOLAN, PX250) nutzen endliche, abortierbare Downloadgrenzen.
- Der HY-ME-C/NG-Rastercache ist auf drei Produkte begrenzt, damit lange Kartensitzungen nicht fortlaufend große Raster im Speicher halten. Auch Event-Flugwetter-, Saison- und Terrain-Morphologie-Memorycaches sind nun explizit begrenzt.
- Eigene Wetterstationen, private Verifikationssensoren, Lüftungsassistent und Push-/Workerpfade können nicht mehr unbegrenzt auf Netzwerkantworten warten. Auch Open-Meteo-Fetchversuche besitzen zentral eine 30-s-Netzwerkgrenze; externe Beobachtungs-/Geocodingdienste (z. B. Photon, Bright Sky, GeoSphere, AviationWeather und EEA) erhalten ein 12-s-Budget. Große historische Reise-Klimaanfragen besitzen zusätzlich ein eigenes 30-s-Gesamtbudget.
- Ortswechsel bzw. Unmount reichen Abort-Signale bis zu den betroffenen Netzwerkanfragen durch.

## Meteorologisch-fachliche Korrekturen

- Die Skybar unterscheidet Himmelszustand und Niederschlags-Overlay: Gesamtbewölkung steuert den Grundzustand, Niederschlag kann bei klassischer Schauerlage über einem gelben Sonnenband liegen.
- Niederschlagsintensitäten werden zentral und intervallbewusst klassifiziert. 15-Minuten-Mengen werden nicht mehr wie Stundenmengen behandelt.
- Dauerregen verwendet die DWD-Stufen leicht/mäßig/stark; es gibt keine erfundene vierte Dauerregenklasse.
- Regenschauer werden auf 10-Minuten-Intensität normiert und können die amtlich vorgesehene vierte Stufe „sehr stark“ erreichen.
- Schnee verwendet die Schneedeckenzunahme in cm/h; Sprühregen berücksichtigt vorrangig die zugehörigen Wettercodes.
- Beim generischen Standard-JSON eigener Wetterstationen werden `rainRate`/`precipitationRate` als Raten behandelt und nicht mehr fälschlich wie Intervallmengen normalisiert. Explizite Mengenfelder bleiben Mengen.
- Ungültige Zeitstempel eines generischen Sensors führen nicht mehr zu einem `toISOString()`-Abbruch, sondern erhalten einen belastbaren Empfangszeitpunkt.

## Geschützter neuer Vertrag

`MID_UPDATE_STARTUP_RECOVERY_CONTRACT.md` beschreibt die verbindlichen Regeln für kontrollierte Service-Worker-Übernahme, Datenpfad-Healthcheck, Rollback, endliche Netzwerkbudgets, Foreground-Freigabe, verzögerte schwere Startarbeiten und die zusätzlichen Speicher-/Rastergrenzen.

Die Regressionen `scripts/test-update-startup-recovery-098415.mjs` und `scripts/test-network-timeout-cache-audit-098415.mjs` sind Teil des Baseline-Pflichtsatzes.

## Worker

Keine fachliche Änderung. `worker.js`, `worker-src/00-core-observations.js` und `worker/metar-proxy.js` unterscheiden sich gegenüber v0.9.84.14 nach Herausrechnen der Versionskennung nicht semantisch.
