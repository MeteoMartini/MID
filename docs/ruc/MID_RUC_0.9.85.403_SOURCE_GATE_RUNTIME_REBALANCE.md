# MID v0.9.85.403 · Release-Gate: lastverteiltes vollständiges Karten-Browserprofil

## Anlass und echte Nachweise
- Gesicherte Basis: `main=mid-stable` v0.9.85.402, SHA `1888cb97149855aa8d63f74fecad9c4f245ee02d`, vollständig erfolgreiches Release #41325206572.
- Integrationsquelle: PR #588, ursprünglicher HEAD `b56544b8e1a13cf77ee51c4b622682dfd1bc3b49`, originale RUC-P1/P3-Quellen der Drafts #586/#587 unverändert.
- Tatsächlich fehlgeschlagener Source-Gate-Run #41327414903: 10 Pflichtjobs `success`, `Heavy-Regression · heavy-unified-map · 3/3` Job #124910165509 scheitert nach **13 Minuten** wegen des vollen Schritt-Timeouts; danach ist der abschließende Aggregator folgerichtig `failure`. Keine gelockerte Prüfung und kein RUC-Fachfehler.
- Originaler 3/3-Log: alle acht normalen 412/844/1024/1440px-Light-/Dark-MapLibre-Browserfälle bestanden; direkt anschließend startete der unveränderte 20-Zyklen-Memory-Fall `390px light next` um 16:51:33Z und konnte vor 16:52:40Z nicht vollständig fertig werden.
- Unveränderte Quellmatrix: genau 24 Browserfälle (6 Breiten × Light/Dark × Next/Classic); Gruppen 1/3 neun Fälle, 2/3 sieben Fälle, 3/3 acht Fälle. Originale Logs: 1/3 etwa 7:45 Minuten, 2/3 etwa 7:36 Minuten; 3/3 etwa 11:52 Minuten für normale Fälle inklusive Setup. Die Zeiten gelten nur für diesen konkreten GitHub-CI-Lauf, nicht als Performanceversprechen für Nutzergeräte.

## Enger Korrekturumfang
`scripts/map-browser-shards.mjs`: allein das zusätzliche komplette 20-Zyklen-Speicherprofil wird von Gruppe 3/3 in den zeitlich entlasteten 2/3-Job verschoben. Keine Änderungen an `mapBrowserCases`, Fallreihenfolge, Browser-/Karten-Produktionsfunktionen, echten Feldern oder Performance-Assertions.

`scripts/test-regression-sharding-0985171.mjs` und `scripts/test-installer-sharding-0985193.mjs`: Pflichtkontrolle jetzt auf genau einen Memory-Probe-Durchlauf in 2/3. Die vorhandenen Vollständigkeits-, Disjunktheits-, 1059-Regressionen-, Core-/Heavy-/Installer-/Versions- und 20-Zyklen-Assertions bleiben verpflichtend.

**Unveränderte Grenzen:** Exaktes 13-Minuten-Schrittzeitlimit, drei obligatorische Unified-Map-Shards, 24 Browserfälle und das identische 20-Zyklen-Profil; kein `continue-on-error`, Skip oder Retry als Ersatz für reale Abnahme. Keine Produktivfreigabe vor neuem vollständig erfolgreichem Source-PR-Gate, MID SHA-Bot-Merge, serverseitigem ZIP, `install-mid.yml`, Worker/Pages/Finalize und `mid-stable`-Promotion.

**RUC-P1–P5:** Diese operative CI-Korrektur ändert keine DWD-Daten, RUC-Native-27h-/EPS20-/Bitmap-/Missing-/Units-/Akkumulationsgrenzen, keine 900-MB-Grenze und keine RUC-P2-Fast-Lane-/P3-Quantilaktivierung. Echte 168h/P95-, unabhängige 0–6h-Publishing-/CAS-Fencing- und Produktions-A/B-Nachweise bleiben offen.
