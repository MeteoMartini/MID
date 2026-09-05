# MID v0.9.78.63 — Skybar Sonne/Wolken

## Ziel
Die gemeinsame Skybar klassifiziert Sonne und Gesamtbewölkung wieder symmetrisch, vierstufig und gegenseitig exklusiv. Der gelbe Sonnenstreifen darf nicht mehr durch einen bloß niedrigen Bedeckungsgrad künstlich auf die höchste Stufe gehoben werden.

## Umsetzung
- Gelb beginnt tagsüber erst bei **mehr als 50 % relativer Sonnenscheindauer** der tatsächlich dargestellten Zeitspanne.
- Die vier gelben Dickenstufen bilden den Bereich **>50–100 %** ab; die bestehende Geometrie `2.4 / 3.3 / 4.2 / 5.1` bleibt unverändert.
- Grau beginnt bei **50 % Gesamtbewölkung** und bildet **50–100 %** mit denselben vier Dickenstufen ab.
- Vorhandene Sonnenscheindauer hat für die gelbe Klassifikation Vorrang. Nur wenn sie fehlt, darf der komplementäre Aufklarungsanteil aus dem Bedeckungsgrad als Fallback dienen.
- Gelb und Grau werden nie gleichzeitig als Grundband gezeichnet. Liegt direkte Sonnenscheindauer vor und überschreitet sie 50 %, wird Gelb verwendet; andernfalls kann ab 50 % Bedeckung Grau erscheinen.
- Fehlende Sonnenscheindauer wird nicht länger implizit als `0` behandelt.
- Für 3-h-Darstellungen und andere aggregierte Intervalle wird die Sonnenscheindauer nun durch die **echte dargestellte Intervalllänge** normalisiert. Dadurch können aufsummierte 3-h-Werte nicht mehr systematisch zur dicksten Sonnenstufe führen.
- Dieselbe Intervallkorrektur macht auch die Niederschlagsrate des Skybar-Overlays bei aggregierten Zeitfenstern zeitlich korrekt.

## Geltungsbereich
Die zentrale Engine `src/detailSkyBar.ts` bleibt gemeinsame Quelle für Tagesdetail, 24-h-Wetterprofil, 7-Tage-Kurvenübersicht und 7-Tage-Tageskarten. Worker-Fachlogik ist nicht betroffen.
