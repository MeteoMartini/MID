# MID v0.9.14.1 – Nachtpiktogramme, Folge-Nachtlogik und 3h-Niederschlagssummen

## Umgesetzt

1. **3h-/1h-Umschalter im Cockpit**
   - 3-Stunden-Punkte werden nicht mehr nur ausgedünnt, sondern blockweise aggregiert.
   - Niederschlagsmengen werden über drei Stunden aufsummiert.
   - Wahrscheinlichkeiten, Böen und repräsentative Wettercodes werden je Block konsolidiert.

2. **Folgende Nacht statt vergangene Nacht**
   - Für Tageskarten, Quickfacts, Widgets und 7-Tage-Cockpit wird das Nachtpiktogramm jetzt aus der Nacht *nach* dem jeweiligen Tag gebildet.
   - Frühstunden des gleichen Tages fließen nicht mehr in das Nachticon desselben Tages ein.

3. **Nachtpiktogramme vereinheitlicht**
   - Transparenter, appweit konsistenter Stil.
   - Deutlich kleiner als die Tagesicons, aber kontrastreicher sichtbar.
   - Cockpit-, Widget- und klassische Tagesansichten nutzen dieselbe Darstellungslogik.

4. **Klassische Desktop-Tagesansicht**
   - Die Stundenliste klappt jetzt auch am Desktop direkt unter dem jeweiligen Tag auf.
   - Dadurch werden parallele, faktisch doppelte Ansichten reduziert.

5. **Bewölkung / Wolkenstockwerke**
   - Hohe Bewölkung kontrastreicher gezeichnet.
   - Klare Nacht- bzw. Mondsymbole visuell robuster, damit die Unterscheidung zu Schicht-/Hochbewölkung deutlicher ausfällt.

## Betroffene Dateien
- `src/App.tsx`
- `src/ForecastCockpit.tsx`
- `src/WeatherPictogram.tsx`
- `src/styles.css`
- Versions-/Metadateien via `sync-version.mjs`

## Hinweis zur Verifikation
- Ein vollständiger lokaler TypeScript-/Vite-Build konnte in dieser Arbeitsumgebung nicht abgeschlossen werden, weil die Projektabhängigkeiten (`react`, `lucide-react` etc.) lokal nicht installiert sind.
- Die Releaseversion und alle abgeleiteten Versionsdateien wurden jedoch auf `0.9.14.1` synchronisiert.
