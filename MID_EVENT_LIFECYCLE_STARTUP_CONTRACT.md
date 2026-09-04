# MID Event Lifecycle & Startup Contract

## Status
Verbindlicher App-Vertrag ab MID v0.9.53.34.

## 1. Event-Lebenszyklus
- Ein gespeichertes Event ist **abgelaufen**, sobald seine am Event-Ort interpretierte Endzeit vor dem aktuellen Zeitpunkt liegt.
- Datum und Uhrzeit werden mit der Zeitzone des Event-Ortes interpretiert; die Browser-Zeitzone darf ein Event an einem anderen Ort nicht vorzeitig oder verspätet als abgelaufen markieren.
- Laufende und zukünftige Events stehen in kompakten Übersichten vor abgelaufenen Events. Abgelaufene Events bleiben sichtbar, werden aber visuell zurückgenommen und eindeutig mit `Abgelaufen` gekennzeichnet.
- Abgelaufene Events dürfen keine relevante Änderungsmarkierung an der Event-Glocke erzeugen und werden nicht mehr automatisch mit neuen Wetterläufen aktualisiert.
- Abgelaufene Events müssen ohne Vergrößerung der Karten leicht entfernbar sein. In der Hauptübersicht ist dafür eine direkte kompakte Löschen-Aktion zulässig; im Glocken-Popover muss beim Aufklappen ebenfalls eine direkte Entfernen-Aktion vorhanden sein.
- Das Entfernen eines Events verändert keine normalen Ortsfavoriten.

## 2. Splashscreen / Startphase
- Der Splashscreen folgt vor dem React-Mount bereits dem gespeicherten Designmodus bzw. der Systemdarstellung: Light bleibt hell, Dark bleibt dunkel.
- Das vollständige MID-Logo (Symbol + Wortmarke + Unterzeile) wird prominent und ohne Verzerrung dargestellt. Es darf nicht auf ein kleines quadratisches Symbol reduziert werden.
- Während des Splashscreens dürfen aktuelle Startdaten vorab geladen werden, **ausschließlich über bestehende MID-Datenzugriffe und Cache-/Prioritätsregeln**. Es dürfen keine parallelen Sonder-APIs oder abweichenden Forecastpfade entstehen.
- Die Startvorladung verwendet den nach Persistenz-/Geräteabgleich maßgeblichen letzten Standort, respektiert Offline-Zustand, vorhandene frische Forecast-Caches und Open-Meteo-/Worker-Schutzregeln.
- Die zusätzliche Splash-Wartezeit bleibt hart auf **maximal 900 ms** begrenzt; danach wird unabhängig vom Stand der Vorlade-Promises gerendert.
- Die Vorladung darf den sichtbaren App-Start nicht wesentlich blockieren. MID wartet nur kurz auf die Kernprognose; bei langsamer Verbindung übernimmt die App denselben bereits gestarteten Promise und lädt normal weiter.
- Der Splashscreen ist kein zweites Dashboard: Er darf nur den bereits rate-limit-geschützten **leichten Ensemble-Mean/Spread-Bootstrap** und benötigte UI-Chunks vorziehen. Die vollständige Member-/Mehrmodell-Ensemblefusion, Radar, Langfrist- und andere schwere Sekundärdaten bleiben außerhalb des Splashscreens und folgen nach dem normalen App-Mount ihren bestehenden Lazy-/Prioritätsregeln.

## 3. Regression
Änderungen an Event-Center, Startlogik, Persistenz oder Forecast-Loading müssen `scripts/test-event-lifecycle-startup-095334.mjs` bestehen.
