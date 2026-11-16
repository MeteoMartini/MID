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


## MID-Karten 1.8 – echte 15-min-GSP-Raten statt erfundener WW-Zwischenwerte (15.11.2026)

**Amtlicher Source-Abgleich:** DWD ICON-Modell-/RUC-Parameterreferenz 2025, Tabelle 5.6 (DWD-Datei `icon_d2_dbbeschr_aktuell.pdf`), führt `PRR_GSP` (`0/1/77`), `PRS_GSP` (`0/1/56`) und `PRG_GSP` (`0/1/75`) ausdrücklich als **momentane** großräumige Niederschlagsraten (`kg m^-2 s^-1`, Oberfläche) auf. RUC-Ausgabekatalog führt für diese Produkte jeweils 15 Minuten. Damit ist die sofortige Phase aus nachweislich originalen Regen-/Schnee-/Graupel-Raten zeitlich besser geeignet als die unqualifizierte Differenzierung kumulierter `RAIN_GSP`-/`SNOW_GSP`-/`GRAU_GSP`-Mengen. Die drei Raten decken **nicht** sämtliche konvektiven Prozesse, Gewitter, Hagel, Nebel, Gewitterböen, örtliche Glätte oder WMO-4677-`WW` ab. Ein reines Nullsignal ist **keine** meteorologische Entwarnung. Etwaige spezifische Warnungen bleiben ausschließlich amtlich.

**Neu, strikt offline:** `tools/ruc/original_15min_phase_gate.py` kombiniert nur dann drei zusätzliche Originalfeldgruppen mit dem bestehenden echten IR10.8-Zehn-Frame-Manifest, wenn alle 40 GRIB-Originaldateien dasselbe `run`, die zehn identischen UTC-`valid`-Stempel, native 542040-Punkte-/UUID-/Surface-Geometrie, eindeutige offizielle DWD-`/r/<run>/s/PTxxxHyyM.grib2`-Dateipfade, Bytes/SHA256 und exakt passende Parameterkennungen besitzen. Das eCCodes-Read-only-Audit fordert `stepType=instant`, `startStep=endStep` (15-min-Takt, keine kumulierte Menge), kg m^-2 s^-1, die vorhandene MID-Native-Bitmap-Logik, die Original-Extrema und explizites Missing-vs.-genuines-Nullsignal. Zeit-/Orts-/Raster-Mischung, beschädigte Datei, leere Folge, falscher Wettercode oder Grid-/GRIB-Drift bleiben **fail-closed**. Keine Sensor-/WMO-/DWD-Warn-Ersatzbehauptung und keine temporal/spatial interpolierten Frames. Der physikalische Engineering-Sanity-Deckel von 1 kg m^-2 s^-1 führt nur zur Zurückweisung extremer oder fehlerhafter Quellen, niemals zu Clip/Glättung.

**Realnachweis-CLI** (erst nach unabhängigem privaten Staging; keine API-Key-/Worker-/Browser-Netzwerkanfrage im Audit):

```bash
python3 tools/ruc/original_15min_phase_gate.py \
  --ir-manifest /sicheres-staging/ir108/manifest.json \
  --rates-manifest /sicheres-staging/gsp-raten/manifest.json
```

Das separate Raten-Manifest hat `schema=mid.dwd.icon-d2-ruc.gsp-phase-15min.shadow.v1`, `run`, `firstValid` und `products` mit exakt zehn `{name,sourceUrl,sha256}`-Einträgen pro `PRR_GSP`/`PRS_GSP`/`PRG_GSP`. Rohdateien sind nur lokal unter `frames/<PRODUCT>/<PT...>.grib2` zulässig. Der bisherige IR10.8-Shadow-Stager wird **nicht** mit zusätzlichen unkontrollierten Produktdownloads erweitert. Die CI führt ausschließlich deterministische negative/positive Offline-Fixtures `test_original_15min_phase_gate.py` aus, niemals echte DWD-Downloads. Kein Code/Asset in `src/`, Worker, RUC-Prozessor oder Pages wird dadurch aktiviert.

**Harte Restgates:** (1) tatsächlicher aktueller 10+30 Original-GRIB-Datensatz, Spektral-, SHA-, eCCodes-, 542040-Zell- und Bitmap-Nachweis am identischen Run; (2) CLAT/CLON-georeferenzierte Darstellung des IR10.8-Brightness-Temperaturbildes mit getrenntem MID-GSP-Momentanphasen-Overlay und korrekter Legende/Quellen- und NoData-Beschriftung, kein WMO-Wettercode; (3) Limit für +0..+120min, Cache-/Browser-Netz-/RAM-Budgets, 320px bis Tablet/Light-Dark und reale iOS-Abnahme; (4) vollständiger Source-/PR-/Review-/Installer-/Worker-/Pages-/Stable-Pfad nach autorisierter Produktentscheidung. **`activationAuthorized=false` bleibt unbedingte Regel.**

