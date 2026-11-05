# MID-C55 · v0.9.85.433 · Fortsetzung und Budgetqualifikation

Status: gesicherter lokaler Kandidat, noch keine Veröffentlichung. UI-Basis: PR #665 @68a29e8af4feb3de30633dbbee305d7a8f77249c (Tree entspricht lokalem3a40ef9bcd315e23771cbde78d74deab72986bb0). Der parallel ausdrücklich beauftragte PostHog-PR #666 ist nach vollständig erfolgreichem Installer42059293729 als .432 veröffentlicht. Neue verifizierte main=mid-stable-Basis218d07bf290b5beff3c0643f3cc61852bab3156f wurde in isolierter Worktree ohne Reset integriert. App-Konflikt semantisch gelöst: beide Telemetrieattribute und neue Mehr-Semantik erhalten; Metadaten aus Stable übernommen und über offizielle Synchronisierung auf .433 angehoben; Pflichtlisten verlustfrei vereinigt (1079 Tests). Externe .432-Changelogs stammen aus der tatsächlichen PostHog-Veröffentlichung, nicht aus dem früheren unveröffentlichten UI-Kandidaten.

## Tatsächliche Budgetursache und enge Korrektur

Vite kopierte zwei unreferenzierte native 1024px-Master zusätzlich aus public ins Web-Dist: mid-app-icon-light-1024.png947058B und mid-app-icon-dark-1024.png884282B. Der iOS-Katalog besitzt jeweils eine bytegleiche native Kopie. Webcode, Manifest, Service Worker und veröffentlichte Texte referenzieren diese Master nicht. Die benötigten Web-/PWA-Icongrößen180/192/512, Favicons, Kompakt-/Wortmarken, Social Card und alle nativen Quellen bleiben unverändert.

Der Vite-Buildhook lässt ausschließlich diese zwei redundanten Dist-Kopien weg. Kein Quell-PNG wird geändert/gelöscht, keine Quantisierung/Skalierung/Kompression, keine Alias-/Rewrite-/CDN-Lösung, keine Kategorie-/Budgetänderung. Die bisher unreferenzierten rohen Master-URLs sind damit kein Bestandteil des neuen Web-Dist; die Originale bleiben im Professional-Quellstand und nativen Asset-Katalog verfügbar. Web-/PWA-Installation verwendet weiterhin die vorhandenen PNGs und keine neue Bildformatsemantik.

Vor irgendeiner Entfernung werden beide Master in public/native/dist exakt verglichen und die erwarteten PNG-Dimensionen1024x1024 geprüft. Webreferenzen in HTML/JS/CSS/JSON/Webmanifest/SVG/Text/Markdown/Maps, gängige dynamische Namensvorlagen, unvollständige Webausgabe, Symlinks, Quell-/Output-Überlappung oder divergierende Kopien stoppen den Build. Die beiden Entfernungen betreffen ausschließlich bereits vollständig validierte generierte Ausgaben. Es gibt keinen produktiven Schalter zum Umgehen der Prüfung.

## Reproduzierbare Nachweise

Node22.16.0, App-/Tooling-TypeScript und Vite8.3.5-Build erfolgreich. 15 echte Datei-/Negativfälle erfolgreich: scripts/test-native-only-web-assets-0985433.mjs. Typisierte Buildhelper-Schnittstelle nativeOnlyWebAssets.d.mts, keine zusätzliche Laufzeitabhängigkeit.

Separater Kontrollbuild derselben .433-Quellen, bei dem ausschließlich der neue Packagingplugin im Testprozess entfernt wurde: alle125 beibehaltenen Webdateien stimmen einzeln per SHA256 und Bytezahl überein. Genau zwei Masterkopien fehlen, zusammen1831340 Rohbytes. Nur die nach Vite separat geschriebene Commit-/Buildidentitätsmetadatei ist ausdrücklich vom A/B-Vergleich ausgenommen. Vollständige Liste: c55-qa/packaging-equivalence-433.json.

Vollständiges unverändertes Budget jetzt grün: totalGzipBytes6894979/8500000B, statische Medien4593259/7000000B. Hauptbundle JS1497393/1500000B, Start-CSS1759965/1760000B. Dateigenauer Report inklusive Größen/Kategorien/SHA256: c55-qa/build-budget-433.json. Grenzen wurden nicht angehoben, Zählerdefinitionen nicht geändert, keine vorhandenen notwendigen Assets ausgespart.

Bestehende Logo-/PNG-Integritäts-, Theme-/PWA-/iOS-Shell-, Medienbudget- und dateigenauen Budgettests erfolgreich. Keine Browser-/iOS-Abnahme aus dem Dateivergleich ableiten. Die vorangegangenen UI-/Core-Nachweise und lokalen rsync-/Chromium-Grenzen bleiben in MID_C55_UI_432_QA.md dokumentiert. Auf frisch promoteter Stable-Basis sind Versions-/Changelog-/Inventarunion, Types/Build, neue Gesamtregression und vollständige reguläre Source-/Installer-/Worker-/Pages-/Finalize-Gates erforderlich. Dieser Checkpoint schaltet keine Source-Freigabe frei.

## Abschließende lokale Qualifikation

Gemeinsame Touchflächen in kompakter Dichte und den vorhandenen Coarse-Pointer-Regeln sowie Ensemble-Portal-Schließen auf44px angehoben. Der historische CSS-Golden bleibt unverändert; zehn exakt einmalige genehmigte Fragmente werden ausschließlich auf der historischen Vergleichskopie rekonstruiert. Veraltete36px-Erwartung im UI-Audittest auf den expliziten44px-Vertrag angehoben. Karten-Ladestatus behält die reale responsive420px-Reservierung; der bestehende echte Browser-Ladetest wird zusätzlich im regulären ersten Heavy-Map-Shard verpflichtend ausgeführt (zehn Breite/Theme-Fälle, kein bisheriger Kartenfall entfällt).

1073 Core-Prüfungen vollständig ausgeführt:1066 zunächst bestanden, sieben Fehler diagnostiziert. Alte36px-Erwartung korrigiert und erfolgreich wiederholt; drei zuvor wegen fehlendem rsync blockierte Installerprüfungen nach isolierter temporärer Bereitstellung des offiziellen Debian-Pakets erfolgreich. Damit1070 unterschiedliche Core-Prüfungen erfolgreich belegt. Drei Chromiumprüfungen bleiben lokal wegen vom Kernel verweigerter Socket-/ptrace-Rechte mit SIGABRT blockiert; kein atomarer finaler grüner Gesamtlauf oder Heavy-/iOS-/VoiceOver-Abnahme behauptet. Pflichtinventar1079 (1073 Core+6 Heavy).

Abschließend Types/Vite/Budget, CSS-Golden, tatsächlicher Touch-Eventharness, SSR-Ladestatus,15 Packaging-Negativ-/Positivfälle,125 bytegleiche A/B-Ausgaben und PostHog-Regressionsprüfung erfolgreich. Reproduzierbarer Kontrollbuild: `node scripts/verify-native-only-web-assets.mjs`. Lokale Prüflogs bleiben Diagnose; die vollständigen regulären Source-/Installer-Gates müssen auf dem endgültigen SHA erneut erfolgreich sein.

Während der finalen Live-Prüfung wurde paralleler #667 (.433 PostHog-Konfigurationsneubau) bereits regulär gemergt; sein Installer42065087192 läuft. Dieser noch unveröffentlichte C55-Kandidat wird vor Freigabe auf dessen frisch promotierte Stable-Basis und eine freie neue Version übernommen. Keine Freigabe von alter Basis.
