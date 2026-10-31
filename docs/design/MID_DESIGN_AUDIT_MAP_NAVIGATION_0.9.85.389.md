# MID Designaudit #523 · A3 Karten-Navigation (v0.9.85.389)

## SHA-Provenienz
- v0.9.85.388 auf `main=mid-stable` @ `11c56661b371bf9c0da49d0836fcb548d46bf46f`, Installer #41236833866 einschließlich Core, Heavy, Worker, Pages und Stable success.
- Unveränderte fachliche Dateiübernahme aus isoliertem Draft #547 @ `a73b9009172e0f778604314ecca7ea8bed53d8f1`; die alte Draft-Historie und fremde Branches bleiben bestehen.

## Reproduktion und Änderung
Beim Alias-Einstieg `weather-maps` in `src/App.tsx` wird `mid:map-workspace-view` mit `view:'models'` gesendet. Der frühere Handler `MapWorkspacePanel` interpretierte dies wie `totals`. Das verursachte die nachfolgende persistente Umstellung auf `modelId:'icon-d2'` und `parameter:'totals'` in `UnifiedWeatherMap`. `models` bewahrt nun die Auswahl, während `totals` die bisherige ausdrückliche Funktion erhält. Ein legacy `totals`-Speicherwert wird nur ohne bestehende Unified-Map-Einstellungen migriert.

## QA
Erweitert: bereits verpflichtender `scripts/test-map-workspace-handoff.mjs` mit transpiliertem Handler-/Initialisierungscode und adversariellen Event-/Storage-Fällen. 1059 Regressionen je Inventar erhalten. Browser-Screenshots für Light/Dark, 320/390/430/768/1024/1440/1920px, Touch/Keyboard, reale iOS-Geräte, VoiceOver, Widgets und Exportparität sind durch diese reine Navigationseinheit nicht automatisch bestätigt und bleiben im Master-Audit #523 offen. Keine Änderung an WMO-/DWD-Warnsemantik, Modellgültigkeiten oder RUC-Feeds.

## Releasegrenze
Noch nicht freigegeben. Erforderlich ist vollständiges Source-PR-Gate → kontrollierter SHA-Merge → Release-ZIP → Installer → Worker/Pages → Stable.
