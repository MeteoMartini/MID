## MID v0.8.27.2

- Tooltip-Metadaten des Ensemble-Temperaturdiagramms werden als untrennbare Zeilen dargestellt; Hazardtexte dürfen weiterhin sinnvoll umbrechen.
- Das Wind-/Böendiagramm nutzt größere X-Achsenreserve und einen separaten, nicht überlagernden Bereich für „Vorhersagetag“.
- Der Favoriten-Schnellzugriff trennt Auswahl und Sortierung: Auswahl über eine bewegungstolerante Pointer-Geste, Sortierung ausschließlich am Griff.
- Native HTML-Drag-Erkennung auf dem gesamten Favoritenbutton wurde entfernt, da sie auf Touch-Geräten Taps verschlucken konnte.
- Hintergrundlernen pausiert bei Pointer- oder Tastatureingaben und berücksichtigt `isInputPending`, bevor es rechenintensive Folgearbeit startet.
