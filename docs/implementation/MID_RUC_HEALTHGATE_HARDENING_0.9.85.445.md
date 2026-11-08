# MID RUC Healthgate · sichere Diagnoseklassen und Probenjournal

**Untrusted Copilot-Draft-Kandidat · keine Veröffentlichung oder Produktfreigabe.**

## Verifizierte Ausgangsbasis

Live-Prüfung am 07.11.2026, 18:18 UTC: `main` und `mid-stable` zeigen beide auf
`b6526e7c5c24035bd1a75b87b77e7bb8e821c334`; `package.json` und
`MID_BASELINE.json` nennen `0.9.85.445`, passend zum aktuellen Eintrag in
`MID_SOURCE_OF_TRUTH.md`. Die parallelen Drafts #636, #642, #647, #681, #684,
#685, #686 und #687 wurden geprüft. Ihre gelesenen Änderungslisten enthalten
keine der drei Dateien dieses Kandidaten. Das ist keine Freigabe oder Bewertung
ihrer jeweiligen RUC-Arbeit.

## Änderungen

`check_ruc_health.py` stellt diagnostische `RuntimeError`-Unterklassen mit
geschlossenen Fehlercodes bereit: Pages-Konvergenz, Snapshot-/Achsen-/Gitter-/
Member-Vertrag, Worker-HTTP, Worker-Transport, Worker-Nutzlast und Worker-
Adoption. Der CLI-Fehlerpfad gibt nur den Code aus und liefert weiter Exit 2.
Weder fremde Response-Texte noch Header, Bodies oder URLs werden als
Fehlermeldung ausgegeben.

Jede Probe kann einen eigenen HTTP-Status und eine kleine Allowlist
unkritischer Metadaten erfassen. Das Journal enthält UTC-Zeit, Versuch, Phase,
validiertes RUC-Run-Format und einen geschlossenen Diagnosecode; insgesamt
höchstens 64 Einträge. Beobachtbar sind nur ein numerisches `Age`, bekannte
`CF-Cache-Status`-/`X-Cache`-Werte und die grobe Content-Type-Klasse. Diese
Cachewerte sind Beobachtungen, kein Nachweis einer CDN- oder Origin-Ursache.
Metadaten werden aus dem Response desselben Versuchs erfasst, nie global
zwischengespeichert oder dem Folgeversuch zugeordnet.

Für eine Deployment-ID gibt es in diesem Kandidaten keinen Lookup. Eine
Deployment-ID bleibt ausdrücklich `unavailable`; sie wird weder aus einem
Commit-SHA hergeleitet noch durch zusätzliche Tokens oder Rechte beschafft.

## Diagnosegrenzen und unveränderte Fachverträge

Der beobachtete Vorfall vom 07.11.2026 zeigte eine verzögerte öffentliche
Pages-Pointer-Konvergenz nach erfolgreichem Deployment. Ob die Verzögerung am
Edge/CDN oder am Origin entstand, ist nicht belegt. Cache-Header dürfen diese
offene Ursache nicht entscheiden. Ein Rollback bei Pages-Konvergenztimeout
bleibt eine separate offene Produktentscheidung; dieses Update verändert
weder Rollback-Bedingungen noch Rollback-Semantik.

Die verfügbaren Worker-Felder `fullCodec.verified` und
`objectsPresent` belegen nur den im Worker implementierten
Bereitschafts-/Objektlesepfad, nicht isoliert einen Codec-Defekt. Eine
fehlende Vollcodec-Verifikation wird daher als `codec_evidence_unclassified`
gemeldet, nicht als Codec-Fehler. Die Diagnoseklasse für nachgewiesene
Codec-Defekte wird nur dann verwendet werden dürfen, wenn eine künftige
autorisierte Quelle einen solchen Defekt explizit und maschinenprüfbar belegt;
dieser Kandidat erfindet kein zusätzliches Worker-Feld.

Die Pages-Grenze bleibt 12, die Worker-Grenze 7 Probes. Bestehende
Timeouts und Backoff-Folge, Profilwechsel in den gesonderten Legacy-Rollback,
27-h-/14-h-Achsen, Run-/Snapshot-Verträge und Sicherheits-/Rollback-Gates
bleiben unverändert. Es gibt keinen CAS-/Fencing-Umbau. Workflows, Worker,
Pages, Release-Dateien und Versionierung wurden nicht geändert.

## Verifikation dieses Kandidaten

**Lokal PASS:**

