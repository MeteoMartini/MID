# MID v0.9.84.99 – Implementierungsbericht

## Ausgangsbasis

Die Änderungen basieren auf dem zuletzt erfolgreich veröffentlichten MID-Stand **v0.9.84.98**. Der kanonische Branch `mid-stable` steht auf Commit `e90ac3e0210ddda50249b92787a1ab050bc2e1a2` (`Install MID v0.9.84.98`). Der zugehörige Installer **#1053** lief erfolgreich; der DWD-RUC-Preprocessing-Lauf **#544** war ebenfalls erfolgreich. Damit wurde nicht auf einen älteren Chat-/Archivstand zurückgefallen.

## 1. Radar-Niederschlagsart: missverständliche „Schnecken“-Symbole

Die im Screenshot sichtbaren spiraligen Zeichen stammten aus dem Piktogramm für die Phase `freezing` im Radar+Modell-Niederschlagsartenlayer. Die Symbolform war visuell missverständlich. Zusätzlich konnte die Phasenklassifikation bei unsicherer thermischer Unterstützung zu großzügig eine gefrierende/feste Phase annehmen.

Korrekturen:
- `freezing` verwendet jetzt ein eindeutiges **Regen+Eis-/Kristall-Piktogramm** statt der Spiralform.
- Gefrierende Phase benötigt eine konsistente Kaltluftstützung aus 2-m-Temperatur bzw. Feuchtkugeltemperatur.
- Warme False Positives werden bei zu hoher 2-m-/Feuchtkugeltemperatur verworfen.
- Die Mindestreflektivität für ein freezing-Symbol wurde erhöht; auch Schnee/Mischphase erhalten zusätzliche Warmphasen-Guards.
- RUC-Snow/Rain wird bei thermisch widersprüchlicher Lage konservativer als Misch-/Flüssigphase behandelt.

## 2. Synoptik: 500-hPa-Isohypsen

Der Screenshot zeigte den Kernfehler: Das native WMS-Höhenfeld lieferte optisch stufige/gezackte Konturen und entsprach weder der gewünschten Linienart noch dem MID-Farbvertrag. Ein zusätzliches Fallback konnte den Eindruck durch Überlagerungen verschärfen.

Korrekturen:
- **DWD-WMS bleibt für Isobaren**, weil dieser Pfad visuell robust funktioniert.
- **500-hPa-Isohypsen werden nicht mehr als sichtbarer nativer WMS-Layer gezeichnet.**
- Die Isohypsen werden aus dem vorhandenen Grid-/Vektorrahmen über das kontrollierte MID-Rendering gezeichnet.
- Für Isohypsen wurde die Glättung verstärkt: drei Binomial-Pässe und drei Chaikin-Pässe, bei längeren Konturen ein zusätzlicher Pass.
- Darstellung: gold/amber, gestrichelt, runde Linienenden/-ecken, separate permanente `gpdm`-Labels.
- Der frühere doppelte sichtbare Isohypsenpfad ist entfernt.

## 3. Synoptik: Fronten und Frontalzonen

Die auffälligen parallelen violetten Strichfelder waren keine meteorologisch fertige Frontenanalyse, sondern rohe θe-850-Frontalzonen sowie parallel aktive Fallback-/Vektorpfade. Das war für die Enddarstellung zu ungefiltert.

Korrekturen:
- Nur Frontalzonen mit ausreichender Qualität (`score >= 58`) werden dargestellt; maximal zwei dominante Zonen.
- Frontalzonen werden vor der Darstellung geglättet.
- Eine klassische Kalt-/Warm-/Okklusions-/Trog-/Konvergenz-Typisierung wird nur übernommen, wenn der synoptische Kandidat stark genug und nicht `low` confidence ist.
- Typisierte Fronten erhalten ihre fachlich passende Farbe/Symbolik; untypisierte θe-Frontalzonen bleiben dezent und gestrichelt.
- Der redundante Canvas-Fallback plus zusätzliche Roh-Polyline-Darstellung ist aus dem aktiven Renderpfad entfernt.

## 4. Desktop-Wetterpiktogramme

Die im Desktop-Screenshot sichtbaren senkrechten Striche stammten aus den Umrandungen der internen `SkyPlate`-SVG-Fläche, die bei kleinen Perioden-/Tagespiktogrammen optisch wie Fremdlinien neben dem Wetterzeichen wirkten.

Korrektur:
- In den Desktop-Tages-/Periodenansichten wird die `SkyPlate`-Rect-Umrandung gezielt unterdrückt.
- Das eigentliche Wetterpiktogramm, Tages-/Nachtlogik und die mobilen Darstellungen bleiben unverändert.

## Geänderte Kernbereiche

- `src/RadarPanel.tsx`
- `src/RadarModelPrecipTypeOverlay.tsx`
- `src/precipitationTypeSymbols.ts`
- `src/styles-src/20-ensemble-composite.css`
- `src/styles.css` (Maintenance-Aggregat)
- mehrere betroffene Synoptik-/Komposit-Regressionstests
- neuer Test `scripts/test-synoptic-phase-pictogram-cleanup-098499.mjs`
- Versions-/Release-Metadaten auf `0.9.84.99`

## Worker

Es wurde keine fachliche Worker-Logik verändert. Die Workerdateien werden nur durch den regulären Versionssync auf v0.9.84.99 gebracht; ein separater manueller Worker-Upload ist für diese Korrektur nicht erforderlich.
