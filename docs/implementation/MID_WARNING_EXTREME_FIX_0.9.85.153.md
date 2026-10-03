# MID v0.9.85.153 · Warnungsseite und Extremwetter-Ausblick

## Ausgangsbasis

`main` und `mid-stable` waren vor Beginn identisch auf `1cceaf812fa1491c687d8552a69762a1d263bdb3` (v0.9.85.152). Replit lag auf einem älteren Stand und wurde nicht als Codebasis verwendet.

## Warnungsseite

Der in v0.9.85.151 neu eingeführte sichtbare Absatz „MID-Prognosehinweise: bis 7 Tage …“ duplizierte Informationen, die bereits über Titel, Ereignis-Timeline und die Kennzeichnungen Prognosehinweis/Vorhinweis/Gefahrenausblick vermittelt werden. Er wird vollständig entfernt. Warnhorizonte und fachliche Einstufung bleiben unverändert.

## Extremwetter-Ausblick

Im Worker-Router wird das Request-URL-Objekt als `u` angelegt. Der neue Langfristzweig griff irrtümlich auf `url.searchParams` zu. Dadurch entstand vor jeder meteorologischen Berechnung ein JavaScript-Referenzfehler. Der Bereichsparameter wird nun über `u.searchParams` gelesen.

Der erweiterte Clientpfad fängt technische Worker-/Netzfehler ab und gibt der Oberfläche nur eine neutrale Meldung „Der regionale MID-Datendienst … ist derzeit nicht erreichbar“. Ein Abort bleibt weiterhin ein Abort und wird nicht in einen Ausfalltext umgedeutet. Es werden keine fehlenden Modellfelder als Entwarnung interpretiert.

## Regression

`scripts/test-warning-extreme-regression-0985153.mjs` schützt:
- Entfernung des redundanten Warnungsabsatzes,
- korrekten `u.searchParams`-Range-Zugriff im Worker-Quellfragment und produktiven Aggregat,
- Verbot des früheren nicht definierten `url.searchParams`-Zugriffs,
- nutzergeeigneten Langfrist-Fehlerzustand.

Keine Änderungen an Warnschwellen, Wahrscheinlichkeitsgrenzen, ICON-D2/ICON-EPS-Methodik oder amtlichen Warnverträgen.
