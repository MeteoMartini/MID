# MID v0.9.53.34

## Event-Lifecycle
- Abgelaufene Events werden anhand der Endzeit in der Zeitzone des Event-Orts bestimmt; über Mitternacht laufende Termine werden korrekt bis zum Folgetag behandelt.
- Laufende/zukünftige Events bleiben in Übersichten vor abgelaufenen Events.
- Abgelaufene Events erhalten kompakte Kennzeichnung, reduzierte Optik und direkte Entfernen-Aktionen in Übersicht, Glocken-Popover und Detailansicht.
- Abgelaufene Events erzeugen keine neue Änderungsmarkierung an der Glocke und werden nicht mehr automatisch im Hintergrund wetterseitig aktualisiert.

## Splashscreen / Startvorladung
- Splashscreen folgt bereits vor React-Mount dem gespeicherten Light-/Dark-/Auto-Design.
- Vollständiges MID-Logo (512×288) wird deutlich größer und unverzerrt dargestellt; Apple-Touch-Icon nutzt wieder das quadratische 180-px-Icon.
- Startstatus informiert über lokale Wiederherstellung, Geräteabgleich und Wettervorladung.
- Nach Persistenz-/Geräteabgleich startet eine kurze kanonische Kernforecast-Vorladung für den maßgeblichen letzten Standort. Die App übernimmt denselben Promise, statt eine parallele Anfrage zu erzeugen.
- Frische Forecast-Caches, Offline-Zustand, Worker-/Open-Meteo-Schutz und bestehende Request-Prioritäten bleiben maßgeblich. Die Vorladung blockiert den Start höchstens kurz (550 ms).

## Vertrag / Regression
- Neu: `MID_EVENT_LIFECYCLE_STARTUP_CONTRACT.md`
- Neu: `scripts/test-event-lifecycle-startup-095334.mjs`
