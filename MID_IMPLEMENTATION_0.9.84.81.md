# MID v0.9.84.81 – Implementierung

## Anlass

Screenshot-Audit des mobilen Beta-Bedienkonzepts. Sichtbar waren drei Restfehler: ein mitten im Wort getrenntes Bottom-Tab-Label „Kurzfrist“, unnötiger Zeilenumbruch bei „14 Tage“, sowie eine optische Kollision der Header-Aktionsfläche mit der Suche. Beim zweiten Favoriten wurde das Standard-Badge zudem am rechten Rand ungünstig abgeschnitten.

## Umsetzung

- Bottom-Tab-Texte werden innerhalb der fünf Hauptziele gezielt von der appweiten allgemeinen Umbruchregel ausgenommen: `nowrap`, keine Silbentrennung, kein `overflow-wrap:anywhere`.
- Für <=430 CSS-px nutzt der Header zwei reguläre Zeilen: `Brand + Actions` und darunter `Search`. Unter <=360 px bleibt ein dreizeiliger Fallback erhalten, damit 44-px-Touchziele nicht zusammengedrückt werden.
- Die Suche erhält eine explizite `minmax(0,1fr) + 46px`-Aufteilung für Eingabefeld und Standortbutton. Das Eingabefeld selbst darf nur intern ellipsieren und wird nicht von fremden Aktionen überlagert.
- Favoriten-Badges verwenden auf <=430 px die kompakte sichtbare Form `Std.`; der vollständige semantische Inhalt `Standard` bleibt im DOM erhalten. Die Verwaltungsfläche ist ein eigener 40-px-Flexbereich und kann die horizontal scrollbare Favoritenliste nicht überdecken.
- Keine fachliche Wetterlogik geändert.

## Schutz

Neuer Regressionstest: `scripts/test-mobile-header-bottom-nav-098481.mjs`.
