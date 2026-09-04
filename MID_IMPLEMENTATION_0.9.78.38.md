# MID v0.9.78.38

## Anlass
Die Skybar soll dem bereitgestellten Darstellungsvertrag folgen: Sonnenschein gelb, Bewölkung grau, Niederschlag blau; die Linienstärke besitzt vier Stufen. Zusätzlich sollen die Stufen leicht kräftiger und auf kleinen iPhone-Darstellungen besser erkennbar sein. Für Bewölkung darf die Stärke nicht über wechselnde Grautöne, sondern ausschließlich über die Dicke kodiert werden.

## Umsetzung
- Gemeinsame Quelle bleibt `src/detailSkyBar.ts`; Tagesdetail, 24-h-Profil, 7-Tage-Kurvenübersicht und Tageskarten verwenden weiterhin dieselbe Skybar-Engine.
- Farbvertrag:
  - Sonnenschein: `#ffc229`
  - Bewölkung: `#aeb3b9` mit einheitlicher Opacity `0.96`
  - Niederschlag: `var(--param-precipitation)` für alle Phasen
- Bewölkung:
  - unter 50 % kein Grauband,
  - 50–100 % werden in vier gleich breite Intensitätsbereiche auf vier Dickenstufen abgebildet.
- Sonnenschein:
  - nur tagsüber und unter 50 % Gesamtbewölkung,
  - vier Dickenstufen aus dem stärkeren Signal von relativer Sonnenscheindauer und Aufklarungsgrad.
- Niederschlag:
  - eigener blauer Overlay-Layer,
  - vier Dickenstufen weiter nach auf mm/h normalisierter Intensität,
  - keine Farbmischung mit Grundband.
- Dickenstufen von `2.1 / 2.9 / 3.7 / 4.5` auf `2.4 / 3.3 / 4.2 / 5.1` angehoben.
- Mobile Tageskarten-Skybar bleibt auch bei <=480 px 16 px hoch statt auf 14 px zu schrumpfen.
- Legende erklärt den Vertrag jetzt explizit mit drei Farbbeispielen und der 50-%-Schwelle.
- Gleiche Farb-/Opacitywerte ermöglichen `appendSegment` weiterhin die fugenlose Zusammenfassung gleich dicker Nachbarsegmente; die bisherigen künstlichen Grautonwechsel können keine optischen Unterbrechungen mehr erzeugen.

## Regression
`scripts/test-weather-profile-skybar-pills-097723.mjs` schützt nun zusätzlich:
- Gelb/Grau/Blau,
- einheitliches Grau,
- 50-%-Schwelle,
- vier verstärkte Dickenstufen,
- blaues Niederschlags-Overlay unabhängig von der Phase,
- Erhalt der 24-h-Tageskarten-Skybar und gerundeter/fugenloser Segmente.
