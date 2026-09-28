# MID v0.9.53.27 – Favoriten- und Sektionsintegrität

## Ziel

Der bisherige Umgang mit Favoriten und Hauptsektionen wird zu einem dauerhaft geschützten State-Vertrag ausgebaut. Ortsfavoriten dürfen nicht mehr durch Limits, Import, Normalisierung, Geräte-Sync oder Event-Favoriten verschwinden. Alle großen auf-/zuklappbaren Dashboard-Sektionen folgen demselben gerätelokalen Persistenzprinzip.

## Favoriten

### Keine stille Verdrängung mehr

Die frühere 20er-Begrenzung war ein echter Datenverlustpfad: Beim Hinzufügen konnte der bisher letzte Favorit verdrängt werden; Laden/Normalisierung konnten weitere Einträge abschneiden. Diese Kappung ist vollständig entfernt. Neue und importierte Favoriten werden mengen-erhaltend verarbeitet.

Die Favoriten-ID ist die dauerhafte Identität. Räumliche Nähe bleibt für die Auswahl eines passenden Favoriten nutzbar, ist aber kein Deduplizierungs- oder Löschkriterium.

### Orts- und Event-Favoriten strikt getrennt

Ortsfavoriten verbleiben in `mid:favorites`, Event-Favoriten im Event-Center `mid:event-center:v1`. Event-artige Datensätze werden sowohl bei der lokalen Normalisierung als auch im Geräte-Sync aus dem Ortsfavoritenpfad zurückgewiesen. Eine versehentliche Kontamination wird bereinigt, ohne gültige Ortsfavoriten zu verwerfen.

### Shadow-Recovery und Tombstones

`mid:favorites:shadow:v1` hält zusätzlich den letzten gültigen Ortsfavoritenstand. Ist der Primärstand beschädigt, kann MID daraus wiederherstellen.

Explizite Nutzerlöschungen erzeugen in `mid:favorites:tombstones:v1` zeitgestempelte Tombstones. Damit bedeutet das bloße Fehlen eines Favoriten in einem entfernten Snapshot nicht mehr automatisch „löschen“; eine echte Löschung kann trotzdem kontrolliert über Geräte hinweg propagiert werden.

### Verlustfreier Geräte-Sync

Lokale und entfernte Ortsfavoriten werden als Union nach stabiler ID zusammengeführt. Parallele Neuanlagen auf zwei Geräten bleiben erhalten. Tombstones sind der einzige geräteübergreifende Löschbeleg. Event-Favoriten behalten ihren separaten Mergepfad.

## Einheitliches Sektionsverhalten

Der Hauptmodulvertrag wird auf `mid:module-open-contract:v4` angehoben.

- Berg-/Wintersport, Wassersport, Kompositbild, Ensemble, Langfrist, Prognosegüte, Reiseplaner, Eventplaner, Flugmeteorologie, Wetterkarten und Widget sind beim Vertragsstart einheitlich geschlossen.
- Danach gilt ausschließlich die letzte lokale Nutzerentscheidung pro Sektion.
- Ein `#mid-section-*`-Hash wird bei jedem App-Bootstrap entfernt, nicht nur bei einer einmaligen Migration.
- Hauptmodul-Offenzustände werden aus dem portablen Geräte-Sync ausgeschlossen. Ein anderes Gerät kann daher die lokal geschlossene Langfrist-Sektion nicht wieder öffnen.
- Deep-Link/Navigation darf weiterhin im laufenden Betrieb gezielt die gewünschte Sektion öffnen.

Damit besitzt `Langfrist` keine Sonderbehandlung mehr und kann sich beim App-Start nicht aufgrund eines alten Hashs oder entfernten Sync-Zustands selbst öffnen.

## Dauerhafte Verträge

Neu ist `MID_STATE_INTEGRITY_CONTRACT.md`. Zusätzlich wurden `MID_UI_ARCHITECTURE_CONTRACT.md` und `MID_SOURCE_OF_TRUTH.md` entsprechend verschärft.

## Regression

`scripts/test-state-integrity-contract-095327.mjs` ist Required Regression und prüft insbesondere:

- keine 20er-Kappung oder stille Favoritenverdrängung,
- Shadow-Recovery,
- explizite Tombstones,
- Event-/Ortsfavoriten-Trennung,
- mengen-erhaltenden Geräte-Sync,
- einheitlichen Default-closed-Vertrag aller Hauptsektionen,
- Hash-Neutralisierung bei jedem Bootstrap,
- gerätelokale Hauptmodul-Offenzustände.

## Prüfung des Release-Stands

- 441 automatisch erkannte Regressionstests im Quellstand.
- 439/439 im gelieferten Professional-Archiv ausführbare Regressionen bestanden.
- `test-code-revision-automation-09190.mjs` und `test-radar.mjs` sind im angelieferten Professional-Archiv nicht ausführbar, weil die bereits zuvor fehlenden Dateien `.github/workflows/mid-code-revision.yml` bzw. `.github/workflows/deploy.yml` dort nicht enthalten sind.
- Worker und beide Service Worker syntaktisch mit Node geprüft.
- Ein vollständiger lokaler TypeScript-/Vite-Build war nicht möglich, weil `npm ci` in der isolierten Umgebung bereits auf Container-Client-Ebene vor einer vollständigen Abhängigkeitsinstallation abbrach. Nach Entfernung des unvollständigen `node_modules`-Restes bestand die vollständige ausführbare Regression erneut mit 439/439 Tests.
