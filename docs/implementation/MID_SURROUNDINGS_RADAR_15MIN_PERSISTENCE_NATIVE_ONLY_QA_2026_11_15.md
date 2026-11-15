# MID Umfeldwetter – Originalzeit, Radar/Sat-Scrubber, Moduspräferenz · QA 15.11.2026

## Quellen- und Integrationsbasis

Stable `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc` (v0.9.85.483). Vor jeder Integration erneut prüfen. Der parallel laufende Leitchat-Release-Train #828 (bei Implementierung HEAD `fcd16a33574d1d2f0c0b9e19797a9ba151add681`) enthält bereits die unabhängige Temperatur-Requestbindung und 150-ms-Cloud-Scrub-Koaleszenz aus #825. Beide Hilfsdateien werden hier mit genau ihrer Quell-SHA als **QA-Build-Abhängigkeiten** importiert. **Auf keinen Fall** diesen Branch gegen #828 blind als Ganzes mergen: Die finale Datei `CurrentSurroundings.tsx` und `currentSurroundingsCloudImage.ts` müssen nach Promotion ausschließlich als semantischer, SHA-/Hunk-geprüfter Zusatz auf dem dann gültigen Stable angewandt werden.

## Rad/Sat – echte 15-Minuten-Bedienung

- Radar-/Satellitenmodus erhält den gleichen 44px-tauglichen `−15 min` / nativen Slider / `+15 min` / absoluten Uhrzeitstreifen wie Wolken/SigWx; Bereiche −3…+8 Schritte (−45 bis +120 min), optionaler `Jetzt`-Sprung.
- Quelltermine werden nicht aus einer Zeitleiste erfunden: `surroundingsRadarTimeline.ts` wählt höchstens **7,5 Minuten** vom relativen Anfrageziel entfernt liegende, tatsächlich im MID-Composite-Katalog gemeldete DWD-Radar-Beobachtungen beziehungsweise echte Nowcast-Einträge. Beobachtungen dürfen nicht in Zukunft rutschen; Nowcasts nicht als Beobachtung erscheinen. Fehlende Quelltermine = fehlendes Original, nicht ein alter Screenshot mit neuem Zeitlabel.
- Satelliten-Beobachtungen erhalten ihren **eigenen** tatsächlichen Originalzeitstempel, unabhängig vom Radar; im positiven Nowcast-Horizont wird **kein** altes Satellitenbild als zukünftige Beobachtung dargestellt. Bei Nowcast sind Ortswerte/Modellphase aus nicht passenden Zeiten gesperrt.
- Responsive Verhalten verwendet die bereits getestete, einzeilige 44px-Range/CSS-Komponente. Browsermatrix und Tastatur-/Fokusprüfung sind Pflicht; Unit-Tests allein ersetzen keine mobile Abnahme.

## Modus dauerhaft speichern

`CurrentSurroundings.mode` wird über den vorhandenen zentralen `useDisplayPreference`-Vertrag gespeichert. Validierung ausschließlich `cloud` oder `radar`, bei Erststart weiterhin Default `cloud`. Kein eigener, ungeschützter LocalStorage-Code, keine zusätzliche API oder neue Kosten.

## Cloud/SigWx – meteorologisch eindeutige Originalzeit

Bisher erzeugte der Umfeldkarten-Loader im Produktivpfad über `interpolateVerifiedSurroundingsCloud` aus Stundenoriginalen eine Zwischenkarte und nahm den SigWx-Wert vom nächsten Original. Der *Umfeld*-Produktivpfad lässt jetzt ausschließlich ein `ref.time` zu, das **exakt** dem UTC-Anfrageziel entspricht, und im separaten nativen Cloud+SigWx-Fallback nur ein exakt zeitgleiches Originalpaar. Der alte pure Blend-Helper kann aus Abwärtskompatibilität unverändert bestehen bleiben, ist aber aus diesem Laufzeitpfad entfernt. Beim Zielwechsel wird eine Bildvorschau eines **anderen** Modelltermins nicht als Bild für den neuen Zieltermin beibehalten. Nicht vorhandenes Original = NoData, statt synthetischer Bewegung/Interpolation, und durch Quellenhinweis sichtbar.

