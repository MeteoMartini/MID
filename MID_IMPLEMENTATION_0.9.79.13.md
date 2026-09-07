# MID v0.9.79.13 – Skybar No-gap-Garantie am Tage

## Befund
Die zentrale Skybar-Engine konnte tagsüber einen leeren Slot erzeugen, wenn eine belastbare Sonnenscheindauer von höchstens 50 % vorlag und gleichzeitig die Gesamtbewölkung unter 50 % lag. Gelb war dann bewusst deaktiviert, Grau unterschritt aber ebenfalls seine reguläre 50-%-Schwelle.

## Änderung
- Die zentrale Engine `src/detailSkyBar.ts` garantiert nun für **bewertbare Tages-Slots** ein sichtbares Grundband.
- Direkter Sonnenschein >50 % bleibt gelb und hat Vorrang.
- Bei direktem Sonnenschein ≤50 % und Gesamtbewölkung <50 % wird ein graues Mindestband erzeugt; die regulären vier Bewölkungsstufen ab 50 % bleiben unverändert.
- Fehlt die Sonnenscheindauer, bleibt der komplementäre Aufklarungsgrad aus Gesamtbewölkung der bisherige Fallback.
- Niederschlag bleibt als farbreines Overlay darüber.
- Klare Nächte <50 % Bewölkung dürfen weiterhin leer bleiben.
- Wenn sowohl Sonnenscheindauer als auch Bewölkung nicht bewertbar sind und kein Niederschlag vorliegt, bleibt eine echte Datenlücke sichtbar statt meteorologische Information zu erfinden.

## App-weite Wirkung
Alle sichtbaren Skybars verwenden dieselbe Engine und übernehmen die Korrektur automatisch:
- 24-h-Tagesdetail
- 24-h-Wetterprofil
- 7-Tage-Kurvenübersicht
- 7-Tage-Tageskarten

## Absicherung
- Neuer Pflicht-Test `scripts/test-skybar-daylight-no-gaps-097913.mjs`.
- `test-audit-science-097864.mjs` prüft den kritischen Fall zusätzlich zur Laufzeit.
- Der UI-Hinweis und `MID_24H_PROFILE_STORY_AXIS_CONTRACT.md` wurden auf die No-gap-Regel aktualisiert.
