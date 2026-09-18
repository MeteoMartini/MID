# MID C17 Handoff · v0.9.85.37

## Ausgangspunkt

- Stabile Basis: MID v0.9.85.36 (`4d7b301c69d50576ed0e72b62acb844894554be1`).
- Anlass: realer Mobil-Sichtvergleich unter „Heute“ / DWD „Wolken + Niederschlagsart“. Der georeferenzierte DWD-Ortsausschnitt blieb nach Öffnen beziehungsweise Größenänderung nicht zuverlässig auf dem gewählten Ort zentriert.

## C17-Änderung

- Die etablierte DWD-Originalbildkalibrierung aus v0.9.76.11 bleibt unverändert. Sie ist weiterhin deutschlandweit über 17 sichtbare DWD-Stadtanker abgesichert.
- Die Zentrierung verwendet jetzt die tatsächlich gerenderte Canvas- und Viewportgröße und wird bei Bildladen sowie bei Größenänderungen von Viewport und Canvas erneut ausgeführt.
- Die Breitenanimation des Originalbild-Canvas ist abgeschaltet, damit der Ausschnitt nach der Zentrierung nicht mehr nachwandert.
- Ein expliziter „Standort“-Knopf zentriert den gewählten Ort erneut, ohne den aktuellen Zoom zu verlieren. Ein separater Reset setzt bei Bedarf auf 100 % zurück.
- Der plattformabhängige Emoji-Pin wurde durch einen Lucide/MID-Marker mit einem exakten Ankerpunkt auf dem georeferenzierten Originalpixel ersetzt.
- Die eingebettete DWD-Originallegende bleibt erhalten, wird auf schmalen Viewports aber leicht verkleinert, damit sie den Ortsausschnitt weniger verdeckt.

## Regression

- `scripts/test-c17-dwd-location-centering-098537.mjs` prüft die C17-Zentrierungslogik, den Markeranker, die CSS-Kaskade und die Elsig-Referenzposition aus dem realen Sichtvergleich.
- Bestehende DWD-Originalpixel-, Stadtanker-, Inversabbildungs- und Quellenverträge bleiben unverändert bestehen.

## Veröffentlichung

- Ausschließlich Source-PR-Gate → Auto-Merge → Release-ZIP → Installer → GitHub Pages → Stable-Promotion.
- Veröffentlichung erst als erfolgreich melden, wenn `main`, Pages und `mid-stable` auf denselben Release-SHA zeigen.

## Fortsetzung

- Nach Stable-Promotion DWD-Ortsausschnitt auf iPhone-Portrait, iPhone-Landscape, iPad und Desktop erneut gegen Markerzentrum/Ort prüfen.
- Danach Redesign-Fahrplan abschnittsweise fortsetzen; keine Rückkehr zum alten Kachel-/Kartenlayout.
