# MID-C36 · Aktuell: solare Übergänge im 12h-Wetterstreifen

Verifizierte Basis: `main=mid-stable=5ad8be1fbafbcbfbc9d1aeda451b3e642a947617`, v0.9.85.293, Installer 39158231540 attempt 2 erfolgreich. Eigenständiger Integrationsbranch `codex/v0.9.85.294-skybar-consumers`; keine Übernahme ungesicherter Paralleländerungen.

## Fehler und Korrektur

Der aktuelle 12h-Streifen verwendete `detailSkyBarTimedSegments` ohne den bereits vorhandenen solaren Splitter. Ein klarer Modellstundenslot, dessen Sonnenuntergang nach 15 Minuten liegt, wurde dadurch vollständig gelb dargestellt. Der alte Adapter ersetzte zudem jede Teilsegmentgeometrie beim Mapping durch die vollständigen Slotgrenzen; ein bloßer Austausch des Renderers hätte deshalb nicht gereicht.

Der Adapter akzeptiert jetzt optional dieselben absoluten Nachtbänder aus `solarTimelineWindow` wie der Hintergrund des aktuellen Temperaturprofils. Im normalisierten Einzelslot erzeugte Teilsegmente werden einzeln in die wirklichen Epochengrenzen zurückgerechnet und erst anschließend am sichtbaren Zeitfenster beschnitten. Vollständig außerhalb liegende Teilstücke entfallen. Ohne Nachtbänder bleibt der bisherige Aufruf kompatibel.

Die Modellstunden bleiben vollständig, einschließlich des bereits vergangenen Anteils der laufenden Stunde. Die kurzzeitigen Niederschlagssegmente verwenden unverändert den unabhängigen finalisierten 15min-/Stundenpfad ohne solare Aufteilung. Mengen, Phase, Intensität, Zeitgrenzen, Missing-Masken und physikalische Sonnenscheindauer werden nicht verändert. Optionale Stundenquadrate behalten ihren diskreten Slotvertrag.

## Prüfung

- Alle 2985 nicht generierten Stable-Blobs der isolierten Arbeitskopie wurden vor Änderungen gegen ihren Git-Objekthash geprüft. Keine bestehende Arbeitskopie zurückgesetzt oder überschrieben.
- Eigene `npm ci --offline --ignore-scripts --no-audit --no-fund`: 202 Pakete aus dem vorhandenen Cache, unveränderte Paketversionen. Security-Audit separat; Installation allein ist kein Sicherheitsnachweis.
- `test-skybar-solar-epoch-split-0985278.mjs`: bestehende Tests plus tatsächliche 12h-Geometrie, angeschnittene Dawn-/Dusk-Slots, 15/60min, Wolkenschwellen, unbekannte Bewölkung, beide deutschen DST-Umstellungen und strukturell identische Niederschlagssegmente. App-Verbrauchervertrag und Initialisierungsreihenfolge geprüft.
- `test-skybar-short-sunshine-0985268.mjs` und `test-complete-calendar-day-current-skybar-0985285.mjs` gezielt bestanden. Die bestehende Pflichtregression bleibt in beiden Baseline-Inventaren; keine Gate- oder Budgetänderung.
- Gemeinsamer SVG-Renderer im isolierten Chromium153: 14 Fixtures, 320/390/430/844/768/1024/1440 px, Light/Dark, Dusk/Dawn/graue Bewölkung/Regen; exakte SVG-Geometrie, kein horizontaler Überlauf und keine Laufzeitfehler. Dies ist ein Renderer-Fixturenachweis, keine vollständige App- oder Geräteabnahme.
- Produktionsbuild und kanonische Typprüfung erfolgreich. Erster vollständiger Lauf: 998/999; einziger Fehler war die neue Release-JSON im Root statt unter docs/. Datei umgelegt, unveränderter Hygiene-Test grün; vollständiger Wiederholungslauf 999/999 erfolgreich in 119,1 s.
- Tatsächliche React-Komponenten Current und ShortTermRibbon/Today über Vite: 48 Fälle (sechs Viewports 320/390/412/844/1024/1440, Light/Dark, Classic/Next, Band/Quadrate), exakte berechnete Sonnenuntergangsgrenze im Current-Band, unveränderter 15min-Regen, gemeinsame Beschriftung und keine Überläufe/Laufzeitfehler. Isolierter Chromium153; nur Browser-Fixture, keine Live-Produktions- oder physische Geräteabnahme.
- Kanonischer Audit: 83 Produktionspaketversionen, npm-Bulk erfolgreich, keine Befunde/Providerfehler. Lockfile-SHA256 46082ad0f25d4fa55d159f151d6ab6870cc305efd2dcfb7ec860bd16d5fd6141; keine Paketversion geändert.
- Aktuelle CI-/Releasebelege stehen aus. Ein laufender oder fehlgeschlagener Check ist kein Erfolg.

## Grenzen und Fortsetzung

Issue #374 bleibt offen. Die klassische Forecast-/Hourly-Detailansicht besitzt eine separate nominale 23h-Achse und 3h-Aggregation. Deren Intervalle, Nachtflächen und Ereignismarker müssen zusammen korrigiert und an echten 23/25h-Kalendertagen geprüft werden; dieser eng begrenzte 12h-Fix behauptet keine vollständige appweite Lösung. RUC #352, ursprünglicher Warnungsfall #411 und Open-Meteo #405 bleiben unabhängige Pakete. Keine physische iOS-/WKWebView-/VoiceOver-Abnahme.

Veröffentlichung ausschließlich über Source-PR-Gate → bestehenden SHA-gebundenen Bot-Merge → serverseitiges ZIP → install-mid.yml → betroffene Worker/Pages → Stable-Promotion. Vor dessen erfolgreichem Abschluss ist .294 ein unveröffentlichter Kandidat.
