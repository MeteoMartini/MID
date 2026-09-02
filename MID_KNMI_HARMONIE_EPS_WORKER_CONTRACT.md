# MID KNMI HARMONIE EPS Worker Contract

Stand: v0.9.77.22

## Ziel

Die produktive KNMI-HARMONIE-AROME-Cy43-P4a-Strecke verwendet genau den seit v0.9.77.18 geschützten TAR-Indexcache. Es existiert kein zweiter Listing-, Index- oder Vollarchivpfad.

## Kanonischer Ablauf

1. Der gemeinsame MID-Worker listet `harmonie_arome_cy43_p4a` Version `1.0` über die KNMI Open Data API; das Listing wird im Isolate fünf Minuten zwischengespeichert, um unnötiges Polling zu vermeiden.
2. Es werden sechs neueste Stundenarchive herangezogen. Für jedes Archiv wird die kurzlebige Download-URL erst bei Bedarf angefordert.
3. Der TAR-Index kommt aus `cache:knmi-eps:tar-index:v1:`; nur bei einem echten Miss wird er über strikte HTTP-206-Header-Ranges aufgebaut.
4. Die sechs Initialisierungen müssen stündlich lückenlos sein. Fehlt eine Stunde, wird kein scheinbar vollständiges 30-Member-Ensemble erzeugt.
5. Neuester Batch = Member 1–5, danach 6–10 bis 26–30. Diese Nummern werden **nur im Laufzeitmanifest** vergeben, nie im persistenten TAR-Index.
6. Die Leads älterer Batches werden auf die neueste Initialisierung verschoben: `validLead = lokaler Lead − Alter in Stunden`. Der gemeinsame Vollensemble-Horizont ist 0–54 h.
7. Benötigte TAR-Einträge werden in Sparse-Multi-Range-Pakete mit maximal 16 Teilen gruppiert. Zwischenräume und Vollarchive dürfen nicht angefordert werden.
8. Der konfigurierte HTTPS-Punktdecoder erhält `mid.knmi.harmonie-eps.point-decode-request.v1` per POST. Er darf die KNMI-Dateiliste und den TAR-Index nicht selbst erneut aufbauen.

## Decodergrenze

Der langjährige MID-Vertrag bleibt unverändert: Der Cloudflare Worker enthält **keinen GRIB-, BUFR-, eccodes- oder wgrib-Decoder**. Punktdekodierung erfolgt außerhalb des Workers. Dadurch bleiben Worker-Größe, CPU-Zeit und Kosten kontrollierbar.

Der Decoder darf kurzlebige signed KNMI-URLs nur für die im Manifest definierten Byte-Ranges verwenden. Diese URLs dürfen nicht persistiert, in KV geschrieben oder geloggt werden.

## Konfiguration

- `MID_KNMI_API_KEY`: KNMI Open Data API; Worker-Secret. Der bestehende Key kann zugleich für KNMI-Aviation dienen.
- `MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT`: HTTPS-Decoderendpunkt.
- `MID_KNMI_HARMONIE_EPS_POINT_TOKEN`: optionales Bearer-Token für diesen Decoder.
- `MID_PUSH_SUBSCRIPTIONS`: bestehendes KV-Binding für den getrennten TAR-Indexpräfix; keine neue Cloudflare-Ressource.

Sind API-Key und Decoder vorhanden, verwendet `ensemble-proxy` den produktiven Rolling-Manifest-Pfad. Fehlt einer davon, bleibt die Quelle fail-open; vorhandene Ensemblefamilien werden nicht blockiert.

## Sicherheit und Kosten

- KNMI-Key niemals im Frontend oder Decoderrequest.
- signed URLs niemals persistent speichern.
- keine neue kostenpflichtige Infrastruktur automatisch aktivieren.
- kein neuer GitHub-Testworkflow.
- vorhandener gestagter Worker-Auto-Deploy bleibt der einzige Deploymentpfad.

## Pflichtregression

`scripts/test-knmi-eps-worker-binding-097719.mjs`
## Referenzdecoder ab v0.9.77.22

`tools/knmi_eps_decoder/` ist die kanonische externe Implementierung der Decodergrenze. Der Worker-Vertrag selbst bleibt unverändert: Listing, temporäre URL, TAR-Index, 6×5-Rolling-Zuordnung und Range-Manifest entstehen im Worker; der Decoder führt ausschließlich die numerische GRIB1-Punktdekodierung aus. Der Decoder ist in v0.9.77.22 nur als Quell-/Containerpaket vorbereitet und wird nicht automatisch gehostet oder aktiviert.

