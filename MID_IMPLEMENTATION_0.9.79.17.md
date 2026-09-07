# MID v0.9.79.17 – UI-Polish aus „Logos und Konzepte“ konsolidiert

## Ausgangslage
Die beigefügte UI-Version v0.9.79.15 aus „Logos und Konzepte“ war nicht mehr der letzte Gesamtstand. Der aktuelle MID-Stand v0.9.79.16 enthält zusätzlich die MOSMIX-S/L-Aktualitätslogik und die appweite Niederschlags-Vorwärtsintervallgeometrie. v0.9.79.17 übernimmt deshalb ausschließlich die UI-/Bedienänderungen aus dem Designzweig auf v0.9.79.16 und erhält die fachlichen Änderungen vollständig.

## Ergebnis
- Einheitliches Typografie-, Abstands- und Kartenraster in den historisch gewachsenen Einstellungsblöcken.
- Gleich große, barrierearm fokussierbare iOS-Schalter in Einstellungs- und Push-Karten.
- Mobile Einstellungsnavigation zeigt kurze Bereichsnamen statt einer reinen Symbolnavigation.
- Optionale Bottom-Leiste erhält ruhigeres Material, eindeutigen Aktivindikator und konsistente Touchziele im Hoch- und Querformat.
- Auswahlkarten und Touchflächen verwenden gemeinsame Mindesthöhen und Fokuszustände.
- `prefers-reduced-motion` deaktiviert die neu eingeführten Übergänge.

## Bewusst nicht umgesetzt / Mitigation
- Keine Bottom-Leiste auf großen Displays: dort bleibt die vorhandene Sektionsnavigation ergonomischer.
- Kein erzwungener Wechsel für Bestandsnutzer: der persistente Modus „Klassisch“ bleibt vollständig funktionsfähig.
- Keine Veränderung meteorologischer Karten-, Radar- oder Parameterfarben durch dieses UI-Polish.
- Keine künstlich identischen Kartenhöhen auf schmalen Displays; Text darf natürlich umbrechen.

## Erhaltene v0.9.79.16-Fachlogik
- MOSMIX-S/L-Laufmetadaten und Frischebewertung.
- Niederschlags- und Skybar-Vorwärtsintervallgeometrie, einschließlich 19:00–20:00-Darstellung.
- Alle zugehörigen Pflichtregressionen und Workeränderungen bleiben erhalten.

## Absicherung
`scripts/test-settings-navigation-polish-097917.mjs` schützt Raster, Switch-Geometrie, sichtbare mobile Bereichsnamen, Fokus, Reduced Motion, Persistenz und klassischen Fallback.
