# MID v0.9.85.236 · Ortsanzeige und verlustfreie RUC-Deduplizierung

- Die ausgewählte Ortsleiste bleibt beim Scrollen über dem Suchkopf scharf lesbar. Der überlagernde Kopf-Blur wird bei sichtbarer Ortsleiste abgeschaltet; Karten-/Einstellungsgrenzen und Dialoge bleiben erhalten.
- Bytegleiche RUC-Chunks werden nach Hash, Größe und vollständigem Bytevergleich einmal gespeichert. Der Worker unterstützt geprüfte Chunk-Aliase sowie unverändert ältere Snapshots. Missing, trockene Nullen, Zeitachsen und Datengenauigkeit bleiben bitidentisch.
- Gemessener Lauf2026-10-11T05:00:899950367 Objektbytes,20103168 Duplikatbytes. Der tatsächliche Gewinn jedes neuen Laufs fließt vor der Synoptik-Budgetierung ein und erhält damit mehr validierte Modelltermine, sofern verfügbar.1MB Reserve plus exakte Manifestprüfung schützen das unveränderte900MB-Budget.
- Gzip/Byteplane-Kompression bleibt Messkandidat bis vollständige Lauf-/Decoder-/Performance-Evidenz vorliegt. Keine zusätzlichen Felder oder Modelle werden zur Einsparung gestrichen, kein kostenpflichtiger Speicher aktiviert.

# MID v0.9.85.235

- Legende und Info dezent im gemeinsamen 24-h-Profilkopf mit unveränderten Funktionen und gut erreichbaren Touchflächen.
- Der ausgewählte Ort bleibt außerhalb von Karten und Einstellungen kompakt am oberen Rand sichtbar, einschließlich Favoritenalias.
- Der verlustfreie RUC-Speichervergleich misst zusätzlich reversible Byteplanes plus gzip. Produktionsdaten, Auflösung und Speichergrenzen bleiben unverändert.
