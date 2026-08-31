# MID v0.9.76.32 – Regression-Sicherung Reiseplaner und Kompositgrenzen

## Ziel
Die mit v0.9.76.31 korrigierten UI-Verträge werden als eigener Release-Gate-Test abgesichert.

## Geschützte Verträge
- Der Reiseplaner startet mit dem aktuell ausgewählten MID-Ort und nicht mit einem früher lokal gespeicherten Reiseziel.
- Solange kein eigenes Reiseziel gewählt wurde, folgt der Reiseplaner dem aktuellen MID-Ort.
- Der Button „Aktueller MID-Ort“ stellt diesen Zustand explizit wieder her.
- Der obere Komposit-Referenzlayer zeigt weiterhin Städte und Grenzen.
- Grenzen ohne `maritime`-Attribut sowie numerisch oder als String codierte `admin_level`-/`maritime`-Werte werden robust berücksichtigt.
- Ein allgemeiner Boundary-Fallback verhindert, dass bei Schema-/Attributabweichungen nur Ortsnamen sichtbar bleiben.

## Neue Regression
`scripts/test-travel-current-composite-boundaries-097632.mjs`

## Worker
Keine fachliche Worker-Änderung. Für v0.9.76.32 ist kein neuer manueller Worker-Upload erforderlich.
