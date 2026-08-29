# MID RUC – Cloudflare R2 Einmal-Setup

Stand: v0.9.69.3

## Kosten-/Freigabegate

Der Quellstand aktiviert Cloudflare R2 **nicht** automatisch. Vor `--apply` ist gemäß `MID_COST_GOVERNANCE_CONTRACT.md` eine ausdrückliche Nutzerfreigabe erforderlich. Der Bootstrap akzeptiert Änderungen nur mit `MID_RUC_COST_APPROVED=true`. Ein Custom Domain macht die betreffenden Bucket-Objekte öffentlich erreichbar und besitzt deshalb ein zweites Gate `MID_RUC_PUBLIC_DOMAIN_APPROVED=true`.

## Free-Tier-Dimensionierung (Prüfstand 28.08.2026)

DWD dokumentiert für ICON-D2 und ICON-D2-RUC dasselbe native Gitter mit 542.040 Zellen. Bei 15 ganzen Stunden (0…14) benötigt der unkomprimierte MID-Drahtvertrag ungefähr 195 MB Deterministik, 98 MB EPS-Summary, 325 MB native 20-Member-Niederschläge und rund 2,3 MB Lookup, zusammen etwa 0,62 GB pro Lauf. Vier aufbewahrte Läufe liegen damit grob bei 2,5 GB. Das liegt unter dem am 28.08.2026 geprüften R2-Free-Tier von 10 GB-Monat; die stündlichen Objektmutationen liegen ebenfalls deutlich unter dem enthaltenen Class-A-Kontingent. Class-B-Lesezugriffe bleiben nutzungsabhängig und werden durch `latest`-/Lookup-Cache sowie die EPS-Summary reduziert.

R2 verlangt trotzdem eine Account-Subscription/Checkout und kann bei Überschreitung des Freikontingents abrechnen. Deshalb bleibt die Aktivierung ein ausdrückliches MID-Kostengate.

## Zielarchitektur

`DWD Open Data -> öffentliche GitHub Actions -> ecCodes -> verdichtete RUC/RUC-EPS-Laufobjekte -> privater R2-Bucket -> MID Worker R2 Binding -> gemeinsamer React/Vite-Fachkern (Browser/PWA/iOS)`.

Der Bucket bleibt im Normalbetrieb privat. Der Bootstrap schaltet die Cloudflare-verwaltete `r2.dev`-Öffentlichkeit explizit aus. Ein Custom Domain ist für MID nicht erforderlich. Der Cloudflare Worker dekodiert kein GRIB/BUFR. `latest.json` ist nur ein atomarer Pointer auf unveränderliche Objekte unter `runs/<run>/`. Der normale Forecast liest die voraggregierte `eps-summary.bin`; native 20-Member-Daten werden nur für die passende kurzfristige Event-Ensembleauswertung gelesen.

## Einmalig erforderliche Kontoschritte

1. R2 im Cloudflare-Konto freischalten/abonnieren. **Dies ist das Kosten-Gate.**
2. Einmalig einen Cloudflare-API-Token für den Bootstrap anlegen:
   - `Workers R2 Storage Write` für Bucket, Privatmodus und Lifecycle;
   - zusätzlich `Workers Scripts Read`, falls der Bootstrap die vorhandene Worker-Bindung prüfen soll.
3. GitHub-Secrets setzen:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `MID_RUC_CLOUDFLARE_BOOTSTRAP_TOKEN`
4. GitHub-Variablen für den Einmal-Workflow setzen:
   - `MID_RUC_COST_APPROVED=true`
   - `MID_RUC_CLOUDFLARE_BOOTSTRAP_ENABLED=true`
   - `MID_RUC_R2_BUCKET=mid-ruc-data` (oder anderer gültiger Bucketname)
   - optional `MID_RUC_R2_LOCATION=weur` (leer = Cloudflare-Automatik)
   - `MID_CLOUDFLARE_WORKER_NAME=<bestehender MID-Worker>` für die reine Binding-Prüfung.