**Wichtige noch offene Grenze:** Die DWD-Originalquelle stellt tatsächlich IR10.8-SynSat-GRIBs für 0…14 h mit 15-Minuten-Schritten bereit; diese Helligkeitstemperatur ist **nicht** das gleiche Feld wie CLCT-Bedeckungsgrad oder ein WMO-4677-SigWx-Feld. Der aktuelle MID-Synoptik-Index erzwingt ganzzahlige `hour` und verarbeitet keine nativen viertelstündlichen Cloud+SigWx-Paare. Daher wird hier **kein** vollständiges bewegtes 15-Minuten-PseudoSat-/SigWx-Produkt vorgetäuscht. Echte MID-Live-Aktivierung erfordert die bisher separate RUC-/IR10.8-Staging- und ecCodes-/Spektral-/Bitmap-/Georeferenz-Qualifikation (alter #820), eine eigene durchgängige Quelle für passende SigWx-Originalfelder und die geprüfte atomare Kartenpipeline. Ohne diese Zulassung müssen Lücken sichtbar bleiben. DWD: https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ ; Open-Meteo: https://open-meteo.com/en/docs/dwd-api

## Tests und Release

- Neuer Vitest-Test für Radar-Originalstempel, Zeitgrenzen, GMT-/DST-Übertritt, Original-vs.-Nowcast, Fehlzeiten, persistierten Modus und keine Laufzeitinterpolation.
- Vorhandene Source-Regression `test-current-surroundings-temperature-0985476.mjs` prüft nun ausdrücklich **nur Originale** im Umfeld-Loader; isolierter Legacy-Blend-Helper wird aus Regressionserhalt weiter separat getestet.
- Browser-Test `verify-unified-map-browser-0985167.mjs` prüft an real gerenderten 320–834px-Layouts Rad/Sat-15-Minuten-Zeitleiste, 44px Touchziele, echten WMS-Nowcast-Handoff und Rückwärtsbedienung statt der obsoleten Select-Liste.
- Für Freigabe: Source/Core/Heavy, TypeScript/Vite, Datenprovenienz, WMS-Frame-Status, Safari/WebKit, iPhone & Tablet, Light/Dark, Fokus/Dynamic Type, reale iOS-/VoiceOver-Abnahme getrennt sowie Installer/Worker/Pages/Stable-Gates. Keine Versionsspiegel auf QA-Branch ändern; tatsächliche Buildversion bestimmt der Release-Train.


## MID-Karten 1.8 – IR10.8-Shadow-Rebasierung (15.11.2026, QA ONLY)

Die zusätzliche wissenschaftliche QA übernimmt vier bereits entwickelte und auf dem alten Spezial-Draft #820 (f90d5999edd7f9dfbe47ffcf2b0bab383511add3) geprüfte Original-Git-Blobobjekte **ohne Code-Neuerfindung** auf die aktuelle unveränderte Stable-Basis c9fadfcd0969e949a92f414b321627dd3d4fb0cc des bestehenden Karten-Drafts #832. Exakte Quellen:

- `tools/ruc/ir108_original_probe.py`: `050eca6dc2cda14577d3948e407e89a76dafe4d6`
- `tools/ruc/test_ir108_original_probe.py`: `88dfc0ef12092a752678bc840325d5d0ea60843c`
- `tools/ruc/ir108_stage_originals.py`: `5a51e0e75216729d7c149d7645cf61ccc358a495`
- `tools/ruc/test_ir108_stage_originals.py`: `ee49cb520465b3715942a7471e3cde127e02145a`

Der Originalprüfer validiert insbesondere GRIB2-PDT4.32/SEVIRI-Kanal IR10.8 gegenüber WV6.2, strikte Lauf-/UTC-Gültigkeits-/15-min-Schritte, Bitmap/Missing und physikalische Kelvin-Extrema (nur wenn reale Werte durch ecCodes decodiert werden). Der optionale private Stager akzeptiert ausschließlich echte amtliche DWD-`r/<run>/s/PTxxxHyyM.grib2`-Originale, begrenzt den Satz auf genau zehn zeitlich benachbarte Frames, Bytes und Redirects und verwirft unvollständige Downloads atomar. Es gibt **keine** neuen Downloads im MID-Worker oder Browser, keine Hintergrundaktivierung und keine Veröffentlichung der Rohdaten.

Die bestehende `test-current-surroundings-temperature-0985476.mjs` ruft nun zusätzlich die vorhandenen Staging-Negativtests über die sichere Python-Discovery `test_ir108_*.py` ab. Diese Offline-Fixtures sind keine reale GRIB- oder iOS-Validierung. Die alte #820-PR bleibt als Provenienznachweis erhalten und darf **nicht separat** auf #832 oder den Leitchat-Release-Train gemergt werden. Weil sich #832 in UI-Dateien mit #828 überschneidet, ist nur kontrollierter SHA-/Hunk-geprüfter selektiver Import nach neuem Stable-Abgleich zulässig.

**Aktivierung:** `activationAuthorized=false` bis aktueller vollständiger zehn-Dateien-Originaldownload, ecCodes-Feld-/Bitmap-/CLAT-CLON-Gitterschlüssel, IR10.8-georeferenzierter Render-/Farbvertrag, getrennte verfügbare 15-min-SigWx-Quellen und reale Browser-/Performance-/Source-/Installer-/Worker-/Pages-/Stable-Gates vorliegen. Kein echtes Satellitenbild, keine Umrechnung in `CLCT` oder WMO-4677-`WW`, kein Missing→0.


## OPERA-Ortswechsel-Guard 1.8 (15.11.2026, nur QA)

Der bisherige Fallback setzte `opera` und `phaseImage` nur nach Zeit in den View-State. Bei raschem Orts-/BBox-Wechsel konnte deshalb ein noch frisches OPERA-Bild vom vorherigen Ort kurzfristig über der neuen Umfeldkarte erscheinen. Der reine `selectVerifiedSurroundingsOperaFrame`-Guard bindet nun lokale OPERA-Raster und das Niederschlagsart-Overlay an die exakte `[lat,lon,bbox]`-Anfrage sowie das originale UTC-Beobachtungsfenster (max. 45 min Vergangenheit, max. 90 s Uhrtoleranz Zukunft). Ein fremder oder veralteter Frame wird sofort NoData statt als Bild für den aktuellen Ort ausgegeben. Kein zusätzlicher Abruf, kein Modellblend, keine Warnungsänderung. Vitest-Negativfälle für Ort, BBox, Alter, Zukunft, URI und phasengebundene Bildzeit sind ergänzt. Browser-/Source-/Release-Gates bleiben getrennt erforderlich.
