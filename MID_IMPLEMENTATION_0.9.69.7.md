# MID 0.9.69.7 – Mitteleuropa-Ausblick wiederhergestellt und Kartenkontext gehärtet

## Ursache des Rückfalls

Die RUC-/Worker-Fortsetzung v0.9.69.x wurde irrtümlich auf dem Professional-/Worker-Quellstand v0.9.66.19 weitergeführt. Der spätere, bereits geprüfte Stand v0.9.67.11 war dadurch nicht vollständig enthalten. Verloren gingen insbesondere die in v0.9.67.7 eingeführte Erweiterung des Extremwetter-Ausblicks vom alten DACH-Ausschnitt auf das vollständige ICON-D2-Modellgebiet sowie die nachfolgenden Resilienz- und Nowcast-Ergänzungen.

## Wiederherstellung

- Scope wieder verbindlich `Mitteleuropa` statt `DACH`.
- Vollständiges ICON-D2-Gebiet: ungefähr 43,18–58,00 °N und 3,85 °W–20,21 °E.
- Native ICON-D2-Gebietsmaske aus der rotierten Modellgeometrie statt des alten DACH-Polygons.
- 13×23 Vollraster und 11×19 resilientes Fallbackraster; nur Punkte innerhalb der nativen ICON-D2-Domäne werden angefragt.
- Erweiterte Regionszuordnung einschließlich Südostengland, Frankreich, Benelux, Dänemark, Polen, Tschechien, Slowakei, Ungarn, Slowenien, Norditalien und Nordwestkroatien.
- Batch-Retry/Teilcache und Mindest-Datenabdeckung wiederhergestellt.
- 0–6-h-KONRAD3D-/Mesozyklonen-Beobachtung wird wieder als Nowcast-Bestätigung genutzt; die Gewitterbezeichnung bleibt an beobachtete elektrische Aktivität gebunden.
- Browser-Direktpfad wird wieder aus derselben Worker-Teilquelle generiert und akzeptiert keine alten DACH/v4-Payloads.

## Kartenlesbarkeit

Gefahrenflächen liegen unter einer separaten freien OpenStreetMap-Kontextlage. Die OSM-Karte wird nach allen Gefahrenpolygonen nochmals mit 48 % Deckkraft auf z=20 gezeichnet. Dadurch bleiben Landesgrenzen, wichtige Kartenlinien sowie Orts- und Städtenamen auch bei mehreren verschachtelten oder überlagerten I1–I4-Gebietsflächen sichtbar. Gefahrenfüllungen sind zusätzlich auf eine effektive Deckkraft von höchstens 0,66 begrenzt; Schraffuren liegen bei 0,58. Interaktive Hit-Flächen (z=30), Gebietsbeschriftungen (z=35) und der gewählte MID-Standort (z=40) bleiben darüber bedien- und lesbar.

Es wird keine kostenpflichtige Kartenquelle und kein API-Key eingeführt.

## Regression

`test-extreme-outlook-mitteleuropa-recovery-096697.mjs` schützt Domain, Regionsanker, Cacheversion, Worker-/Browser-Scope, sichtbare Bezeichnungen und die Layerreihenfolge für Grenzen/Städte dauerhaft gegen einen erneuten Rückfall.
