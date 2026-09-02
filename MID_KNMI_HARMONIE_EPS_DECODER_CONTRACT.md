# MID KNMI HARMONIE EPS Point Decoder Contract

Stand: v0.9.77.22

## Zweck

Der Punktdecoder ist der **dritte von vier** verbleibenden Produktionsabschnitten für die direkte KNMI-HARMONIE-AROME-Cy43-P4a-Ensembleintegration. Er liegt bewusst außerhalb des Cloudflare Workers. Der Worker bleibt Eigentümer von KNMI-Listing, Signed-URL-Anforderung, persistentem TAR-Index, 6×5-Rolling-Member-Zuordnung und Sparse-Range-Manifest.

## Eingangsvertrag

Der Decoder akzeptiert ausschließlich HTTP POST mit Schema `mid.knmi.harmonie-eps.point-decode-request.v1` und Modell `knmi_harmonie_arome_cy43_eps`. Das Manifest muss `mid.knmi.harmonie-eps.rolling-manifest.v1` entsprechen, genau sechs stündliche Archive und die kanonische Memberfolge 1–5, 6–10, …, 26–30 enthalten. Der gemeinsame Horizont bleibt auf 1–54 h begrenzt.

Der Decoder darf **kein eigenes KNMI-Listing, keinen eigenen TAR-Index und keinen Vollarchiv-Fallback** erzeugen. Er nutzt ausschließlich die vom Worker gelieferten Bytebereiche; Downloadantworten müssen HTTP 206 liefern. Große Worker-Pakete dürfen ausschließlich an diesen bereits vorgegebenen Range-Grenzen in kleinere 206-Anfragen geteilt werden, um den Arbeitsspeicher pro Antwort zu begrenzen; neue Bytebereiche, Zwischenräume oder Overfetch sind unzulässig. Signed URLs werden auf freigegebene HTTPS-Hosts begrenzt und weder geloggt noch persistent gespeichert.

## KNMI-P4a-Dekodierung

P4a wird als GRIB1 dekodiert. Für MID werden zunächst folgende veröffentlichte Felder genutzt:

- 2-m-Temperatur: Code 11, LevelType 105, Level 2, TRI 0; Ausgabe °C.
- Regen: Code 181, LevelType 105, Level 0, TRI 4; Ausgabe mm.
- 10-m-Wind: Codes 33/34, LevelType 105, Level 10, TRI 0; Betrag in kt.
- Böen: Codes 162/163, LevelType 105, Level 10, TRI 2; Betrag in kt.

Sonnenscheindauer wird nicht synthetisch aus anderen Feldern erzeugt. Fehlende optionale Memberfelder bleiben fehlend und werden vom bestehenden success-driven Ensemblepfad behandelt.

## Rolling-Niederschlag

Akkumulierter P4a-Niederschlag wird pro rollierendem 5er-Batch am **ersten gemeinsamen Gültigkeitszeitpunkt** als Baseline behandelt. Dieser Wert wird nicht als Stundenmenge ausgegeben; nachfolgende Stundenmengen entstehen aus nichtnegativen Differenzen der kumulierten Folgewerte. Dadurch werden die unterschiedlichen Initialisierungszeiten der sechs Batches nicht als künstlicher Niederschlagsoffset in das 30-Member-Ensemble übernommen.

## Ausgabe und Cache

Die Antwort ist Open-Meteo-ähnlich und verwendet `_member01` bis `_member30`. Temperatur ist die Mitgliedererkennung; Regen, Wind und Böen werden ergänzt, soweit dekodierbar. Ein kurzer Prozesscache darf nur numerische Punktresultate anhand von Lauf, gerundetem Punkt, Horizont und Variablen enthalten. Signed URLs gehören weder in Cache-Schlüssel noch Cachewert.

## Betrieb und Kosten

`tools/knmi_eps_decoder/` enthält Referenzimplementierung, Selftest, `requirements.txt` und Dockerfile. **v0.9.77.22 aktiviert kein Hosting und keine neue Cloudflare-Ressource.** Abschnitt 4/4 ist die reale End-to-End-Aktivierung und Verifikation. Ein kostenpflichtiger VPS-, Container- oder Serverless-Tarif ist ohne vorherige Kostenangabe und ausdrückliche Nutzerfreigabe unzulässig.

## Pflichtregression

`scripts/test-knmi-eps-point-decoder-097722.mjs`
## Aktivierungs-Gate v0.9.77.23

Die reale Runtime-Aktivierung ist in `MID_KNMI_HARMONIE_EPS_ACTIVATION_AUDIT_0.9.77.23.md` geprüft. Der Referenzdecoder bleibt bis zu einem kompatiblen kostenfreien Runtimepfad, einem validierten Wasm-/JS-Decoder oder ausdrücklicher Kostenfreigabe unaktiviert. Ein kostenpflichtiger Cloudflare-Container darf nicht automatisch provisioniert werden.
## Kostenfreier Wasm-/Queue-Prototyp ab v0.9.77.23

`MID_KNMI_HARMONIE_EPS_WASM_FEASIBILITY_0.9.77.23.md` ergänzt das Aktivierungs-Gate. Ein fokussierter ecCodes-Wasm32/MEMFS/Nearest-Point-Build darf als Forschungsprototyp untersucht werden. Falls dessen Decode-CPU das synchrone Workers-Free-Limit überschreitet, darf anschließend ein asynchroner Free-Queue-Consumer als Quelle eines numerischen Punktcaches geprüft werden. **Weder Wasm-Produktionsdependency noch Queue-Ressource sind damit freigegeben oder aktiviert.** Python/ecCodes bleibt bis zur numerischen Gegenprüfung die Referenz.


## Wasm32-In-Memory-Prototyp v0.9.77.24

`tools/knmi_eps_wasm_prototype/` ist ausschließlich ein Forschungsprototyp für Abschnitt 4/4. Er darf den Python/ecCodes-Referenzdecoder erst ersetzen, wenn ein realer P4a-Build numerisch gegen diesen Referenzpfad bestanden hat. Verbindlich sind: wasm32, ecCodes 2.48.1, `ENABLE_MEMFS=ON`, keine NODEFS-/Hostdateiabhängigkeit, keine Vollgitterübertragung nach JavaScript und die native `codes_grib_nearest_find`-Punktabfrage aus einer bereits getrennten In-Memory-GRIB1-Nachricht. Infrastrukturaktivierung bleibt gesperrt.
