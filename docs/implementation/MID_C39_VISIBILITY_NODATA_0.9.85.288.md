# MID-C39 · Sichtweiten-NoData und Nebelklassifikation · v0.9.85.288

## Gesicherter Codebefund
Ausgangsstand `main = mid-stable = ffcc37e37c6a143ff73a714494c3e9c52eea987c`, MID v0.9.85.287 nach erfolgreich durchlaufenem Installer #39108469858. Kein anderer offener Produkt-PR. Die generische `finite(value)`-Konvertierung in `src/visibilityPhenomena.ts` verwendete `Number(null)` bzw. `Number('')` und behandelte fehlende JSON-Werte daher als numerische 0. Für `classifyVisibilityPhenomenon({visibility:null,humidity:91,weatherCode:3})` konnte das zu einem unbelegten Nebelsignal führen; bei `humidity:null,visibility:2200` wurde RH 0 % und damit trockener Dunst erfunden. Dies ist ein Codebefund an einer exportierten Funktionsgrenze, keine bestätigte Live-Fehlanzeige.

## Fachlicher Umfang
- `null`, `undefined`, Leer-/Blanktext, Booleans, Arrays/Objekte, NaN/Infinity an der Klassifizierung als missing behandeln. Gültige endliche echte Nullwerte und nichtleere numerische Strings bleiben erhalten.
- WMO/DWD-Hypothesen beibehalten: Nebel bei ausreichender meteorologischer Indikation und Sicht unter 1000 m, Dunst bei passenden Schwellen; finite widersprechende Sicht geht vor Modell-Wettercode. Vertrauenswürdiges METAR-Phänomen behält eigene berichtete Provenienz.
- Fehlende Sichtweite niemals zu 0 m konvertieren oder Modellnebel zum gemessenen Nebel hochstufen. Fehlende relative Feuchte aus vorhandener gültiger Temperatur/Taupunkt ableiten, andernfalls unbekannt.
- Kein Wechsel von Open-Meteo-Modell-IDs, Wettercode-Katalogen, Flugwarnungen, Beobachtungsregeln, Worker-Schnittstellen oder amtlichen Warnungen. `mapHours` besitzt bereits einen NoData-Fallback `n(value,NaN)`, der nicht doppelt geändert wird.

## Reproduzierbare Abnahme
Neuer Test `scripts/test-visibility-nodata-0985288.mjs` lädt den **tatsächlichen** TypeScript-Klassifizierer via esbuild und vergleicht fehlende Quellenwerte, echte extreme 0-m-Sicht, trocken/feuchten Dunst, Modellnebel bei Missing, trusted METAR, widersprechende klare Sicht und den JSON-NaN→null-Cachepfad. Zwei Baseline-Inventare ergänzt. Automatische Regressionstests, Wetter-/Skybar-/Karten-/Widget-/Worker-/Browser-/iOS-Hüllen-Gates bleiben unverändert erforderlich; keine physische WKWebView-/VoiceOver-Abnahme. Versionierung, Nutzer-/Entwickler-Changelog und Releasepfad nur über geschützten MID Source-PR → SHA-Bot → ZIP → Installer → Worker/Pages → Stable.

## Andere offene Fälle
#352 RUC-Frische/Modellangebot, #374 appweite Skybar-Abnahme, #405 Open-Meteo neue Modell-IDs/ICON-v1-Sichtweite und historische Strahlung sowie #362 Replit Least Privilege bleiben eigenständig. Diese Korrektur ist kein Beleg einer verfügbaren Open-Meteo-RUC-API oder bereits behobener Upstream-ICON-Sichtweitengrenze.
