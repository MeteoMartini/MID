# MID 0.9.84.56

## Komposit-Synoptik
Der bisherige Kompositpfad war unvollständig: DWD-Isobaren kamen unmittelbar als WMS, 500-hPa-Isohypsen und Druckzentren ausschließlich aus einem separaten 17×25-Raster, objektive Fronten überhaupt nicht. Auf Mobilgeräten konnte der Rasterabruf den bisherigen 15-s-Clienttimeout überschreiten. Dann blieben Isohypsen, Geopotentialwerte und H/T-Zentren gleichzeitig aus, während die Isobaren weiterhin sichtbar waren.

Ab 0.9.84.56 wird die Darstellung gestuft aufgebaut:
1. DWD-Isobaren nativ.
2. DWD-500-hPa-Isohypsen nativ als unmittelbarer, wissenschaftlich konsistenter Fallback.
3. Sobald das MID-Raster vorliegt, ersetzen geglättete 500-hPa-Konturen den nativen Isohypsenfallback und H/T-Zentren werden ergänzt.
4. Die vorhandene objektive Frontdiagnostik wird im selben Synoptikmodus gerendert. Kalt-/Warmfront und Okklusion erhalten meteorologische Frontsymbole; Trog- und Konvergenzachsen bleiben differenziert gestrichelt.

Das großräumige Raster bleibt fachlich unverändert 17×25 über Europa. Lediglich die begrenzte Worker-Parallelität wird von vier auf sechs Zeilen erhöht; der Client erlaubt für diesen schweren Pfad 45 s und nutzt einen separaten Cache/Stale-Fallback.
