# MID v0.9.77.18 – KNMI HARMONIE EPS produktiver Cache

## Anlass

Der erste der vier noch verbleibenden Hauptabschnitte bindet den vorbereiteten KNMI-HARMONIE-EPS-Pfad an einen produktiven, wiederverwendbaren Cache. Entscheidend war, zunächst die tatsächlich vorhandenen Worker-/KV-Verträge zu lokalisieren und **keinen parallelen Testworkflow oder eine neue Cloudflare-Ressource** zu erzeugen.

## Vorhandener Produktionsvertrag

Die Bestandsaufnahme ergab:

- der MID-Worker besitzt bereits das KV-Binding `MID_PUSH_SUBSCRIPTIONS`,
- der Push-Scheduler listet ausschließlich Keys mit `sub:`-Präfix,
- `tools/cloudflare/prepare_worker_deploy.mjs` spiegelt vorhandene KV-Bindings im sicheren Auto-Deploy verlustfrei,
- `install-mid.yml` besitzt bereits das gestagte 0-%-Smoke-/100-%-Promote-/Rollback-Gate.

Der KNMI-Cache verwendet deshalb dieselbe vorhandene KV-Ressource mit einem strikt getrennten Cache-Präfix. Ein neuer Workflow oder ein neues Cloudflare-Namespace ist weder technisch erforderlich noch unter der Kosten-Governance zulässig.

## Umsetzung

### 1. Eigenes Worker-Modul

Neu: `worker-src/05-knmi-eps-cache.js`.

Das Modul wird vor den Radar-/Modellfragmenten in das kanonische Worker-Aggregat aufgenommen und exportiert die Cache-/Index-Helfer für die folgende produktive Worker-Anbindung.

### 2. Persistenter TAR-Index

Für jedes KNMI-P4a-Stundenarchiv entsteht höchstens ein kompakter Index mit:

- Dateiname,
- Datenoffset,
- Byte-Länge,
- gepaddeter TAR-Länge,
- Forecast-Lead,
- Initialisierungszeit.

Der Indexbau fordert nur die jeweils 512 Byte großen TAR-Header an und springt anhand der im Header enthaltenen Dateigröße zum nächsten Header. Rohdateiinhalte werden beim Indexbau nicht geladen.

### 3. KV- und Memory-Cache

- Binding: bestehendes `MID_PUSH_SUBSCRIPTIONS`.
- Prefix: `cache:knmi-eps:tar-index:v1:`.
- persistente TTL: 72 h.
- Worker-Isolate-Memory-TTL: 10 min.
- identische parallele Misses werden innerhalb eines Isolates dedupliziert.
- der Cache verwendet kein `KV.list()`.

### 4. Rolling-Member-Korrektheit

Die Membernummern 1–30 sind **keine Eigenschaft einer einzelnen Stunden-TAR**, sondern ergeben sich erst aus ihrer jeweiligen Position im rollierenden Sechs-Startzeiten-Verbund. Deshalb werden Membernummern nicht im langlebigen Archivindex persistiert und sind nicht Teil des Cachekeys. Dieselbe TAR kann dadurch bei späterer Rolling-Zuordnung korrekt mit einer anderen 5er-Membergruppe wiederverwendet werden.

### 5. Sparse-/Multi-Range-Packing

Bekannte Bytebereiche werden ohne Zwischenraum-Overfetch zu HTTP-Multi-Range-Headers gepackt:

- maximal 16 Range-Teile je Request,
- überlappende Bereiche werden zusammengeführt,
- keine vollständigen TAR-/GRIB-Downloads,
- 30 disjunkte Memberbereiche ergeben im Regressionstest zwei Pakete mit 16 + 14 Teilen.

### 6. Health / Diagnose

Neu: `?mode=knmi-eps-cache-health`.

Der Endpunkt meldet unter anderem:

- ob der persistente Cache konfiguriert ist,
- welches bestehende Binding verwendet wird,
- Prefix und TTL,
- Range-Packing-Vertrag,
- Push-Namespace-Isolation.

`?mode=health` führt den produktiven KNMI-HARMONIE-EPS-Cache zusätzlich als Dienst/Provider.

## Keine neue Infrastruktur

Nicht hinzugefügt wurden:

- kein neues KV-Namespace,
- kein R2-Bucket,
- kein separater Cache-Service,
- kein neuer GitHub-Workflow,
- keine Zugangsdaten oder kostenpflichtigen Dienste.

## Abgrenzung

Dieser Stand implementiert bewusst **noch nicht** die komplette KNMI-API-/GRIB-Punktdatenstrecke. Der nächste Hauptabschnitt `Worker-Anbindung` muss den jetzt geschützten Produktivcache konsumieren und dort die sechs Rolling-Starts, die jeweils gültige Membergruppe, die benötigten Leads/Felder und die Punktdekodierung anbinden.

## Regression

Neue Pflichtregression: `scripts/test-knmi-eps-productive-cache-097718.mjs`.

Zusätzlich bleiben Worker-Auto-Deploy, KV-Operationsbudget, amtlicher Beobachtungs-/Ensemblevertrag, Modellquellenvertrag, Versionsschema und Release-Lineage geschützt.

## Worker

Es wurde funktionale Worker-Logik ergänzt. Daher ist der Worker dieses Releases fachlich geändert.

**Worker-Upload/Worker-Deploy erforderlich: ja.**

Dabei ist **keine neue Cloudflare-Bindung und keine manuelle Ressourcenanlage** erforderlich; das bereits vorhandene `MID_PUSH_SUBSCRIPTIONS`-Binding wird wiederverwendet.
