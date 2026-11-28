# MID .530 – vorbereiteter Karten-Release-Train

Status: PREPARED / DRAFT. Kein Merge- oder Veröffentlichungsnachweis.

## Reihenfolge und Besitz

1. Exklusiver Vorgänger #1041 (.529): vollständige Promotion einschließlich Worker/Pages und Katalog abwarten. Keine konkurrierende Ready-Markierung.
2. Dieser PR #1044 ist der gemeinsame Folge-Owner von #1042 und ausschließlich OPERA-A aus #937. Quellen-Branches und sämtliche bisherige Commits bewahren.
3. Nach Promotion main=mid-stable, vollständige SHAs, package/Baseline/SoT/Verträge, Rulesets, Reviews und parallele PRs erneut prüfen. Bei Drift stoppen und neu qualifizieren.
4. Vollständigen aktuellen Stable-Baum mit dem exakt verifizierten Delta dieses PRs zusammenführen; keinen alten Vollbaum über neuere Reise-/Releaseänderungen schreiben. Fast-forward mit erwarteter Branch-SHA, kein Force-Push. Bei Pfadüberschneidung semantisch prüfen.
5. Erst dann kanonisches MID_RELEASE_TARGET.json setzen: fromVersion 0.9.85.529, toVersion 0.9.85.530, requireSourceOfTruth true. Ziel und Notes erneut gegen tatsächliche Version prüfen. Versionsspiegel ausschließlich durch etablierten Installer.
6. Neue exakte Draft-/SHA-/Review-Prüfung, anschließend genau einen Ready-Kandidaten und vollständiges Source-Gate starten. Keine alten grünen Einzelprüfungen auf neuen HEAD übertragen. SHA-Bot → serverseitiges ZIP → install-mid → Worker/Pages → Stable/Katalog.

## Abnahme und Abschluss

- Saisonpaare: Modell, Lauf, Gültigkeit, Raster und Feldmasken identisch; NoData und echte Null korrekt; Böen echte 1h-Intervalle.
- OPERA: eingefrorene unabhängige LAEA-Referenz und Zellen-/NoData-/Undetect-Parität; Original-Radarfarben und Quellen-/Zeitstatus erhalten. Browser-/Export-/Responsive-Nachweise im exakten Source-Gate lesen, physisches iOS separat.
- Keine Schnee-Produktadmission aus Header-Pilot ableiten; keine gemessene Performanceverbesserung ohne Messung behaupten.
- #1042 erst nach vollständigem Release-/Scope-Nachweis schließen. #937 erhält nur den OPERA-A-Teilnachweis; Viewport-/Satelliten-/Umfeldrest bleibt offen. #1043, #889, #1038, #541 nicht automatisch schließen.
- Gatefehler: bestehender Stable bleibt maßgeblich; Korrektur im gleichen autorisierten Branch. Kein Direktmerge, Bypass oder zweiter Publisher.

## Weitere thematische Queue

P1 #889: eigene GPU-/WebGL-/Post-GC-Abnahme, danach komplexere Overlays. P1 #1043: Overview-Kern benötigt atomare UI-/Originaldatenabnahme. #1038: zusammenhängender Design-Owner, P0 physischer CSS-A/B-Nachweis; #1034/#1035 nicht zusätzlich importieren. #993: nur aktueller selektiver Run-Pinning-QA-Kandidat. #837/#986: gemeinsames Wartungspaket mit synchronen Workflow-Spiegeln und Pin-/Kompatibilitäts-/Security-Prüfung.
