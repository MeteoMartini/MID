# MID Design-WE 1.1–1.3 – Originalbild-Inventar und Provenienz

**Dokumentationsstand:** 05.11.2026 · **Basis nur zur Archivprüfung:** veröffentlichte v0.9.85.431, `main=mid-stable` `77de0e326d586274d5f42f0ea63827a887d1b147`. Vor neuer Implementierung die aktuellen Refs erneut prüfen.

**Architekturhinweis:** Der bestehende kanonische Repo-Pfad ist `docs/design/`, **nicht** `.docs/Design/`. Die historischen MID-Design-WE-Bilder wurden am 05.11.2026 in der MID-Dateibibliothek **als Pixelvorschau geöffnet und gegen ihre ursprünglichen Dateinamen abgeglichen**. Ihre unveränderten Originalbytes konnten in der derzeitigen Umgebung **nicht** nach GitHub materialisiert werden. **Es gibt in diesem Archive-PR keine neuen PNGs und keine behaupteten Datei-SHA256.** Keine Bildattrappe, kein unkontrollierter Download, keine Kopie persönlicher Dateibibliotheks-IDs in das öffentliche Repository. Die originalen PNGs sind noch als separate, SHA256-zu-verifizierende Binäranlage zu importieren. Die Einträge hier sind zunächst ein sicheres Auffindeverzeichnis, **kein vollständiges Bilderarchiv**.

## Sichtgeprüfte Original-Designgrafiken, 02.11.2026

Die Namen sind die tatsächlichen Dateinamen der damals erzeugten MID-Bibliotheksobjekte. Klammern in Namen dienen der Unterscheidung von Generationen/Kopien; keine Dateien wurden stillschweigend umbenannt oder verändert.

| Kontext | Originaldatei (bibliotheksseitig) | Größenhinweis | Belegter Inhalt / Zuordnung |
|---|---|---:|---|
| WE 1.1 · Heute A | `MID_Design-WE_Heute_A.png` | 241.507 B | Hell, 90-Minuten oben, 24h-Wetterprofil mit Wetter-/Wolkenzeilen und Detailkarte |
| WE 1.1 · Heute B | `MID_Design-WE_Heute_B.png` | 310.895 B | Dunkel, ruhiger Zeitachsen- und 24h-Profilfokus, 90-Minuten-Band darunter |
| WE 1.1 · Heute C | `MID_Design-WE_Heute_C.png` | 245.010 B | Hell, Parameterauswahl/Analyse, ausgewählte Stunde und 15-Minuten-Band |
| WE 1.1 · Vergleich | `MID_Design-WE_Heute_Vergleich.png` | 1.247.030 B | Nebeneinander A „Tagesfluss“, B „Timeline“, C „Analyse“ |
| WE 1.1 · kombinierte Richtung | `Premium-Wetterapp für Köln.png` | 1.608.199 B | Dunkles kombiniertes Heute-Beispiel: Wetter, 90min, 24h-Wetter-/Wolkenzeilen vor Temperatur, Daten und Stunden; **keine echte Vorhersage** |
| WE 1.1 · 14 Tage Gesamtbild | `MID Wetter‑App: 14‑Tage‑Redesign.png` | 1.983.619 B | Gemeinsam: Temp./Regen/Wind-Steuerung, einklappbare 90min und drei illustrative 14d-Varianten mit Ensemble/Diagrammen/Tagesmatrix |
| WE 1.1/1.2 · 7d kompakt | `image-gen-1(20261102-215747).png` | 1.905.205 B | Sieben sehr kompakte Tagesreihen mit Wettercode-Icon, Min/Max, Niederschlagsmenge/PoP, Wind/Böen |
| WE 1.1/1.2 · 7d Parameterdiagramme | `image-gen-2(20261102-215750).png` | 1.949.727 B | Fünf vertikal gestapelte Diagramme: Temperatur-/Spanne, Menge, PoP, Wind/Böen, Sonnenschein |
| WE 1.1/1.2 · 7d Tagesmatrix | `image-gen-3(5).png` | 2.000.351 B | Echte kompakte Tageszeilen, vier Tagesabschnitte und aufklappbare Details |
| WE 1.2 · 7d originale Skybar | `image-gen-1(20261102-220554).png` | 2.084.168 B | Durchgehende bestehende 7d-Wettergrafik/Skybar **oberhalb** der Tageszeilen |
| WE 1.2 · 7d Diagramme mit Skybar-Erhalt | `image-gen-2(20261102-220557).png` | 2.145.147 B | Skybar und kompakte Tage erhalten; fünf getrennte Parameterdiagramme folgen |
| WE 1.2 · weitere Tagesmatrix | `image-gen-3(6).png` | 2.049.791 B | Zusätzlicher 7d-Tabellenentwurf; keine Byteidentität zur vorherigen Version behauptet |

