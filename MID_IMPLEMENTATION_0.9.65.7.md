# MID 0.9.65.7 – kompakter aktueller Warnzustand

## Ergebnis
Die automatische Warnlage folgt wieder dem vorgesehenen Compact-/Disclosure-Vertrag. Im geschlossenen Zustand wird nur der **aktuell gültige Warnzustand** angezeigt. Erst beim Aufklappen erscheinen die bereits vorhandenen Tagesgruppen, Zeitfenster, Kennwerte und Detailtexte. Die amtlichen CAP-Warnungen schließen unverändert direkt darunter an.

## Aktueller Zustand statt Zukunftsliste
- Der kompakte Kopf wertet ausschließlich Warnintervalle aus, die **jetzt** gültig sind.
- Bei gleichzeitig aktiven automatischen Warnungen bestimmt die **höchste aktuell aktive Warnstufe** die Farbe des Kopfes.
- Liegt aktuell keine automatische Warnung vor, bleibt der Kopf im unkritischen Zustand und zeigt `Aktuell: keine Warnlage`; ein erst später beginnendes Signal wird nicht fälschlich als aktueller Zustand präsentiert.
- Die frühere Zeitfensteranzahl im geschlossenen Kopf entfällt. Dadurch bleibt die Karte insbesondere mobil deutlich schlanker.

## Grammatik der Warnstufe
Der Status wird prädikativ formuliert. Für Wärmebelastung lautet er daher z. B. **`Aktuell: extrem`** beziehungsweise **`Aktuell: stark`** und nicht `Extreme`/`Starke`. Entsprechende flektierte Anfangsformen anderer Warnarten werden analog in eine prädikative Kurzform überführt, soweit ein sinnvoller Stufenbegriff vorhanden ist.

Die ausführlichen Warnkartentitel bleiben dagegen als vollständige Nomenphrase erhalten, z. B. **„Extreme Wärmebelastung“**, weil diese Form dort grammatisch korrekt ist.

## Aufklappen und amtliche Warnungen
- Der komplette automatische Warnbereich ist als eigener Aufklapper ausgeführt.
- Nach dem Öffnen bleiben Tagesgruppierung, Gültigkeitszeiträume, DWD-Stufenfarbe, Messwert, niedrigere einrahmende Stufen und Einzel-Details vollständig erhalten.
- **Amtliche Wetterwarnungen** bleiben unabhängig davon direkt anschließend sichtbar und behalten CAP-Originaltext, Handlungsanweisung, Gebiet, Sprache, Quelle und Gültigkeit.

## Worker und Datenfluss
Die Änderung ist ausschließlich UI-/Darstellungslogik. Es entstehen keine zusätzlichen Wetter-, Radar-, Cache-, KV- oder Worker-Abfragen. Die Worker-Fachlogik bleibt unverändert und wird lediglich auf **0.9.65.7** versionssynchronisiert.

## Regression
`scripts/test-warning-current-summary-disclosure-09657.mjs` schützt den aktuellen Warnzustand, die höchste aktive Warnstufenfarbe, die prädikative Statusformulierung, die versteckten Zeitfenster bis zum Aufklappen sowie die unveränderte Anordnung der amtlichen Warnungen.