Quellen: https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf?nn=344870&view=nasPublication und https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ .


## MID-Karten 1.8 · vollständiger GSP-Quellstager (16.11.2026, QA only)

Die geprüfte `original_15min_phase_gate.py` konnte bisher bereits **30 reale** GSP-Raten-Rohdateien gegen die **10 reale** IR10.8-Bilder desselben Laufs vergleichen, aber noch nicht selbständig alle 30 amtlichen GSP-Originale in ein passendes SHA256-Manifest staged bereitstellen.

Neu: `tools/ruc/stage_original_15min_gsp.py` ist ein **nur manuell aufzurufender, privater Kandidaten-Stager**, kein Worker und kein automatischer RUC-Job. Er liest ausschließlich die drei *amtlichen* DWD-Verzeichnisse `PRR_GSP/PRS_GSP/PRG_GSP` mit derselben angegebenen Modellinitialisierung und prüft **vor dem ersten Binär-Download** die Vollständigkeit aller drei 10-Frame-15-Minuten-Kataloge. Die URL-/Lauf-/Gültigkeits-/Lead-Prüfung verwendet den vorhandenen `original_15min_phase_gate.source_lead`-Schutz. Sämtliche Anfragen gehen an `https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/`; kein Redirect, Auth, Fremdhost oder Querystring ist zulässig. Maximal drei Kataloge à 1 MiB, 30 Originaldateien à 8 MiB, insgesamt 180 MiB, jeweils Timeouts, GRIB-Hüllensignatur, SHA256 sowie fail-closed unvollständige Antworten. Ein misslungener Gesamttransfer wird **atomar verworfen**; ein vorhandener Ausgabeordner wird nie überschrieben. Keine Nutzung in `src/`, Pages, Workern oder bei normalen Nutzern.

**Reproduzierbarer, opt-in Staging-Befehl** nach Wahl eines in den offiziellen Quellkatalogen nachweislich vollständigen DWD-Laufs und eines Viertelstunden-Starttermins (Beispieldaten nur Platzhalter; keine Behauptung eines aktuellen Datenlaufs):

```bash
python3 tools/ruc/ir108_stage_originals.py --run RUN_UTC --first-valid FIRST_UTC --output /privat/ir108
python3 tools/ruc/stage_original_15min_gsp.py --run RUN_UTC --first-valid FIRST_UTC --output /privat/gsp
python3 tools/ruc/original_15min_phase_gate.py --ir-manifest /privat/ir108/manifest.json --rates-manifest /privat/gsp/manifest.json
```

Der dritte Befehl ist der separate **reale** ecCodes-/Bitmap-/Spektral-/40-Originale-Gate. Die beiden Stage-Befehle liefern ausschließlich private Kandidaten, ausdrücklich keine geprüfte Wetterkarte. 30 SHA-geprüfte GSP-Dateien ≠ echte GSP-Datenvalidierung; die Stage-Antwort lautet `originalEcCodesAudited=false`, `matchedIRManifest=false`, `activationAuthorized=false`.

Zusätzliche `tools/ruc/test_stage_original_15min_gsp.py`-Offline-Regressionsfälle decken drei echte Katalogidentitäten, 30-Originale-Budget/Manifest, vollständige Zeiten, fehlende Originale **ohne anschließende Downloads**, falsche Zeiten, Korruption, Redirect, Längenfehler und Symlink/atomare Rücknahme ab. Diese Fixtures sind keine echten heruntergeladenen DWD-GRIBs. Der bestehende gezielte Kartenregressionseinstieg führt sie gemeinsam mit IR10.8- und GSP-Raten-Originaldaten-Gates aus. Keine grüne Produktionsbehauptung ohne echte qualifizierte Ausgangsbytes und vollständige Geräte-/Review-/Release-Prüfungen.

Amtlicher Quellenkatalog: https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ ; WMO/ECMWF-GRIB-Bitmap-Auswertung: https://confluence.ecmwf.int/spaces/UDOC/pages/169541899/What+is+the+GRIB+bitmap+-+ecCodes+GRIB+FAQ .


## Native-Preview 1.8 – Pixel-Originale und festes IR10.8-Brightness-Raster (16.11.2026, SHADOW ONLY)

Der bestehende, SHA-gebundene MID-RUC-Lookup `latest.json`/`lookup.bin` liefert das einzig zugelassene nativ→Kartenpixel-Mapping. Er wird **nicht** durch ein neues geographisches Regridding oder ein zweite Rasterquelle ersetzt. Neuer nur privat/möglichst kurzlebig genutzter Modulpfad: `tools/ruc/ir108_gsp_native_preview.py` und `test_ir108_gsp_native_preview.py`.

