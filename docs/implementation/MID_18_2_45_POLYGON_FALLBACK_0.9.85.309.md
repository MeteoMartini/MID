# MID 18.2.45 · Extremwetterpolygone nicht sichtbar · Kandidat 0.9.85.309

## Herkunft und Scope
Start vom SHA-verifizierten main=mid-stable b57f07081a2b92ae763af9c909aa3f65b9e211ac (v0.9.85.307 nach erfolgreicher Source-/Pages-/Worker-Promotion am 21.10.2026); PR #440 (.308) und ECMWF-Draft #433 bleiben unberührt. Issue #441 ist der Fehlermeldungsanker. Schreibzugriffe auf den veralteten Replit-Workspace (v0.9.85.300; Admin-Scope nicht auf replit/* beschränkt) unterblieben.

## Beobachtung, keine ungeprüfte Ursachengewissheit
Nutzer sieht modellierte I-Stufen-/Prozent-HTML-Marker ohne die farbigen Polygone. Aus src/extremeOutlookModelledAreas.ts entstehen Marker ausschließlich aus Konturen. Ihre Existenz belegt modellierte Konturdaten, nicht den erfolgreichen asynchronen WebGL-/GeoJSON-Paint. Die bisherige Installation in ExtremeOutlookAreaOverlay.tsx verschluckte alle synchronen Exceptions; Fehler der Workerquellen waren nicht an die UI gebunden. Ob konkret Worker-/Paint-/Coverage-/Layerreihenfolge verantwortlich ist, bedarf Live-Browserbefund.

## Enger Fix und meteorologische Integrität
- Die native MapLibre-Fill-/Hatch-/Outline-Ebene bleibt Standard. Nach Eventidle bzw. 3,5s-Überwachung prüft der Code vorhandene Quelle, isSourceLoaded und sichtbare GeoJSON-Features, sofern modellierte Marker im Viewport liegen.
- Bei fehlender/ungeladener/geometrisch leerer Quelle oder echtem GeoJSON-Workerfehler erscheinen **dieselben** modellierten Konturen im vorhandenen georeferenzierten Canvas-Renderer; die UI benennt die degradierte Kartenebene ausdrücklich. Der Fallback kann bei Quellerholung wieder deaktiviert werden. Eine native Quelle ohne Sichtbarkeit außerhalb des Viewports darf nicht fälschlich als fehlend zählen.
- Fehlende Daten, Wahrscheinlichkeit, I1–I4-Schwellen, Fenster, Ensemblemitglieder, Masken, Extreme, offizielle Warnungen und Datenprovenienz bleiben unberührt. Keine synthetischen Polygone, Fremdmodellwerte oder Null-Füllwerte.
- Unterschied: Ein DOM-Canvas liegt im Notfall vor Raster-Stadtnamen; dieses bewusst degradierte Lesbarkeitsrisiko ist visuell zu bewerten. Touch-Interaktion bleibt durch pointer-events:none erhalten.

## Präzise Abnahme vor Release
1. Auf einem frischen Browserbuild mit echten Mitteleuropa-Daten und wenigstens einem im Viewport enthaltenen Modellkontur-Polygon: Fill-Pixel, vollständige Layer/Quellen, GeoJSON-MultiPolygon, Inseln/Löcher/Schraffur, Labels, Rasterkontext und Tooltip verifizieren; Light/Dark, 320/390/430/834/1024/1440px, Tablet hoch/quer.
2. Browserdefekt durch gezielte Unterbindung des GeoJSON-Workers oder per kontrollierter Style-/Source-Fehlerinjektion: Notfall-Canvas und sichtbarer Hinweis, keine alleinstehenden Marker, kein leerer/schwarzer Kartenhintergrund. Nach Recovery native Ebene wieder und kein Doppelpaiting. Viewport-Wechsel und Zeit-/Gefahrenwechsel ohne verwaisten Layer.
3. Bestehende Tests test-extreme-outlook-{area-rendering,geodata,field-contours,labels-layout-persistence}, neue test-extreme-outlook-render-fallback-0985309 und MapLibre-Worker-Bundle-Verifikation plus vollständiger Source-/Heavy-PR-Gate. Browser-/Simulatortest ist keine physische iOS-/VoiceOver-Abnahme.
4. Nur danach kontrollierter SHA-Bot-Merge → Server-ZIP → install-mid.yml → Worker-/Pages-Gates → Stable. Keine neue Workflow-Datei, keine Ruleset-Abschwächung.

## Verifikationsstatus
Codekandidat und Source-Vertrag erstellt; tatsächliche Browser-/Netzwerk-/Pixelabnahme **noch nicht belegt**. Bis zur Abnahme nicht als behoben oder produktiv veröffentlichen.

## Ergänzende runtime- und Vitest-Fachprüfung (MID 18.2.45)

Die Source-PR-Regression führt seit 160f98361d32753c1bca712e37e123fad6d9c94f das tatsächliche TSX-Overlay unter simulierten MapLibre-Source-/Worker-/Idle-Events aus, statt allein Source-Strings zu vergleichen. Die native Source-/Polygon-Vollständigkeit wird zusätzlich in `src/extremeOutlookRenderHealth.ts` als reine fachliche Entscheidung mit `tests/unit/extreme-outlook-render-health.test.ts` im vorhandenen Vitest-Pilot geprüft. Auch teilweise fehlende MultiPolygon-Geometrie darf nicht unbemerkt bleiben. Ein positives `queryRenderedFeatures` kann laut MapLibre-Dokumentation selbst bei tatsächlich null Pixelbeitrag auftreten; daraus wird daher keine Browser-Pixel-Freigabe abgeleitet. Echte Pixel-/Recovery-/Light-Dark-/Responsive-Prüfung bleibt vor Bot-Merge zwingend.

## SHA-geprüfte Parallelbasis nach erfolgreicher .308-Promotion

Die Source- und Installer-Freigabe von RUC v0.9.85.308 ist nach dem unveränderten, zielgerichteten Wiederholungslauf des zunächst an einer fehlenden optionalen Rolldown-Linux-Bindung gescheiterten Heavy-Jobs vollständig erfolgreich. Verifizierter neuer main=mid-stable SHA 3420d2b7f7afca80783ed90799234310820c9f3e. Der aktuelle Polygon-Integrationsmerge übernimmt dessen gesamtes Release-Tree inklusive nativer RUC-Komposite, WW-Provenienz, +27h-Anzeige, GRIB- und Quellenregressionen sowie ZIP/Worker/Pages-Gates; lediglich getrennte Polygon-Runtime-, Tests- und Versionsänderungen werden ergänzt. Draft- und Browser-Pixel-/WKWebView-Abnahmesperren gelten unverändert. Keine Native-Daten- oder Fallback-Schwellenänderungen.
