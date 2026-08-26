# MID 0.9.66.15

## Produktionsbuild: typisierte Extremflächen-GeoJSONs

Der Produktionsbuild aus 0.9.66.14 scheiterte an der Typableitung der neuen
Extremflächen-Geometrie. Die Runtime-Geometrie war fachlich korrekt, TypeScript
leitete die verschachtelten Objekte jedoch teilweise nur als `type: string` ab
und konnte sie deshalb nicht sicher als GeoJSON-`FeatureCollection` /
`MultiPolygon` an MapLibre übergeben.

Der Vertrag ist jetzt explizit typisiert:

- `buildExtremeOutlookContourGeoJson` liefert eine
  `FeatureCollection<MultiPolygon, ...>`.
- Polygon-, Ring- und Positionsdimensionen entsprechen explizit dem GeoJSON-
  MultiPolygon-Schema.
- `Feature` und `geometry.type: 'MultiPolygon'` bleiben Literale und können von
  MapLibre ohne unsicheren Cast übernommen werden.
- Die bereits eingeführte korrekte Verschachtelung von Außenringen, Lochringen
  und Inseln bleibt unverändert erhalten.

Damit ist der im Installer gezeigte TypeScript-Fehler
`Type 'string' is not assignable to type '"Feature"'` behoben.

## Flug-Event: Plausibilisierung sehr niedriger Wolkenuntergrenzen

Die aus groben Druckniveauprofilen diagnostizierte Wolkenuntergrenze wird vor der
Anzeige zusätzlich gegen bodennahe Begleitsignale geprüft. Eine isolierte Angabe
wie `unter 100 ft AGL` darf insbesondere bei guter Sicht ≥ 10 km nicht mehr aus
nur einem vertikalen Modellprofil entstehen.

Für sehr niedrige diagnostische Untergrenzen werden nun `cloud_cover_low`,
Sichtweite und passende Wettercodes gemeinsam herangezogen. Unter 100 ft sind
starke tiefe Bewölkung und deutlich reduzierte Sicht erforderlich. Niedrige
Untergrenzen unter 1000 ft benötigen wenigstens ein belastbares Low-Cloud-,
Sicht- oder Wettercode-Signal. Hohe, unkritische Untergrenzen werden nicht
unnötig gefiltert. Amtliche METAR-/TAF-Hazards behalten weiterhin Vorrang.

## Amtliche Wetterwarnungen: chronologische Reihenfolge

Die CAP-/amtlichen Warnkarten werden nun unabhängig von Provider- oder
Warnstufenreihenfolge chronologisch sortiert:

1. Beginn (`onset`, ersatzweise `effective`) aufsteigend,
2. bei gleichem Beginn Ablauf (`expires`) aufsteigend,
3. bei vollständigem Gleichstand bleibt die ursprüngliche Reihenfolge stabil.

Damit erscheinen z. B. Warnungen vom 26.08. vor einer Warnung vom 27.08.; am
selben Tag steht 13:00 vor 13:50. Die Warnstufe beeinflusst die zeitliche
Reihenfolge nicht.

## Regression

Zusätzlich abgesichert durch:

- `scripts/test-extreme-outlook-geodata-096614.mjs`
- `scripts/test-event-flight-ceiling-plausibility-096615.mjs`
- `scripts/test-official-warning-chronological-order-096616.mjs`

Worker fachlich unverändert; die Release-Version wird lediglich synchronisiert.
