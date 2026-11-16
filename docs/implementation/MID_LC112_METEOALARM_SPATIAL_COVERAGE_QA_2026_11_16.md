# MID LC 1.12 · #411 – Warngebietsprovenienz: keine pauschale Punktprüfung

**QA-DRAFT / NO READY / NO MERGE / NO RELEASE.** Ausgangs-Stable `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, v0.9.85.486, fünf aktive Rulesets. Integration auf bestehendem #858 HEAD `2309b059fd20c08215d8dbec376f50e32e0d0194`; Sicherheits-PR #839/#740 unangetastet.

## Belegter Originalquellbefund
Der stabile Worker nimmt amtliche MeteoAlarm-Warnungen aus den CAP-/VIS-Quellen auf. Bei nicht erreichbarer amtlicher MVT-Polygonprüfung benutzt `meteoalarmPointContext` weiter die namens-/bbox-basierte Fallback-Region; die Herkunft wird zwar in `sourceStatus.coordinateAssignment` kenntlich, aber das allgemeine Feld `coverage` nannte **sämtliche** europäische Warnungen pauschal `koordinatengeprüft`. Das ist bei BBox-Fallback fachlich zu stark. Die offizielle MeteoAlarm-FAQ https://api.meteoalarm.org/edr/v1/faq beschreibt die EDR-GeoJSON-Geometrien ausdrücklich als **Bounding Boxes**, nicht die exakte Warngebietsgrenze. Diese extern dokumentierte Grenze wird nicht überschrieben oder als Punktpolygonnachweis ausgegeben.

## Minimaler produktiver Umfang
Nur das universelle `coverage`-Label wird zu `Ortszuordnung je Warnung prüfen` geändert. Die vorhandene differenzierte polygon-/bbox-/local-name-Statusbeschreibung bleibt erhalten. **Keine** Änderung von Warnzählung, amtlicher Warnstufe, CAP-Texten, Quelle, Zeit, Geometrieauswertung, Dedupe, Push, WMO-/DWD-Farben oder MID-eigenen Warnungen. Kein stilles Unterdrücken realer Warnungen wegen fehlender Geometrie.

Die einzige Source-Änderung wird identisch in `worker-src/00-core-observations.js`, `worker/metar-proxy.js` und `worker.js` gespiegelt. Der vollständige Original-Worker bleibt Präfix des Aggregats; beide Gesamt-Worker sind byteidentisch. Drei additive Vitest-Fälle prüfen die unveränderte Spiegelparität, die ehrliche Abdeckungsbeschreibung und das unveränderte CAP-/Update-/Dedupe-Handling.

## Beabsichtigter Restumfang
Dies ist eine **Präsentations-/Provenienzkorrektur, keine vollständige Ortspolygon-/Amtlichkeitsvalidierung**. #411 bleibt offen. Live-Barcelona-26-Kandidaten, MVT-/CAP-Original-ID, exakte AEMET-Zonengeometrie und UI-/Widgets-Readback müssen separat erfolgen. Unsichere Box-/Text-Fälle später nicht als punktgenaue Warnung klassifizieren; keine amtlichen Meldungen ohne Beleg unterdrücken. Die Workflows der Produktiv-Worker müssen bei Release weiterhin vollständig atomar geprüft werden. Volle Source-/Core-/Heavy-/Review-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates werden hier **nicht** als erfolgt deklariert. #740 bleibt beim Release-Spezialchat.
