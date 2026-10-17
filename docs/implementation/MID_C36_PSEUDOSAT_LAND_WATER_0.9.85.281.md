# MID C36 – Schematischer Wolkenbild-Untergrund: Land/Wasser (v0.9.85.281-Kandidat)

## Verifizierte Basis und Branch

Freigegebene Ausgangsbasis bei Beginn: MID v0.9.85.279, `main = mid-stable = afceb2d0b770a7f7c337cc1b9e69359dcfee19d6`. Neuer, gesonderter Source-Branch `chatgpt/v0.9.85.281-pseudosat-land-water`, **noch nicht veröffentlicht und ohne Source-PR**. PR #393 (.280: Push-Zeiten/Synoptik-Isobaren) ist eine parallele, vor Veröffentlichung zuerst vollständig zu promotende Vorstufe. Issue #392 mit Screenshot IMG_2319.jpeg.

## Nutzerproblem und Datenabgrenzung

Das bisherige Pseudo-Satelliten-Wolkenbild verwendet in Light zwei nahe Graublau-Töne und vermischt optisch Land sowie Gewässer. Die neue Untergrundfarbe ist eine rein gestalterische, kartenbezogene Kontrasterhöhung; Wolkenanteil/Alpha/WMO-4677-Wettercodes, Farblegende, physikalische Werte, Missing-Daten, Niederschlagsphase und amtliche Beobachtungs-/Warnprodukte dürfen sich nicht ändern. Modell-Wolkenbild bleibt **schematisch**, niemals Messsatellitenbild oder hypothetische Radiometrie.

## Technische Umsetzung

- Gemeinsame, kleine reine Palette in `src/pseudoSatelliteBasemap.ts`; Light-Pseudo-Land sandgrau, Wasser blaugrau, Landcover dezenter. Kein abweichendes Sonderwissen nach Ortsnamen oder Land. Standard- und Dark-Kartenhintergründe bleiben erhalten.
- `src/UnifiedVectorBasemap.tsx`: Basiskarten-Background ist Land; geografische Meere/Seen stammen aus `sourceLayer:'water'` der vorhandenen OpenFreeMap-Vektorkarten. `landcover` wird nicht fälschlich als vollständige Landmaske benutzt. Dynamisches Gating nur, wenn das Pseudo-Modellbild tatsächlich aktiv ist. Zuschaltbare Layer-Tiefe bewahrt das Wetterraster.
- `src/NativeModelMap.tsx`: ICON-D2-Pseudo-Darstellung nutzt denselben Vector-Basemap-Code und dessen Dark-Erkennung; der Vektoruntergrund wird ausdrücklich mit `zIndex=-10` **unter** dem Wetterraster auf `zIndex=0` gezeichnet. Bei Standardkarten bleibt der bisherige Raster-Basemap-Pfad unverändert.
- `src/cloudWeatherExport.ts`: SVG und daraus abgeleitetes PNG legen bei Pseudo-Modus den gemeinsamen Wasser-Farbton als Untergrund und echte Natural-Earth-5.1-Landpolygone als Landmaske **unter** das rasterisierte Wolken-/Wetterbild. Vorhandene Bundesländer-/Konturen-/Ortsmarker bleiben darüber; Offscreen-Landringe werden begrenzt. Die zugrundeliegenden Modellausgangsdaten sind identisch. Export übernimmt keine nativen Satellitenpixel und erfindet keine Zwischenbilder.

## Fachliche Grenzen / Risiken

- OpenFreeMap-Wasserpolygon-Deckung im interaktiven Renderer und Natural-Earth-Landmasken im Export stammen aus getrennten amtlich bzw. Public-Domain-getriebenen Kartengrundlagen. Größere Land-/Seebereiche lassen sich konsistent einfärben; nicht alle Binnengewässer können in SVG identisch zu Vektorkacheln abgebildet werden. Geografische Konformität an Küsten, Seen/Flüssen und Rasterrändern gesondert visuell prüfen. Ein nicht geladener Vektorkatalog darf nicht als meteorologische Datenlücke bzw. Wolkenfreiheit dargestellt werden.
- Light/Dark/Auto, Wechsel Beobachtung ↔ bestätigter Modelltermin, kleinere/große Smartphones, Tablet hoch/quer und Desktop: Textlabels, Layerorder, Transparenz, Auswahlpersistenz und 44px-Touchziele visuell prüfen. Reine Playwright-/CI-Abnahme ist kein iOS/WKWebView-/VoiceOver-Gerätetest.
- `scripts/test-pseudo-satellite-basemap-0985281.mjs` prüft statisch gemeinsam genutzte Palette, Vektorwasser, native Layerfolge und falsche Kartenumfärbung sowie funktional einen beispielhaften Natural-Earth-Export. Weitere komplette Source-/Heavy-/Installer-/Worker-/Pages-Gates sind zwingend.

## Release-Gate

Vor PR: nach erfolgreicher .280-Stable-Promotion Main/Stable-SHAs, offene PRs und Release-Verträge erneut lesen. Aktuelle .280-Quellen **ohne Reset/Force-Push** nach SHA-gesicherter WIP-Arbeit integrieren; v0.9.85.281 mit allen Spiegeln und Nutzer-Changelog bauen. Danach einzig Source-PR-Gate → kontrollierter Bot-Merge → serverseitiges ZIP → `install-mid.yml` → betroffene Worker-/Pages-Gates → Stable-Promotion. Bis dahin kein grüner Produktionsstatus für .281.
