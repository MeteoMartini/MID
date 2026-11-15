# MID Design/Karten – MapLibre-Layer-Reorder-Batching (QA-Draft · 15.11.2026)

## Ausgangspunkt und Source of Truth

Live-Verifikation vor Änderungen: `main=mid-stable=c9fadfcd0969e949a92f414b321627dd3d4fb0cc`, Version `0.9.85.483`, `AGENTS.md`, `MID_BASELINE.json`, `MID_SOURCE_OF_TRUTH.md`, `contracts/index.json`, fünf Rulesets. Der bestehende Leitchat-Releasekandidat [#828](https://github.com/MeteoMartini/MID/pull/828) führt v0.9.85.484 bereits als Draft zusammen und enthält sämtliche 12 Karten-/Umfeld-Arbeiten aus #825. Deren Dateien werden hier **nicht** erneut verändert.

## Beobachteter Engpass

In `src/MapLibreCore.tsx` ruft `registerMapLayerOrder` bei **jeder** synchronen Layer-Anmeldung `queueMicrotask(()=>applyLayerOrder(map))` auf. `applyLayerOrder` iteriert dabei über **die gesamte registrierte Layerliste** und führt `map.moveLayer` für jedes vorhandene Layer aus. Beispiel einer synchrone Karteninitialisierung mit 50 Layern: bislang 50 registrierte Mikroaufgaben und theoretisch bis zu 2500 Move-Aufrufe statt eines Layerdurchlaufs. Das ist ein algorithmischer Vergleich, **kein gemessener Laufzeitgewinn**.

Die offizielle MapLibre-Performance-Dokumentation rät, bei komplexen Kartendarstellungen Layer-/Quellenoperationen zu minimieren und Repaints durch unnötige Strukturänderungen zu vermeiden:
- https://maplibre.org/maplibre-gl-js/docs/guides/large-data/
- https://maplibre.org/maplibre-gl-js/docs/API/classes/ImageSource/

## Isolierter Fix

`src/mapLayerOrderScheduler.ts` hält ein `WeakSet` wartender Karteninstanzen. Jede Karteninstanz erhält höchstens **einen** anstehenden Microtask-Flusher, unabhängig davon, wie viele Referenz-/Wetter-/Beschriftungs-Layer im selben JavaScript-Turn registriert werden. Das Callback fragt beim tatsächlichen Flush das **aktuelle** `orderedLayers`-Register ab; spätere Registrierungen, Z-Index-Änderungen und zwischenzeitlich entfernte Layers werden nicht auf einem früheren Snapshot eingefroren.

Die ursprüngliche numerische Z-Index-Sortierung, `map.moveLayer`, vorhandene Source-/Layer-IDs und die Wetterbild-Puffer- und Fade-Implementierung bleiben vollständig unverändert. Es gibt keinen zusätzlichen Browser-Fetch, Worker, Timeout, Timer in Millisekunden, Interpolationsmodus, Cloud- oder SigWx-Wertepfad und keinen zusätzlichen Karten-Control.

`tests/unit/map-layer-order-batch-qa.test.ts` prüft:
- 50 synchrone Anmeldungen → exakt ein Flush mit vollständigem letztem Register;
- zwei Karteninstanzen → unabhängige Flushes;
- neuer Eventloop-Turn → weiterhin spätere Neuordnung;
- Entfernen/Neureihen vor Flush → letztes Register gewinnt;
- Source-Kopplung an die vorhandene MID-Ordnung und unveränderte Registrierungs-/Unregistrierungspfade.

## Zusätzlich: Bewegungsreduktion beim Kartensprung

Die MID-Komponente `MapCenter` hatte beim optionalen `fly`-Wechsel `map.flyTo({…, duration:650, essential:true})` gesetzt. Laut aktueller offizieller MapLibre-API verhindert `essential:true` **ausdrücklich** die Betriebssystempräferenz `prefers-reduced-motion`. Bei MID ist der kamerageführte Flug keine fachlich notwendige Datendarstellung, sondern eine Komfortanimation. Daher entfernt dieser QA-Patch ausschließlich `essential:true`. Für normale Einstellungen bleibt `flyTo` bei 650 ms unverändert; bei reduzierter Bewegung lässt MapLibre die Animation automatisch aus und führt den Zielpositionswechsel entsprechend `jumpTo` aus. `fly=false` bleibt exakt `jumpTo`. Dadurch keine zusätzliche Einstellung oder neue Karte.

Quellen:
- https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
- https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/AnimationOptions/
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions

Anmerkung: Das W3C-Kriterium 2.3.3 für Animation durch Interaktion liegt auf **Stufe AAA**, nicht AA. Die Korrektur verbessert die Rücksicht auf Bewegungsempfindlichkeit über das MID-AA-Ziel hinaus, ersetzt aber keine reale iOS-/VoiceOver-Prüfung.

## Risiken und Release-Gates

Auch bei bestandenen reinen Scheduler-Unit-Tests ist ein durchgängiger Browser-/GPU-/MapLibre-Profilvergleich Pflicht: Map/Umfeldwetter, Radar/WMS/HTML-Marker, Isolinien, Warnung/Legende, Z-Index über mehrere Modell-/Stilwechsel, 320/390/430px + Tablet hoch/quer + Desktop, Light/Dark, Zoom/Fokus und WebGL-Kontextverlust. Abweichende Interaktionen oder verdeckte Wetterwarnungen sind Stop-Kriterien.

**Kein Schutz-Bypass:** Der Fix wird isoliert auf einem autorisierten `chatgpt/*`-Branch ab geprüfter Stable-Basis als Draft eingereicht. Kein Merge oder Release; bei späterer Integration neuen Stable-Stand und #828 neu prüfen, dann volle Source-/Core-/Heavy-/Installer-/Worker-/Pages-/Stable-Promotion-Gates. Keine behauptete iOS-/VoiceOver-Abnahme.

## SHA-gebundener Leitchat-Intake

Die hier vorgestellten vier ursprünglichen Quell-/QA-Pfade aus #830 @ `98387916d0dd3a2e93ac01d0a424c560fa603dc4` wurden nach erneutem Abgleich des unveränderten Stable `c9fadfcd0969e949a92f414b321627dd3d4fb0cc` selektiv in den bestehenden v0.9.85.484-Draft-Train #828 aufgenommen. Der Branch #830 bleibt separat und wurde nicht gemergt. Dieses Dokument enthält nur die Integrationsannotation zusätzlich zur Originalprüfung; die produktiven MapLibre-/Scheduler-/Testdateien bleiben SHA-identisch. Ein früher als .485 betitelter Spezial-Draft erzeugt dadurch keinen separaten Build. Der kombinierte Source-/Security-/Browser-/Installer-/Worker-/Pages-/Stable-Gate-Nachweis fehlt bis zur echten vollständigen Abnahme weiterhin.
