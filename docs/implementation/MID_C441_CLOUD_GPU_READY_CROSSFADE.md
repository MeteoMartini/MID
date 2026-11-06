# MID v0.9.85.441 – Pixelbereite Crossfades statt leere Wolkenkarten

## Verifizierte Ausgangslage

`main` = `mid-stable` = `8292806f7c53ccc6117d72a9592c8033189dfd4f` (v0.9.85.440), GitHub-Revisionslauf `42230802636` erfolgreich. Fünf bestehende Rulesets aktiv. Die Arbeiten aus .437/.439 für Frame-Retention und 350-ms-Übergänge werden **weiterverwendet**, nicht ersetzt. Kein konkurrierender offener Wolken-Renderer-PR bei Beginn.

## Ursache

`src/MapLibreCore.tsx` / `ImageQuadLayer` hatte bei einem fertig geladenen HTML-Image sofort `ImageSource.updateImage`, `addLayer` und die Fade-Animation gestartet. Der erste MapLibre-Render-/Texturupload ist jedoch nicht identisch mit `HTMLImageElement.onload`. Somit konnte die alte Bildtextur schon ausblenden, bevor die neue vom Renderer angezeigt wurde. Bei der allerersten Darstellung war eine noch nicht gerenderte Bildquelle möglicherweise schon voll deckend; es entstand ein leerer heller Zwischenstand.

## Umsetzung

- Neues Modellbild wird weiterhin unverändert mit geprüfter Modell-/Run-/Zeit-/Hash-Provenienz aus der bestehenden `CloudSignificantWeather`-Logik geladen.
- Der nächste `ImageQuadLayer`-Source wird **zunächst nur mit 0,1 % Deckkraft** in MapLibre angelegt. Der alte, vollständig dargestellte Frame behält seine reale Deckkraft.
- Erst ein tatsächlicher `render`-Event **nach** MapLibre-Source-Readiness (`isSourceLoaded`) hebt die neue Quelle auf den sichtbaren Layer; dann 350-ms-Opacity-Crossfade. Der Basiskartenhintergrund bleibt statt eines undekodierten weißen Bildes sichtbar, wenn noch gar kein älterer Frame existiert.
- Bei Netz-/Quellenfehler oder Timeout bleibt der vorherige Frame erhalten und die UI zeigt den bestehenden Datenfehlerpfad. Ein veralteter, noch nicht dargestellter Source wird ohne Anfassen des sichtbaren Frames gelöscht.
- Bei rascher Mehrfachauswahl warten bereits geladene Bilder, bis eine zuvor begonnene Fade-Animation abgeschlossen ist; keine dritte konkurrierende Bildtextur wird aufgestapelt.
- Bei `prefers-reduced-motion` erfolgt der tatsächliche Bildwechsel sofort **nach** der Renderbereitschaft, nicht vor ihr. Alle Listener/Timer/Quellen werden bei Fehler, Wechsel und Unmount abgeräumt.
- Kartenmodell-/Zeitidentität, transparente NoData-Pixel, Farbcodierung, Geo-Referenzen und meteorologische Quellen bleiben unangetastet. Keine künstlich interpolierten Zwischenprognosen und kein Ausgeben der vorherigen Bildzeit als neue Modellzeit.

## Technische Quellen

- MapLibre ImageSource: https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/
- MapLibre Bildreihenfolge und Source-Render-Zyklus: https://github.com/maplibre/maplibre-gl-js/blob/main/developer-guides/life-of-a-tile.md
- MapLibre Raster-Layer-Spezifikation: https://maplibre.org/maplibre-style-spec/layers/
- `raster-fade-duration` steuert nicht den Source-zu-Source-Übergang zweier eigener ImageQuad-Frames; deshalb unverändert 0, die definierte 350-ms-Transition bleibt explizit in MID.

## Abnahmekriterien

1. **Erstladung:** Kein deckend leerer ImageQuad-Layer; Basiskarte/neutraler Kartenhintergrund bleibt sichtbar bis die neue Modellgrafik GPU-renderbereit ist.
2. **Unbekannter nächster Zeitschritt:** Letzter vollständiger Frame bleibt konstant, auch wenn Netzwerk schon geliefert hat, die Bildtextur aber noch nicht im Renderer bereitsteht. Erst dann weicher 350-ms-Wechsel.
3. **Fehler, schneller Tipp, Unmount, Reduced Motion:** kein weißer Zwischenframe, keine alte Bildantwort nach neuer Auswahl, keine Quellen-/Listener-/Timer-Lecks.
4. **Vergleich von Run-/Modell-/Gültigkeitszeit:** nur die belegten geladenen Wetterfelder; keine meteorologische Interpolation oder gefälschte Zeit.
5. **Vollständiger SHA-gebundener Prüfpfad:** bestehende dynamische Map-Regressionsharness, 1082 vollständige Baseline-Prüfungen, reale MapLibre Chromium/WebKit/Browsermatrix, Light/Dark und kleine/große Touch-Bildschirme, regulärer Releasepfad und Stable-Promotion.

**Status dieses Dokuments:** Implementationsnachweis, **kein** behaupteter grüner Browser-/Release-Nachweis vor tatsächlichen GitHub-Gates. Physische iOS-/VoiceOver-Abnahme bleibt separat.

## Source-Gate-Reparatur

Der erste vollständige Source-Lauf `42238404167` auf `dd0bbbc517e4c15c17f75bd6b7eb7e3c87d1f625` scheiterte reproduzierbar an TypeScript TS18047 in `CloudSignificantWeather.tsx`: optionaler Vergleich konnte bei zwei undefinierten Läufen wahr sein und bewies keinen vorhandenen GDPS-Anzeigestand. Explizite Existenzprüfung vor Zugriff erhält den bisherigen gültigen Lauf; ohne angezeigten Frame bleibt er undefiniert. Kein Non-null-Cast, keine geänderten Gates oder Tests. Vollständige Source-Prüfung auf dem korrigierten Head erneut erforderlich.