**Wichtige Originalkopien:** `MID_Design-WE_Heute_A(1).png`, `B(1).png`, `C(1).png` sowie `A(2).png`, `B(2).png`, `C(2).png` liegen in der Bibliothek mit gleichen Dateigrößen der jeweiligen A/B/C-Datei. **Gleiche Größe ist kein SHA-/Byteidentitätsnachweis**; vor Entscheidung über Dubletten tatsächliche SHA256 prüfen.

**WE 1.3:** Die eigenständige frühere Gegenüberstellung `ORIGINALBILDER_SOLL_IST.md` und `MID-Design-WE-1.3-v0.9.85.416-Bildabgleich-Handoff.zip` sind als Bibliotheksartefakte vom 03.11.2026 belegt. Die Datei `ORIGINALBILDER_SOLL_IST.md` wurde als Text gelesen; ihre konkreten Bildzuordnungen sind hier berücksichtigt. Das Handoff-ZIP konnte nicht als Originalbytes materialisiert werden; `.416` war ein historischer Arbeitsstand und ist **keine aktuelle Stable-Basis**.

## Verbindliche Unterscheidung

- Die oben genannten Bilder sind **Designvorschauen mit illustrativen Wetterwerten**, keine gemessenen MID-Produktionsscreenshots, amtlichen Daten, DWD-Originale oder aktuelle Modellprognosen.
- `A/B/C` bezeichnet historische Entwurfskennungen. Die reale sichtbare UI soll semantische Namen wie **„Übersicht“, „Diagramme“, „Tabelle“** tragen, nicht die Entwurfsbuchstaben.
- Nutzungsentscheidung ist die textlich dokumentierte Kombination/Anpassung, nicht jedes Pixel eines nicht gewählten Konzepts. Insbesondere die grafische Bandreihenfolge in der kombinierten Heute-Referenz hat Vorrang vor dem früheren separaten B-Entwurf.
- `docs/design/MID_DESIGN_WE_TODAY_CANDIDATE.md` und `docs/design/MID_DESIGN_WE_415_VISIBILITY_QA.md` sind die bereits in Stable vorhandenen historischen technischen Design-WE-Übergaben. Die aktuell aktive App und verbindliche Verträge dürfen nicht auf den Stand ihrer älteren Versionsnummern zurückgesetzt werden.

## Geplanter Byte-Import – bewusst noch nicht erledigt

Nach berechtigter Bereitstellung der **unveränderten** Original-PNGs in einem aktuellen Gesprächsanhang oder einem verifizierten autorisierten Arbeitscontainer:
1. Ursprungsdateien unverändert extrahieren, PNG-Signatur/Abmessung/Bytes/individuelles SHA256 prüfen, Originalname und Herkunft dokumentieren.
2. Kopien strukturiert unter `docs/design/references/we-1-1/` (Heute und 14d-Konzept) sowie `docs/design/references/we-1-2/` (7d-Ergänzungen) aufnehmen. Varianten separat erhalten; nur nach SHA-identischem Vergleich Dubletten zusammenfassen.
3. Das Manifest mit echten Git-Blob-SHAs und SHA256 vervollständigen; relative Links zu jeder tatsächlich vorhandenen PNG setzen. Keine 404-Medienlinks vor der vollständigen Ablage.
4. Optimierung/Neukompression der **Originale** ist nicht Teil der Archivierung. Ein späteres abgeleitetes Webformat wäre separat als Derivat zu kennzeichnen.
5. Alle Änderungen ausschließlich in autorisiertem `chatgpt/*`- oder `codex/*`-Integrationspfad, normaler MID-SHA-/Source-/Installer-/Stable-Kette; niemals direkt `main`/`mid-stable` schreiben. Bis zum echten PNG-Import **DRAFT**, kein Bildarchiv- oder Releaseabschluss.

**Abnahme für Kilo:** Die App soll diese Referenzen nach Import nur visuell interpretieren. Kein frei erfundener Wetterwert, kein Pixelkopieren von Bildgen-Grafiken in Meteorologielogik; keine automatischen Änderungen an Modellen, Warnungen, Worker, CI, iOS oder Releases.
