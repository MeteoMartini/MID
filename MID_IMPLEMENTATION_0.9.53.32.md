# MID v0.9.53.32 – Langfrist-/Hauptsektions-Startzustand dauerhaft repariert

## Anlass

Trotz v4-Default-closed-, Hash- und Geräte-Sync-Schutz konnte die Langfrist-Sektion nach einem App-Neustart erneut offen erscheinen. Die erneute Ursachenanalyse zeigte, dass `mid:module:<id>:open` zwar vom Geräte-Sync ausgeschlossen war, aber weiterhin in zwei lokalen Recovery-Ebenen als dauerhafte Nutzerdaten behandelt wurde:

1. `storageSafety.ts` spiegelte den Wert in IndexedDB und konnte einen älteren Wert beim Bootstrap wieder nach LocalStorage schreiben.
2. `persistence.ts` nahm den Wert in den Recovery-Snapshot/Cache auf und konnte ihn bei fehlendem LocalStorage-Wert wiederherstellen.

Damit war der appweite Vertrag „gerätelokaler View-State“ technisch unvollständig umgesetzt.

## Umsetzung

- Hauptmodul-Offenzustände und `mid:module-open-contract:*` sind aus `persistence.ts`-Snapshots ausgeschlossen.
- `storageSafety.ts` behandelt diese Schlüssel nicht mehr als durable Werte, liest sie niemals aus dem Fallback-Spiegel und entfernt alte IndexedDB-Spiegelwerte beim Start.
- Der Hauptmodulvertrag wurde auf `v5` angehoben. Die Heilungsmigration setzt alle Hauptsektionen – einschließlich `long-range` – einmalig geschlossen und entfernt v2/v3/v4-Marker.
- `CollapsibleModule` persistiert Öffnen/Schließen synchron innerhalb des State-Übergangs. Ein App-Hintergrundwechsel unmittelbar nach einem Tap kann die Nutzerentscheidung damit nicht mehr vor der Speicherung überholen.
- Geräte-Sync-Ausschluss bleibt unverändert bestehen. Damit sind nun alle drei möglichen Wiederherstellungsebenen konsistent: Sync, Recovery-Snapshot und StorageSafety-Spiegel.

## Dauerhafter Vertrag

`MID_STATE_INTEGRITY_CONTRACT.md`, `MID_UI_ARCHITECTURE_CONTRACT.md` und `MID_SOURCE_OF_TRUTH.md` wurden entsprechend verschärft. Required Regression: `scripts/test-module-open-recovery-isolation-095332.mjs`.