5. Den Workflow **MID RUC Cloudflare bootstrap** einmal manuell starten. Er erstellt/verifiziert den Standard-R2-Bucket, deaktiviert `r2.dev`, setzt den 48-h-Lifecycle-Leckschutz und prüft die Worker-Bindung. Er schreibt die vorhandene Worker-Binding-Liste bewusst nicht um.
6. Meldet der Bootstrap `MANUAL GATE`, muss das Binding nicht mehr zwingend manuell im Dashboard ergänzt werden: Nach Einrichtung des automatischen Worker-Deploys kann `MID_RUC_BINDING_AUTO_APPROVED=true` gesetzt werden. Der Deploy liest zuvor die vollständige aktuelle Remote-Binding-Liste, spiegelt nur sicher abbildbare Bindings und ergänzt **`MID_DWD_RUC_DATA` -> <RUC-Bucket>** zusammen mit diesem vollständigen Satz. Bei unbekannten Binding-Typen bricht er fail-closed ab; dann bleibt als Rückfall die einmalige manuelle Dashboard-Bindung bestehen.
7. Für den stündlichen Publisher einen **bucket-spezifischen R2 Object Read & Write** Token anlegen. Cloudflare erlaubt diesen Zugriff auf einzelne Buckets; er kann Objekte lesen, schreiben und listen, benötigt aber keine Bucket-Administration. Access Key ID und Secret Access Key als GitHub-Secrets setzen:
   - `MID_RUC_R2_ACCESS_KEY_ID`
   - `MID_RUC_R2_SECRET_ACCESS_KEY`
8. `MID_RUC_R2_BUCKET` als Repository-Variable setzen. Der Publisher benötigt zusätzlich das bereits gesetzte `CLOUDFLARE_ACCOUNT_ID`.
9. Optional die Repository-Variable `MID_RUC_WORKER_HEALTH_URL=<bestehende Worker-Basis-URL>` setzen. Dann prüft jeder erfolgreiche Publish automatisch, ob der produktive Worker exakt den gerade publizierten Run als `configured:true`, `ready:true`, `fresh:true` mit allen vier Laufobjekten sieht.
10. Zunächst per `workflow_dispatch` einen einzelnen Preprocess-Lauf ausführen. Ohne Health-URL den Worker-Endpunkt `?mode=ruc-health` einmal manuell prüfen.
11. **Erst nach grünem Health-Check** `MID_RUC_PIPELINE_ENABLED=true` setzen. Danach übernimmt der stündliche Zeitplan.
12. Den Bootstrap-Admin-Token anschließend widerrufen oder sicher verwahren, wenn keine weitere Bucket-Administration vorgesehen ist. Der laufende Publisher benötigt ihn nicht.

## Retention / atomare Veröffentlichung

- Jeder Lauf besteht aus `runs/<run>/deterministic.bin`, `eps-summary.bin`, `eps-members.bin` und `lookup.bin`.
- Ein neuer, unvollständiger DWD-Lauf verdrängt den letzten vollständigen Lauf nicht.
- Vor einem großen Upload entfernt der Publisher alte/verwaiste Run-Präfixe, **niemals jedoch den aktuell durch `latest.json` referenzierten Fallback**.
- Laufobjekte werden vollständig hochgeladen und per Remote-Größe geprüft; erst danach wird `latest.json` ersetzt.
- Nach dem Pointerwechsel bleiben die vier neuesten vollständigen Runs erhalten.
- Der 48-h-R2-Lifecycle auf `runs/` ist nur eine zweite Leck-Sicherung für abgebrochene Jobs. Die normale zeitnahe Retention erledigt der Publisher selbst.
- RUC-Läufe älter als vier Stunden gelten im Worker nicht mehr als frisch; in diesem Fall greifen Best Match/ICON-D2 beziehungsweise ICON-D2-EPS.

## Optionales Custom Domain / CDN

Ein Custom Domain ist für MID **nicht erforderlich**; der Worker liest über das private R2-Binding und Byte-Ranges. Das vermeidet eine öffentliche Datenoberfläche. Soll später ausdrücklich eine öffentliche CDN-Domain verwendet werden, sind zusätzlich `CLOUDFLARE_ZONE_ID`, `MID_RUC_CUSTOM_DOMAIN` und `MID_RUC_PUBLIC_DOMAIN_APPROVED=true` nötig. Der Bootstrap setzt dabei TLS >= 1.2. `r2.dev` bleibt unabhängig davon deaktiviert.

## GitHub-Actions-Vertrag

Die Pipeline bleibt über `vars.MID_RUC_PIPELINE_ENABLED == 'true'` ausgeschaltet, bis der Einmal-Setup und der Health-Smoke-Test abgeschlossen sind. Pro Stunde wird der jüngste **gemeinsame vollständige** RUC/RUC-EPS-Lauf gesucht. Ist der neueste Lauf unvollständig, werden ältere gemeinsame Kandidaten versucht. Erst nach vollständigem Build und Upload aller vier laufbezogenen Binärdateien wird `latest.json` ersetzt.
