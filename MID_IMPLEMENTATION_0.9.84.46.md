# MID 0.9.84.46

## 14d-Ensemble-Hinweise
Die in 0.9.84.44 eingeführte Umfeld-/Rundungslogik war im Datenpfad vorhanden, wurde im sichtbaren Tooltip aber nur im SVG-`title` abgelegt; die sichtbare Hazard-Zeile verwendete weiterhin `formatDwdWarningValue()` des Punkt-Hinweises. Das ist korrigiert. Sichtbarer Wert und Detailkontext werden nun aus derselben Ensemble-/Umfeldbasis erzeugt. Der Tooltip zeigt den Kontext als lesbare zweite Zeile.

## Installer #999
Build, TypeScript 7 und Vite waren erfolgreich. Zwei Regressionen enthielten noch die alte DOM-/Titelstruktur des Tmin/Tmax-Bereichs aus vor 0.9.84.45 und wurden auf den neuen Vertrag aktualisiert.
