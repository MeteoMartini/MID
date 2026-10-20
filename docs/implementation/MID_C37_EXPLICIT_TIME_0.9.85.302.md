# MID-C37 · Explizite Zeitpunkte · v0.9.85.302

Basis: main=mid-stable=f17226dea646193a43c78e29198886d7f3601254 (.301), Installer 39391396433 erfolgreich. Keine Überschneidung mit dem read-only RUC-Canary #425.

## Belegter Fehler und enge Korrektur

`localIsoEpoch` und `localIsoToEpoch` parsten bisher nur den führenden Kalender-/Uhrzeitteil. Ein vorhandenes `Z` oder `±HH:MM` wurde ignoriert. Besonders die beiden expliziten Berliner `02:30+02:00` und `02:30+01:00` müssen genau eine Stunde auseinanderliegen. Ein Display-Test auf unverändertem .301 scheitert um 3.600.000 ms. Die neue Regression wurde vor der Korrektur rot ausgeführt; ein davor liegender Testharness-Importfehler wurde separat behoben und nicht als Produktfehler gewertet.

Ein gemeinsamer kleiner Helper erkennt explizite ISO-Zeitpunkte. Beide Parser verwenden dann den absoluten Zeitpunkt einschließlich Millisekunden und ignorieren eine widersprechende Kontextzeitzone. Ungültige explizite Suffixe liefern NaN, niemals eine stillschweigende Ersatz-Ortszeit. Offsetlose Eingaben behalten die bestehende IANA-/Fixoffset-Semantik. Kanonisches Weather-Fragment und generiertes Aggregat werden gemeinsam synchronisiert.

## Umfang und Restarbeit

Keine Provider-, Modell-, Warn-, Niederschlags-, Cache- oder Tagesproduktmigration. Der von Context7/Anbieterdokumentation bestätigte Open-Meteo-Fixoffset über DST hinweg ist ein anderer Fehler und bleibt offen: Für dessen Korrektur müssen Stunden/Minutely/Current, Ensemble/Modelle, Fallbacks, Cacheprovenienz und echte lokale Tages-Akkumulationsgrenzen zusammen migriert werden. Nutzerlokale Eventzeiten dürfen dabei nicht global als Provider-Fixoffset interpretiert werden. #374/#405 bleiben offen.

## Prüfungen und Freigabe

Neue dynamische Pflichtregression deckt beide tatsächlichen Parser und Lokal-/Zulu-Darstellung ab; bestehende DST-/Solar-/Niederschlags-/Event-/Widget-Tests bleiben erhalten. Vollständiger Build, Regressionen, Audit und SHA-gebundene Remote-Gates werden separat nach tatsächlich abgeschlossenem Ergebnis dokumentiert. Keine physische iOS-/WKWebView-/VoiceOver-Abnahme; kein neues UI-Layout. Veröffentlichung nur über den bestehenden MID-Releaseakteur und Installer.

Lokaler Nachweis am 20.10.2026: eigener reproduzierbarer npm-ci-Stand (202 Pakete, .301-Basis; nur Versionsspiegel im Lockfile geändert), Produktionsbuild und beide TypeScript-Projekte erfolgreich; Worker-Syntax erfolgreich. Finale vollständige Regression 1005/1005, 124,7 s, Exit 0 (`mid-c37-302-regressions-final.log`). Der erste Lauf hatte genau einen Harnessfehler: der AST-Audit lädt keine Imports. Er bindet jetzt den echten `explicitIsoInstant` ein; keine fachliche Assertion entfernt oder abgeschwächt. Der Audit und die neue Regression bestehen auch einzeln.

Dependency-Audit: 83 Produktionsversionen über npm Bulk Advisory geprüft, keine Befunde oder Providerfehler; Policyprüfung erfolgreich. Lockfile-SHA256 ab8419f032b5125a8126c42697cc4f0d4dc1aa04853ecd02e6def67278830511. Keine Paketmigration. Echter unveränderter App-Browsertest in isoliertem Chromium 141.0.7390.0 mit .302-Build bestanden: Berg-/Wintersport, Einheitenwechsel, Hitboxen, 6 Viewports × 2 Themes. Zusätzlich bestehende Lokal-/Zulu- und vollständige 23/24/25h-Kalendertagsregression einzeln bestanden. Lokale Suite-Skips mangels global installiertem Chromium sind keine Browser-Abnahme aller Module; dafür bleiben die separaten verpflichtenden Remote-Heavy-Gates maßgeblich.
