# MID v0.9.41.5

## Wetterplaner als eigenständige Dashboard-Sektion

- `Wetterplaner & Events` ist nun ein eigener `DashboardModuleId`.
- Der Wetterplaner erscheint im Navigationsblock `Profile & Planung`.
- Die Sektion ist standardmäßig aktiviert und wird über den bestehenden zentralen Modulkatalog automatisch in `Einstellungen → Dashboard → Sektionen und Reihenfolge` angezeigt.
- Der bisherige `Reisewetter & Reiseplaner` bleibt als eigenständige Klimatologie-/Reisezeitfenster-Sektion erhalten.
- Die versteckte Einbettung des `EventPlannerPanel` in `TravelPlannerPanel` wurde entfernt.
- Das Event-Center auf der Startseite verlinkt nun direkt auf `Wetterplaner & Events` und öffnet danach ggf. das gespeicherte Event.
- Die bestehende Event-Center-Persistenz (`mid:event-center:v1`) bleibt kompatibel.

## Regression

Neu: `scripts/test-event-planner-module-09415.mjs` schützt Modulkatalog, Navigation, Einstellungen, Lazy-Rendering, Trennung vom Reiseplaner und Event-Center-Deep-Link.
