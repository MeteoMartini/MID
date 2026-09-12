# MID v0.9.84.74 – Implementierungsnachweis

## Ausgangsbasis

Der letzte erfolgreich promotete kanonische GitHub-Stand war beim Beginn dieses Blocks v0.9.84.71 auf `mid-stable`. Der danach auf `main` hochgeladene v0.9.84.72-Kandidat scheiterte ausschließlich am TypeScript-Check wegen zweier ungenutzter Imports. Der lokal bereits erzeugte v0.9.84.73-Fortsetzungsstand enthält diesen Buildfix und die nachfolgenden UI-Audits. v0.9.84.74 setzt genau auf dieser korrigierten Fortsetzung auf; vor der finalen ZIP-Erstellung wird GitHub erneut abgeglichen.

## Änderungen

### `src/ForecastCockpit.tsx`

- zusätzlicher flüchtiger Overlayzustand `profileOverlayId` getrennt von der dauerhaften Zeitselektion;
- automatisches Schließen des Touch-Overlays nach 4,8 s;
- Hover-/Pointer-Leave-Verhalten nur für Fine Pointer;
- Fokus/Blur für Tastaturbedienung;
- Escape-/Outside-Dismissal über die zentrale MID-Primitive `useDismissibleLayer`;
- `selected-time-values` werden nur für den flüchtigen Overlaypunkt gerendert;
- die dauerhafte Zeitlinie und „Einzeldaten“ bleiben unverändert verfügbar.

### `src/styles-src/30-modern.css`

- Event-Center-Sortierfeld mobil vollbreit;
- Eventtitel, Ort, Wetterkurzinfo und Workspace-Navigation ohne Ellipse;
- sinnvoller mehrzeiliger Umbruch statt abgeschnittener Inhalte;
- Ensemble-Tooltip mit viewportbasierter Breite, Safe-Area-/Landscape-Höhenbegrenzung und internem Scrollen;
- Mobile Einzelwertzeilen im Tooltip stapeln Schlüssel und Wert;
- Tooltipflächen sind deckend (`var(--surface)`), damit dahinterliegende Diagramm-/Kartentexte nicht durchscheinen;
- hochspezifische Legacy-Overrides für `nowrap`, kleine Schrift und `justify-self:end` werden gezielt neutralisiert;
- Fokusmarkierung und Reduced-Motion-Vertrag bleiben erhalten.

### Regressionen

- neuer Pflichtvertrag `scripts/test-responsive-layout-tooltip-098474.mjs`;
- historische Interaktionstests an die weiterhin ein-Klick-fähige, nun aber flüchtige Profil-Overlaysteuerung angepasst;
- zwei alte Ensemble-Tooltip-Verträge auf ihren ursprünglichen Releaseblock begrenzt, damit spätere Wartungsverbesserungen nicht fälschlich als Regression gelten;
- v0.9.84.73-Test versionsresilient gemacht, ohne dessen fachliche Assertions abzuschwächen;
- die zehn im GitHub-Lauf von v0.9.84.73 fehlgeschlagenen historischen Verträge (AQI, Astronomie/Finsternisse, Luftdruck, Wind, Ensemble-Mobile-Tooltip, Wolkenquelle, Standarddesign, Sonne/Mond) wurden an die bereits gewünschte kompakte `(i)`-Informationsarchitektur angepasst und bestehen lokal wieder;
- UI-Architekturvertrag und Wolkenschicht-Verfügbarkeitsvertrag wurden nach dem neuen flüchtigen Overlaypfad erneut hergestellt.

## Aggregat/Versionierung

`src/styles.css` wurde nach den Änderungen erneut aus den fünf kanonischen Style-Modulen erzeugt. Version, Cache-, iOS- und Worker-Metadaten sind auf 0.9.84.74 synchronisiert. Die Worker-Fachlogik ist unverändert.
