# MID v0.9.80.6 – UI-/Darstellungspräzisierung

Stand: 7. September 2026

## Extern

- Im MID-Widget sind Sonnensymbol und Sonnenscheindauer innerhalb der Pille vertikal zentriert; ein fester kleiner Zwischenraum verhindert optisches Zusammenkleben.
- Die Niederschlagswahrscheinlichkeit wird im 24-h-Wetterprofil und in der Tagesansicht wieder als geglättete Linie gezeigt.
- Die fünf Bedeckungsanteile im Klimabereich bleiben farblich unterscheidbar, ohne dass dunkle Hintergründe die Beschriftung verschlucken.
- Im Klima-Jahresverlauf ist die Mitteltemperatur in der hellen Ansicht schwarz/dunkel, Tmin dunkelblau. Das Monats-Tooltip hat getrennte, kontrastierte Wertezeilen und mehr Platz.

## Intern

- `monotoneSvgPath` in `src/chartMath.ts` erzeugt eine monotone kubische Hermite-Kurve mit Fritsch-Carlson-ähnlicher Tangentenbegrenzung. Damit wird die PoP-Linie geglättet, ohne zwischen zwei Stützpunkten künstlich über deren Wertebereich hinauszuschwingen.
- Die PoP-Stützpunkte liegen weiterhin an den Mittelpunkten der kanonischen Vorwärtsslots. Die äußeren Slotgrenzen übernehmen nur den jeweiligen Randwert. Niederschlagsbalken, PoP-Punkte, Intervalltitel und Tooltips bleiben explizit an `[S,S+Δ]` gebunden.
- `MID_PRECIPITATION_INTERVAL_CONTRACT.md` und `MID_24H_PROFILE_STORY_AXIS_CONTRACT.md` dokumentieren die Trennung zwischen fachlicher Intervallsemantik und visueller Kurvenglättung.
- Die Widget-Sonnenpille überschreibt gezielt das generische Grid-Layout mit einem zentrierten Flex-Layout und `gap: 5px`.
- Die Klima-Bedeckungslegende nutzt neutrale Kartenhintergründe; die jeweilige Bedeckungsfarbe bleibt als separates Muster sichtbar.
- Klima-Tooltip: größere deckende Oberfläche, Schatten, Textkontur sowie getrennte Felder für Tmax, Mittel, Tmin und Niederschlag.
- Mitteltemperatur: Hellmodus `#111827`; Tmin: Hellmodus `#174f9e`. Im Dunkelmodus werden aus Lesbarkeitsgründen kontrastgerechte helle/dunkelblaue Gegenwerte genutzt.

## Worker

Keine funktionale Workeränderung gegenüber v0.9.80.5. Ein Cloudflare-Worker-Upload ist nicht erforderlich.
