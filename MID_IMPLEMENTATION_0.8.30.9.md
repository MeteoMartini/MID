# MID v0.8.30.9

## Korrekturen
- Tooltipkarte selbst ist jetzt ein explizites Schließziel. Pointer-Down innerhalb des Tooltips wird nur abgefangen; der anschließende Klick schließt den Tooltip kontrolliert. Zusätzlich wird der Recharts-Tooltip nach dem Schließen kontrolliert mit `active={false}` unterdrückt und erst beim nächsten Diagrammklick wieder freigegeben.
- Niederschlag und Wind/Böen nutzen dieselbe native Recharts-X-Achse samt diagonalen Tageslabels wie Temperatur. Die externe HTML-Achse wurde vollständig entfernt.
- Feste, widersprüchliche Höhenregeln für Niederschlag/Wind werden im finalen Layout überschrieben; Chart und X-Achse wachsen in getrennten Grid-Zeilen.
- Senkrechte Tageslinien werden nach den Datenserien als achsgebundene `ReferenceLine` gezeichnet und bleiben sichtbar.
- Neue Regression deckt 390/620/Desktop-Verträge, Tooltip-Schließung, Achsentitel und Tageslinien ab.
