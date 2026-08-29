# MID Runtime Lifecycle / Offline Resume Contract

## Gemeinsamer Kern

Browser/PWA und Capacitor-iOS verwenden denselben React/Vite-Fachkern und dieselben Persistenz- und Forecastpfade. Der native App-Lifecycle wird ausschließlich als Plattformereignis in den gemeinsamen Kern übersetzt; es gibt keine native Wetter-, Favoriten-, Event- oder Cache-Sonderlogik.

## Suspend / lokaler Datenschutz

Vor `pagehide`, verborgenem Dokument oder nativem `appStateChange(isActive=false)` startet MID sofort einen best-effort Checkpoint der bereits synchron in `localStorage` geschriebenen dauerhaften Werte. Zusätzlich werden der unabhängige Persistenz-Snapshot und bereits wartende IndexedDB-Spiegelwrites angestoßen/kurz abgewartet. Ein Lifecycle-Checkpoint darf keine Favoriten, Einstellungen, Events, Wetterzwilling-Daten oder andere dauerhafte Nutzerdaten löschen, zurücksetzen oder mit älteren Snapshotwerten überschreiben.

## Resume

`pageshow`, sichtbares Dokument, Netzrückkehr und natives `appStateChange(isActive=true)` münden in `mid:runtime-resume`. Auf iOS erzeugt der Adapter zusätzlich einen sichtbaren `visibilitychange`-Kompatibilitätspuls, damit bestehende gemeinsame Refresh-Handler zuverlässig wieder anlaufen. Nach längerer Unterbrechung wird die aktuelle Ortsprognose nur bei bestehender Netzverbindung neu bewertet; frische lokale Caches dürfen weiterverwendet werden. Keine Wiederaufnahme darf einen Reload oder das Löschen lokaler Daten erzwingen.

## Offline

Bei `navigator.onLine === false` startet die Kernvorhersage keinen aussichtslosen Netzwerkpfad. Liegt ein höchstens 18 Stunden alter erfolgreicher Kernforecast vor, wird er sofort mit Cachealter/Standzeit als Offline-Fallback verwendet. Ohne lokalen Wetterstand endet der Ladevorgang sofort mit einer verständlichen Offline-Meldung; es gibt keinen Endlos-Ladezustand. Die Oberfläche zeigt den Offline-Zustand und die Standzeit des gespeicherten Wetterstands. Bei Netzrückkehr wird einmalig ein frischer Foreground-Abruf ausgelöst.

## Regression

Änderungen an Runtime-Plattform, Persistenz, Storage-Safety, Forecast-Cache oder App-Start/Resume müssen `scripts/test-runtime-lifecycle-offline-resume-09701.mjs` bestehen.
