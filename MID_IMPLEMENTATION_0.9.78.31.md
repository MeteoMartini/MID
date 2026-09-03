# MID 0.9.78.31

## Resilienter Produktionsabhängigkeits-Audit

GitHub-Lauf #867 scheiterte nicht am MID-Code oder am Lockfile, sondern an einem Timeout des auslaufenden npm-Quick-Audit-Endpunkts `/-/npm/v1/security/audits/quick`.

Der Release-Audit verwendet deshalb jetzt einen robusteren Sicherheitsvertrag:

- primär den offiziellen npm Bulk-Advisory-Endpunkt `/-/npm/v1/security/advisories/bulk`,
- bei externer npm-Störung den unabhängigen OSV-QueryBatch-Fallback,
- HIGH/CRITICAL-Befunde blockieren den Release weiterhin,
- der installierte Produktionsbaum wird lokal mit `npm ls --omit=dev --all --json` auf Konsistenz geprüft,
- ein gleichzeitiger reiner Ausfall beider externen Advisory-Dienste wird deutlich als GitHub-Warnung gemeldet, blockiert aber nicht fälschlich einen ansonsten reproduzierbaren MID-Release,
- die bestehende MID Dependency-Upgrade-Policy bleibt nach dem Advisory-Audit weiterhin verbindlich.

Damit wird kein Sicherheitsgate abgeschaltet; lediglich die Abhängigkeit vom instabilen npm-Quick-Endpunkt entfällt.
