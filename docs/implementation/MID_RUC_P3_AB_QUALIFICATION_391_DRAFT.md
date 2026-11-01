# MID RUC #541 – P3 A/B-Qualifikation, ausschließlich Draft

Basis: freigegebener \`mid-stable\`-Commit \`79b3a8cb995f780c863d6f4b1762155f80e09a15\`, v0.9.85.391, geprüft am 01.11.2026. Fünf aktive Rulesets. Alle Fach- und Release-Verträge bleiben verbindlich.

## Zweck und Umfang
\`tools/ruc/ruc_p3_ab_qualification.py\` vergleicht zwei unabhängig verifizierte, gleichartige **beobachtete** RUC-A/B-Berechnungsläufe. Er verlangt identische DWD-Run-ID, Source-Tree-, GRIB-Eingabeinventar-, Vertrag-, Native-Grid-, Ausgabeinventar-Hashes und physische Bytes (unter 900 MB), exakt 28 stündliche Zieltermine und 20 EPS-Mitglieder. Acht unabhängige GRIB/Bitmap/NoData-/Einheiten-/Zeit-/Decoder-/Atomizitätsprüfungen müssen als echte Claims vorliegen. Phasendauern für Download, Decode, Seal und Prepare müssen endlich, strikt positiv und vollständig sein; unbekannte Messungen sind keine Nullen. Fehlende oder doppelte A/B-Paare blockieren die Auswertung. Output: P50-/P95-Verhältnisse und phasenweise Differenzen der eingereichten Messungen. Die Zahl tatsächlich paarig beobachteter Stunden wird getrennt vom Zeitspanne-Kalender und fehlenden Stunden berichtet (Missing niemals als volle Abdeckung). P95 bei weniger als 20 Paaren ist nur deskriptiv gekennzeichnet.

**Nicht belegt:** Die JSON-Belege sind nur fremdgelieferte Claims, nicht kryptografisch signierte/aus GitHub unveränderlich authentifizierte Producer-Beweise. Ein erfolgreicher Vergleich ist **kein** Nachweis eines echten DWD-Download-/Worker-/Pages-/Client-Laufs, kein sicherer Geschwindigkeitsgewinn und kein RUC-SLO. \`publicationAuthorized\`, \`productionSloAuthorized\` und \`sourceReceiptsIndependentlyVerified\` sind deshalb strikt \`false\`.

## Erforderliche Folgeschritte P3
1. Baseline und Kandidat aus **identischem, SHA-verifiziertem** DWD-GRIB-Satz getrennt real ausführen, nicht aus verschiedenen DWD-Zyklen; native Raster-Koordinaten, echte NoData-/Bitmap-, Einheiten- und EPS20-Werte unverändert halten.
2. Authentisierte Artefakt-Digests, Quellen-SHAs, GitHub-Job-Zeiten, Peak-RAM/CPU und 900-MB-Gesamtbudget extern prüfen, nicht nur die selbst gemeldeten Receipts akzeptieren.
3. Bei Cache-Wiederverwendung immer File-Byte-SHA + vollständigen Modell-/Grid-/Zeit-/Feldvertrag prüfen; kein blindes \`exists\` / \`size>100\` als Cache-Vertrauensbeweis.
4. Nach einer echten Optimierung die gesamte bestehende numerische und physikalische Pipeline inkl. Python/JS/Worker/Pages-/App-/Widget-/Export-Nachweis unverändert durchlaufen. Keinen Test oder Release-Gate überspringen.

## P1/P2/P4/P5-Abhängigkeiten
- P1: 168+ echte, intervallzensierte DWD-GRIB-/EPS20-/Pages-/Worker-Proben fehlen. Verzeichnisse und Poll-Obergrenzen sind keine offizielle Erstpublikationszeit.
- P2: Fast-Lane-Drafts #542/#551 bleiben separat, inaktiv. Kein neuer Fast-Pointer oder Consumer-Routing in diesem PR.
- P4: Parallelisierung oder datengetriebener Dispatch erst nach nachgewiesenem gemeinsamen Single-Flight/Idempotenz-/Race-Gate; bestehende Security-Blocker nicht umgehen.
- P5: End-to-End-P95 <60 min und physische App-/Widget-/Export-Adoption erst nach echter mehrtägiger Messreihe und freigegebenem Dual-Read-Rollback qualifizieren.

## Tests und Release
Lokal \`python -m unittest -v test_ruc_p3_ab_qualification.py\`: **10/10 erfolgreich**. Das ist eine gezielte Offline-Prüfung ohne echte DWD-/GRIB-Dateien oder GitHub-Release-Gates. Draft erhält keine Versionshebung, keinen automatischen Merge und keinen produktiven Publisher. Vor Integration neue Stable-SHA-/Versions-/Vertrags-/Parallel-PR-Prüfung, Versionsspiegel und alle 1.059 Pflichtregressionen; der allein zulässige Freigabepfad ist Source-PR-Gate → SHA-Bot → Server-ZIP → Installer → Worker/Pages → Stable-Promotion.
