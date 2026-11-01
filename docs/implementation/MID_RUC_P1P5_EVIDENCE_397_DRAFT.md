# RUC Data 1.3 – P1/P5 zensierte Evidenz (nur Draft, nicht veröffentlicht)

## Source of Truth
Am 01.11.2026 verifizierte Basis: main=mid-stable v0.9.85.395
`bda6e60d37f2cac31b36e9993f5d6c045355d6ed`, fünf aktive Rulesets.
Keine Änderung an `ruc/latest.json`, 0–27h/20-EPS-Produktion, Worker,
Pages, App, Publisher, Secrets oder Kosten-/Release-Gates.
Parallele Fast-Lane #565, Vollgebiet #567, Design-Release #568 und
bestehende P1/P5-Drafts #542/#546/#554 bleiben unverändert.

## Implementiert
- `tools/ruc/ruc_p1p5_censor_audit.py` wertet die bereits existierenden
  DWD-Verzeichnisbeobachtungen und öffentlichen Pages-/Worker-Readbacks in
  genau 168 UTC-Modelllauf-Slots getrennt aus. Es erzeugt niemals DWD-,
  Modell- oder Produktionsdaten.
- P1 pro Stage `firstAdvertisedField`, 0–6h, 0–14h, 0–27h und
  EPS20: beobachtete obere Erst-Sichtbarkeitsgrenze; bei belegter
  vorheriger Negativprobe zusätzlich untere Grenze und Klammerbreite;
  links-, intervall- und rechtszensierte sowie unbeobachtete Runs
  bleiben getrennt. Verpasste >2×15-Minuten-Polls werden ausgewiesen,
  nicht als Null-Latenz oder DWD-Fehler kodiert.
- EPS20 bleibt unbewiesen, solange keine echte GRIB-Header-/Member-/
  Werteprüfung in der Original-DWD-Quelle vorliegt. Die Verzeichnislisten
  sind kein solcher Beweis.
- P5 erfasst pro tatsächlich gleichlautendem, strukturell validem
  Pages-/Worker-Run die erste **beobachtete** Sichtbarkeit und deren
  Laufalter. Differenzen zu P1 sind **Differenzen zweier Pollzeitpunkte**,
  keine gemessene DWD→Publish-Latenz. Unterschiedliche Sample-Kadenzen
  erlauben negative Differenzen.
- Selbst 168 positive stündliche Directory- und Worker-Samples
  autorisieren keine echte Client-/iOS-/Widget-/Export-E2E-Aussage
  und keine 60-Minuten-P95-Produktionszusage.
- Adversarielle Tests: 168 Run-Slots, alle Zensurtypen, nicht endliche
  Quantile, verpasste Polls, unbekannte bzw. falsche Worker-Stati,
  doppelte/kontradiktorische Proben, UTC-Zeit/Run-Skew und
  fälschlich gemeldete Client-Adoption. Das neue Python-PR-Workflow-Paar
  ist SHA-gebunden, read-only, ohne Secrets/Produktionsschreibrechte.

## Bedienung (auf heruntergeladenen unveränderten Originalartefakten)
```bash
python3 tools/ruc/ruc_p1p5_censor_audit.py \
  --directory dwd-observation-*.jsonl \
  --readbacks ruc-e2e-*.json \
  --ending-at-utc 2026-11-01T09:00:00Z \
  --output ruc-p1p5-audit-UNIQUE.json
python3 tools/ruc/test_ruc_p1p5_censor_audit.py -v
```
Die Ausgabe wird nur neu erstellt, nie überschrieben. Eine Eingabe
aus synthetischen Tests bleibt synthetisch; nur unabhängige, echte
Originalartefakte können den jeweiligen Beobachtungsumfang belegen.

## P3 – echte, aber ungepaarte GitHub-Workflow-Zeiterfassung

Zusätzlich enthält dieser Draft `tools/ruc/ruc_p3_timing_audit.py`
und neun adversarielle Timing-/A/B-Schutztests. Die beiden PR-Only-
Workflow-Spiegel führen jetzt 13 P1/P5- und neun P3-Tests aus.

Die folgenden Zahlen stammen aus *real heruntergeladenen, unveränderten*
GitHub-Actions-Artefakten, nicht aus synthetischen Testdaten:

| RUC-Workflow | Timing-Artefakt | Calculate-Job | Kern-Download + Decode | Prepare-Job | Publish-Job |
| --- | --- | ---: | ---: | ---: | ---: |
| #41281807000 | 13073753263 / 13074451514 | 1.317 s | 1.227,683 s | 503 s | 76 s |
| #41286412886 | 13076506273 / 13075223405 | 4.755 s | 1.074,205 s | 828 s | 54 s |
| #41289813323 | 13076334468 / 13077005980 | übersprungen | kein neuer Download | 50 s | 100 s |

**Auffälligkeit:** Im zweiten Workflow summieren sich die
`calculate`-Schritte nur auf 1.152 s. Gegenüber der ausgewiesenen
Calculate-Jobdauer von 4.755 s bleiben **3.603 s nicht zugeordnet**.
Die neue Prüfung weist diese Differenz explizit als nicht attribuiert
aus; sie ist **weder** als DWD-Wartezeit **noch** als ecCodes-Decoderlast
oder CPU-Verbrauch nachgewiesen. Die Native-Synoptikphase variierte
in den beiden neuen Builds real von 33,802 s auf 378,904 s; auch
diese Varianten sind keine gepaarten SHA-identischen A/B-Daten.
Die Wiederverwendung eines früher validierten Snapshots in
#41289813323 ist keine neue DWD-Datenaufnahme.

Eine belastbare P3-A/B-Freigabe verlangt die *gleichen*
vollständigen GRIB-Rohdaten-SHAs, Run, Felder, Grid und Vertragsversion
mit separat gemessenen Download-, Decode-, CPU-/RAM- und Output-SHAs.
Die vorhandene Qualifikation aus Draft #554 bleibt dazu maßgeblich.

## Offene produktive Abnahmeschritte
1. P1: 168+ echte Stunden inkl. vollständiger nativer DWD-GRIB-/EPS20-
   Header/Werte und tatsächlicher Poll-Slot-Überwachung sammeln.
2. P2: #565 native 0–6h-GRIB-Qualifikation am echten Modelllauf,
   separater authentifizierter Fast-Publisher/Pointer, App-/Widget-/Export-
   Verträge mit konsistentem Run/ValidTime/NoData und echtem Fallback.
3. P3: identische, rohe SHA-gebundene DWD-Inputs für A/B aus #554 mit
   realer Download-/Decoderzeit, CPU/RAM, unverändertem 900-MB-Vertrag.
4. P4: sichere DWD-Produkttrigger, GitHub/Pages-Single-Flight,
   dedupliziert und adversarial gegen Releasewechsel/Races getestet.
5. P5: unabhängige E2E-Messung des tatsächlichen DWD→App-Pfads
   mindestens sieben Tage lang; P50/P90/P95 mit vollständigen
   Lauf-/Verbraucher-Nachweisen. Erst dann SLO-Gate gesondert entscheiden.

Nicht als Ready/Release freigeben. Bei neuer Stable-Promotion zuerst
SHA-/Versions-/Branchkonflikte neu prüfen. Bei späterem vollständigem
Build synchronisierte v0.x.y.z-Spiegel/Changelogs, 1059+
Pflichtregressionen und MID Source-PR-Bot→Server-ZIP→Installer→Worker/
Pages→mid-stable zwingend.
