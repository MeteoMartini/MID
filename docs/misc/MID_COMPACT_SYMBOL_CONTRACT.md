# MID Compact Symbol Contract

Stand: v0.9.78.70

## Ziel

Eindeutige meteorologische Symbole dürfen in dichten, wiederholten Datenzeilen sichtbare Kurzlabels ersetzen, wenn dadurch auf iPhone/Tablet/Desktop messbar Breite oder Höhe gewonnen wird. Der Bedeutungsgehalt und die Bedienbarkeit dürfen dabei nicht sinken.

## Verbindliche Regeln

1. **Icon-only nur bei eindeutiger Semantik.** Temperatur (`ThermometerSun`/`Thermometer`), Niederschlag (`Droplets`/phasenspezifisches Symbol), Wind (`Wind`) und Sonnenscheindauer (`Sun`) dürfen in kompakten Wiederholungszeilen ohne sichtbares Wort erscheinen.
2. **Barrierefreiheit bleibt textuell.** Icon-only-Ausgaben tragen `aria-label`, `title` oder einen `.sr-only`-Text. Das Symbol ist kein Ersatz für die zugängliche Bezeichnung.
3. **Einheiten bleiben sichtbar.** `°`, `mm`, `%`, `kt`, `h`, `min`, `hPa`, `km` werden nicht durch Icons ersetzt.
4. **Keine Icon-only-Sprache in Überschriften, Warnungen oder amtlichen Texten.** Abschnittsnamen, Warninhalte, komplexe Luftfahrtbegriffe und erklärungsbedürftige Größen bleiben ausgeschrieben.
5. **Keine Mehrdeutigkeit.** Begriffe wie Wolkenuntergrenze, Sicht, Luftdruck, Datenqualität, Konfidenz oder Modellstand werden nicht allein durch ein generisches Symbol ersetzt.
6. **Responsiv einheitlich.** Dieselbe Semantik gilt in Desktop sowie Mobil Hoch-/Querformat; nur Größe/Abstand dürfen responsiv variieren.

## v0.9.78.70 umgesetzt

- 14-Tage-Tageskarten: sichtbare Wiederholungslabels `Temp`, `Niederschlag`, `Wind` entfallen; Icon + zugänglicher Text bleiben.
- Event-Stundenkarten: `Wind` und `Sonnenschein` in der unteren Kompaktzeile werden durch Wind-/Sonnensymbol + Wert ersetzt.
- Event-Kurzwerte: die ausgeschriebene Wiederholung `Sonnenschein` neben einem bereits eindeutigen Sonnensymbol entfällt.
- Widget: redundante zweite Zeile `Sonnenscheindauer` unter `☀ + h` entfällt; `title`/`aria-label` erhalten die Bedeutung.

## Bewusst nicht verkürzt

- Achsen- und Diagrammtitel (z. B. Luftdruck, Niederschlag), weil Icons dort ohne Kontext die Zuordnung erschweren können.
- Hauptmetriken und Einstellungsoptionen, weil sie als Navigation/Steuerung sprachlich eindeutig bleiben sollen.
- Warnungs-, Gefahr-, Flugmeteorologie- und Datenqualitätsbegriffe.
- `Sicht`, `Wolkenuntergrenze`, `Bewölkung` und `Feuchte` außerhalb eindeutig beschrifteter Mikrometriken.

## v0.9.78.72 Ergänzung · Vorhersagekonfidenz

- Vorhersagekonfidenz ist weiterhin **keine generische Icon-only-Metrik**. Zulässig sind ausschließlich strukturierte, barrierefrei beschriftete Darstellungen mit eindeutigem Zustandsmodell.
- In Einstellungen → Darstellung kann zwischen **Signalbalken**, **Ampel** und **Text + Index** gewählt werden.
- Standard ist **Signalbalken**, weil diese Form auf iPhone Hoch-/Querformat am wenigsten Breite benötigt.
- Signalbalken/Ampel bleiben mit dem numerischen 0–100-Konfidenzindex gekoppelt; der Index ist ausdrücklich keine Trefferwahrscheinlichkeit.
- Der Außenring bleibt unabhängig davon ausschließlich der Datenqualität vorbehalten. Randtage werden als „teilw.“ gekennzeichnet und nicht als meteorologisch schwache Konfidenz missverstanden.