- `python tools/ruc/test_ruc_health_check.py` — 9 Regressionen, einschließlich
  Pages 1/7/12, 503, ungültigem JSON, unbrauchbarer Nutzlast, sicherer
  Metadatenzuordnung über zwei Probes, Secret-/URL-/Header-Negativfällen,
  64-Einträge-Limit, Codec-Unterklassifizierung und CLI-Exit 2.
- `PYTHONPATH=tools/ruc python -m unittest tools.ruc.test_workflow_coordination`
  — 3 Tests.
- `PYTHONPATH=tools/ruc python tools/ruc/test_ruc_p4_pages_serialization_contract.py`
  — 6 Tests.
- `PYTHONPATH=tools/ruc python tools/ruc/test_ruc_manual_pages_guard.py`
  — 8 Tests.
- `PYTHONPATH=tools/ruc python tools/ruc/test_restore_ruc_pages_snapshot.py`
  — PASS.
- `PYTHONPATH=tools/ruc python tools/ruc/test_prepared_snapshot.py` — 12 Tests.
- `node scripts/test-ruc-health-convergence-09744.mjs` — PASS.
- `python -m py_compile tools/ruc/check_ruc_health.py tools/ruc/test_ruc_health_check.py`
  und `git diff --check` — PASS.

`tools/ruc/test_legacy_core_rollback.py` ist **BLOCKED**, da `numpy` in dieser
Umgebung nicht installiert ist; es wurde nicht als PASS gewertet. Der aktuelle
GitHub-Run `42400611737` („MID Replit Handoff Gate“) steht auf
`action_required` und hat keine Jobs; die Abfrage ergab keine fehlgeschlagenen
Jobs. Das ist kein vollständiger CI-Nachweis.

Full Gate, Browser/WebGL, iOS/VoiceOver, Worker-, Pages- oder
Produktionsverifikation sind **NOT VERIFIED**. Es erfolgte kein Dispatch,
Merge, Deploy oder Stable-Promotion.

**NO MERGE / NO DEPLOY / NO STABLE PROMOTION.** Unabhängige QA und eine
etwaige selektive Integration bleiben dem autorisierten Integrator vorbehalten.

### MID 18.2.79 · P4 Produktionsvorfall 08.11.2026 als reine negative QA (KEIN Release)

Lesender Originalbefund: Stable/Main `b6526e7c5c24035bd1a75b87b77e7bb8e821c334`, veröffentlichte v0.9.85.445. Prod-Run [#42449728271](https://github.com/MeteoMartini/MID/actions/runs/42449728271) vom 08.11.2026: 12 echte öffentliche Pages-Probes 05:33:43–05:38:18 UTC lieferten trotz Pages-Deploy unverändert 03Z statt erwarteter 04Z; danach trat konservativer Rohdaten-Rollback ein. Folge-Run [#42451702171](https://github.com/MeteoMartini/MID/actions/runs/42451702171) bewies später 04Z komprimiert mit `fullCodec.verified=true`. Dieser Befund ist ein Pages-Pointer-/Konvergenzvorfall, **kein nachgewiesener Codec-Defekt oder gesicherter CDN/Origin-Ursachennachweis**.

Eine zusätzliche **synthetische offline Regressionswiedergabe** prüft genau den 12×-veralteten Pointer mit aktivem Lossless-Profil, erwarteter Run-ID, URL-Parameter-Monotonie und begrenztem Probenjournal. Ein erkennbarer 03Z→04Z-Übergang in Versuch 9 wird positiv akzeptiert; falsches Profil sowie bereits vorauseilender 05Z-Pointer dagegen niemals. Header-Metadaten `Age=42`/`HIT` sind explizit **Testfixture, keine empirischen Produktionsheader**. Bei 12× 03Z muss Fehler `pages_convergence_timeout` bleiben; `codec_defect_proven` darf nicht erfunden werden. Kein URL-/Token-Leck, kein 13. Probeversuch.

Dieser isolierte Test ändert **keine** Produktions-Publisher-, Rollback-, CAS-/Fencing-, Timeout-/Retry-, Worker- oder Pages-Logik und gewährt keine Freigabe. Das unverkürzte 168h-/Original-GRIB-/Client-/P95-Gate bleibt offen. Erst nach unabhängiger echter Deployment-/Pointer-/Header-/Race- und CAS-/Rohsnapshot-Validierung darf über eine alternative Rollbackentscheidung beraten werden. Ursprünglicher #698-Healthgate-Nachweis bleibt separate Quelle; #701 benötigt eine **selektive neue SHA-Übernahme plus vollständig neue kombinierte QA**, falls dieser Test später ins Sammelrelease aufgenommen wird.
