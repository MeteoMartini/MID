# MID Designaudit #523 – Karten-Navigationszustand (Draft, nicht veröffentlicht)

Stable-Basis: v0.9.85.387 @ `83d5c1d9e7c0ce082242e71aec855d8319340169`. Der Installer #41232575766 war erfolgreich einschließlich Core, Heavy, Worker, Pages und Stable. Die getrennten Drafts #543 (Cleanup) und #546 (.388 RUC) bleiben unberührt; eine eigenständige Version .389 ist noch **nicht** freigegeben.

## Ursache
`App.tsx` versendet beim historischen Wetterkarten-Einstieg `mid:map-workspace-view` mit `view:'models'`. Der vorherige Handler behandelte `models` wie `totals` und forderte `icon-d2-precipitation-totals` an. `UnifiedWeatherMap` übernahm danach `parameter:'totals',modelId:'icon-d2'` und speicherte die Änderung als Nutzerpräferenz.

## Lösung und Abnahmekriterien
- Der allgemeine Modellkarten-Einstieg verändert das gewählte Modell/Produkt nicht.
- Nur ein expliziter `view:'totals'`-Aufruf aktiviert ICON-D2-Niederschlagssummen.
- Die historische Speicherkennung `totals` wird nur ohne bereits vorhandene Unified-Map-Einstellungen migriert; `models` allein ist kein Summen-Aufruf.
- Obligatorischer bestehender Test `scripts/test-map-workspace-handoff.mjs` wird um tatsächlich transpilierten Handler-/Initialisierungstest für `models`, `totals`, ungültige Events, Legacy und gespeicherte Modellpräferenzen ergänzt.

**Releasegrenze:** Dieser Branch enthält nur Quellkorrektur, Test und Auditnotiz. Keine Versionsspiegel/Changelogs geändert, keine produktive Freigabe. Vor Integration muss die zu diesem Zeitpunkt gültige Stable-SHA erneut geprüft, die RUC-Version .388 koordiniert, der tatsächliche Release-Build vollständig versioniert und die Source-PR→ZIP→Installer→Worker/Pages→Stable-Kette erfolgreich nachgewiesen werden. Keine reale Browser-/iOS-/VoiceOver-Abnahme aus Quelltests ableiten.