Vor jedem Bild ist ein **tatsächlich erfolgreicher** `audit_rate_manifest` aus 10 originalen IR10.8- und 30 originalen GSP-GRIBs mit ecCodes/GRIB-Bitmap/Spektralkanal/UTC/SHA/Einheiten nötig; eine Fixture, Download-Hülle oder Schema-Datei allein erfüllt das Gate nicht. Zusätzlich müssen der originale RUC-`lookup.bin`-SHA und Größen-/Run-/Rasterprüfungen grün sein. Ein IR-/GSP-Datensatz eines anderen Modelllaufs als der `lookup.bin`-Erzeugung wird **nicht** gerendert. Die nativen Originalwerte und Fehlmasken werden unverändert für SHA-/Extremprüfung erhalten. Die vorhandenen `uint32-le`-Lookup-Indizes übernehmen die bisherige source-first Geographie; `0xffffffff` bleibt NoData. Rasterzeilen werden aus dem südorientierten Lookup in ein nordorientiertes PNG umgesetzt, ohne räumliche oder zeitliche Interpolation. Bildgrenzen sind explizite Halbzellkanten, nicht unmarkierte Zentren.

Der private IR10.8-`png-rgba8-north-up`-Preview verwendet **eine über alle zehn Frames feste** lineare Abbildung der synthetischen *Brightness Temperature* von 170–340 K in Grauwerte (cold/high weiß, warm/dunkel); diese feste Skala ist **kein** Wolkenanteil, keine Temperatur in 2 m, keine Satellitenbeobachtung und keine automatische Min/Max-Reskalierung je Frame. Originale Kelvin-Extrema werden nicht geclippt/geglättet, nur ihre **Preview-Farbdarstellung** außerhalb der festen Anzeigegrenzen gesättigt. Die getrennte `zlib-uint8-phase-id-north-up`-Datei enthält ausschließlich interne, noch **nicht** app-weit eingefärbte GSP-Signatur-IDs: **255=fehlende Originaldaten**; **0=belegtes GSP-Nullsignal** (keine meteorologische Entwarnung); 1=Regen, 2=Schnee, 3=Graupel, 4=Mischung. Diese Palette wird **nicht** als UI-Farbvertrag eingeführt. Alle Datenlöcher sind im IR-PNG transparent; fehlende Originaldaten werden nie als meteorologische 0 dargestellt. Die Wetterfarben später ausschließlich aus MID-Parameter-/Niederschlagsphase-CSS-Verträgen verwenden.

Offline-Budget je Frame maximal 2.5 Mio. Kartenzellen, 14 MiB PNG und 14 MiB Phasenraster; 10 Frames sequenziell (keine native 40-Frame-Memory-Wand), serverseitig privates atomar umbenanntes Preview-Verzeichnis mit Einzel-SHA256, absoluter UTC-Gültigkeitszeit, Modelllauf, BBox, nachgewiesenem Lookup-SHA und `activationAuthorized=false`. Der RUC-Snapshot und Quellmanifeste bleiben unverändert; Quellmanifest und Lookup werden vor finalem atomaren Handoff erneut SHA-geprüft. Kein JS/CSS/ImageQuadLayer-/Worker-/Pages-/Installer-/Stable-Produktcode wird geändert.

Für RUC-IR/GSP gilt laut aktuellem DWD Database Reference v2.5.2, Kapitel 11, **0–14 h** im 15-min-Takt. Deshalb ist der bisher zulässige GSP-Lead >14h in `source_lead` und `stage_original_15min_gsp.plan_ten` jetzt ausdrücklich verboten. Der **separat bestehende** IR-Stager bleibt vorerst bewusst unverändert; der kombinierte Renderer kann aufgrund des engeren GSP-Gates keine unzulässigen gemeinsamen Frames >14h anzeigen.

Nach tatsächlich erfolgreicher 40-Original-ecCodes-Qualifikation und einem **zum identischen Run** passenden privaten RUC-Lookup:

```bash
python3 tools/ruc/ir108_gsp_native_preview.py \
 --ruc-source /privat/ruc-original-matched-run \
 --ir-manifest /privat/ir108/manifest.json \
 --gsp-manifest /privat/gsp/manifest.json \
 --output /privat/ir108_gsp_preview
```

**Nicht mit einem produktiven Build/Release gleichsetzen.** Ausstehend: realer 40-Feld-Download/Decode und echte Lauf-/Grib-/Grid-/Extrem-Nachweise, Originaldatensatz-auf-Karte-Inspektion, CSS-token-geführte phasenspezifische Live-Überlagerung, dynamische WebGL-/WebKit-/iOS-/VoiceOver-Performance/Barrierefreiheit und vollständige Source-/Review-/Installer-/Worker-/Pages-/Stable-Gates. Keine Bild- oder Warnungsbehauptung bei nicht belegten Originalframes.
