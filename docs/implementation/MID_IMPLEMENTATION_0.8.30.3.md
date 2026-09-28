# MID v0.8.30.3

- Ensemble-Tooltips werden im Querformat und auf Geräten mit grobem Zeiger als feste, viewportgebundene Karte dargestellt und können rechts nicht mehr abgeschnitten werden.
- Die Recharts-Tooltip-Wrapper werden zusätzlich in `document.body` gerendert.
- Die bisherige Zustandsumschaltung vor jedem Tooltip-Tippen wurde durch einen Remount-Schlüssel nur beim Schließen ersetzt; dadurch entfällt ein vollständiger Chart-Neurender unmittelbar vor dem Öffnen.
- Sonne-/Wolkenzellen und ihre senkrechten Tageshilfslinien verwenden dieselbe proportionale Geometrie. Jede Hilfslinie liegt exakt in der Mitte ihrer Zelle.
- Temperatur, Niederschlag und Wind/Böen besitzen deutliche, aber dezente horizontale und senkrechte Rasterlinien.
