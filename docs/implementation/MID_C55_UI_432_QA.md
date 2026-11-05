# MID-C55 · v0.9.85.432 · integrierter QA-Kandidat

## Basis und Lineage

Stable/main am 05.11.2026 wiederholt identisch: 77de0e326d586274d5f42f0ea63827a887d1b147, v0.9.85.431. Fünf aktive Rulesets, keine veränderten Regeln oder CI-Dateien. #665 @ 302d017562358dc6555b7cc7ad271ec38b02c838 ist erster Elternstand; #663 @ 5afd5cc13885c0146b1e6d9ab66dd58ea82f5cc3 und #664 @ 2a5dbbc9cc7a86db02fb905f3e66b15a5a7a801d werden als weitere Eltern erhalten. Originalarbeit bleibt unverändert in Git erreichbar. Kein generischer Merge-/Bypasspfad.

## Korrigierte Befunde

- Kilo hatte 44px-Griffe in 24/26px-Gridspalten vorgesehen; kanonische Desktop-/Mobile-Spalte und Griff sind nun beide 44px. Labelziel und Pfeilbuttons ebenfalls 44px; ältere 36px-Overrides greifen dort nicht mehr. Kein neuer globaler Important-Override.
- Pointercancel/Lost-Capture verwerfen nur wartende Bewegungen. Bereits sichtbar übernommene Schritte bleiben erhalten. Pointerup übernimmt die letzte Bewegung. Unmount räumt RAF/Refs auf. Beschriftete Pfeilbuttons bleiben die Alternative ohne Ziehbewegung und melden Position N von 19.
- Mehr besitzt aria-current nur als ausgewählter Sekundärbereich; das Öffnen des Drawers allein erzeugt keine zweite aktuelle Seite. aria-expanded bleibt der Öffnungszustand.
- Gemeinsame statische Ladeflächen für Map-/Ensemble-/LongRange-Chunks und initiale Saisonmodelle; neutrale Flächen ohne simulierte Wetterwerte, Fortschrittsprozent oder Animation. Bestehende Daten-/Fehler-/Missing- und Exportpfade erhalten.
- Kilo-Regeln zum Verstecken bzw. Flex-Layout einer ohnehin per JSX entfernten Legende wurden als redundant verworfen. Gespeicherte Nutzerauswahl bleibt maßgeblich.
- Historischer .169-CSS-Golden bleibt unverändert. Die sieben beabsichtigten Dashboard-CSS-Deltas werden vollständig und exakt einmal geprüft und nur auf der historischen Vergleichskopie zurückgesetzt. Jede andere Kaskadenänderung bleibt durch Golden-Fingerprint und Produktions-Aggregatvergleich geschützt.

## Tatsächlich ausgeführte Prüfung

Node22.16.0, npm ci --ignore-scripts, App-/Tooling-TypeScript und Vite-Build erfolgreich. Neue Skripte in beiden Pflichtinventaren: 1077 Tests gesamt, 1071 Core und sechs Heavy.

Breiter Entwicklungsdurchlauf: alle1071 Coreprüfungen ausgeführt,1061 bestanden,10 fehlgeschlagen. Danach gezielt erfolgreich wiederholt: Hauptbundlebudget (CSS korrigiert), Modul-CSS-Golden (exakte autorisierte Deltas), RUC-Komposit-/GRIB-Horizonte und RUC-Kartenpipeline (fehlende Python-Abhängigkeiten regulär nach requirements.txt installiert). Damit1065 verschiedene Coreprüfungen erfolgreich belegt; **kein vollständiger grüner Lauf am finalen Commit** behauptet. Quelländerungen während des Entwicklungsdurchlaufs und nachträgliche Wiederholungen sind nicht mit einem atomaren finalen CI-Gate gleichzusetzen.

Sechs Coreprüfungen bleiben lokal blockiert: drei Installer-rsync-Tests (rsync fehlt; Installation/Download in dieser Umgebung nicht verfügbar), drei Chromium-Tests (socket Operation not permitted und SIGABRT). Die sechs Heavy-Prüfungen wurden nicht als bestanden ausgegeben; sie benötigen eine funktionierende Browserumgebung. Keine neuen Freigabe-Skips oder Testerleichterungen.

Gezielt zusätzlich erfolgreich: Dashboard-Touch-Eventharness (Cancel/Up/Lost-Capture/Unmount/RAF/Positionsstatus), React-SSR-Ladezustände, bestehende Kilo-P0-, mobile Settings-, Modul-Open-State-, Versions- und Forecast-Design-Verträge. Eventharness ist keine reale Touchgeräteprüfung.

## Budget und Veröffentlichungssperre

Finales Hauptbundlebudget: JS1494107/1500000B, Start-CSS1759965/1760000B. 1121 identische CSS-Deklarationen über den unveränderten Generator konsolidiert. Nur35B Roh-CSS-Reserve; keine Budgetgrenze angehoben.

Separates Gesamtbudget weiterhin rot: gemessen8725429B gzip-9 bei8500000B Grenze. #652 dokumentiert bereits denselben systematischen Altbestand: voller Budgetchecker ist separat vom engeren Source-/Installer-Hauptbundletest. Grüner Installer würde dieses Rot nicht aufheben. Größte Verursacher sind freigegebene PNG-Medien und vollständiger Changelog. Keine Bilder quantisiert, verkleinert, gelöscht oder aus der Budgetrechnung entfernt. Nur lesende identische Scanline-Neukompression wäre theoretisch etwa84kB kleiner und löst den Fehlbetrag nicht; sie wurde nicht angewendet. Exakter Budgetreport wird am Source-Head separat gesichert.

Dieser Kandidat bleibt Draft. Keine Stable-Promotion, keine behauptete Veröffentlichung, kein Budget-/Gate-/Secret-/Workflowumbau. Workeränderungen betreffen ausschließlich Versionsspiegel; keine neue fachliche Worker-Ausrollung angefordert.

## UI-/Analytics-Evidenz und Grenzen

Interaktive Work-Cloudsteuerung blieb bei about:blank; lokale Chromiumtests scheitern an Socket-Rechten. Über Firecrawl wurde die öffentliche .431-Einstiegsansicht bei390x844 live geladen, als Screenshot heruntergeladen und visuell inspiziert: Suche/Standort, fünf Kopfaktionen, klarer Ersteintritt-ohne-Ort, Footer und Installationshinweis sichtbar. Kein sichtbarer horizontaler Überlauf in diesem einzelnen Screenshot. Suche nach Bonn zeigte zwölf unterscheidbare Treffer mit Region/Land/Höhe und eigenen Schließen-/Leeren-Aktionen. Der anschließende Ortsaufruf lief in einen Provider-Timeout; Sitzung beendet. Keine Abnahme aller Ansichten/Breakpoints, Light/Dark oder .432 aus diesem begrenzten Nachweis ableiten. Reale iOS-/VoiceOver-/Dynamic-Type-Abnahme offen.

PostHog: genaues Projekt MID329940, Zeitzone Europe/Berlin, ingested_event=false und Onboarding unvollständig. Keine belastbare Telemetrie priorisiert. Keine Instrumentierung, kein Dashboard und keine Einstellungen verändert; paralleler PostHog-Integrationsauftrag bleibt separat.

Primärquellenabgleich: React19.2.8/React-DOM-Ereignisse via Context7. W3C WCAG2.2 2.5.8 nennt24px als AA-Minimum mit Ausnahmen;44px bleibt das bewusst weitergehende MID-Ergonomieziel. Quellen: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html und https://www.w3.org/TR/WCAG22/ . Kein vollständiger Wettbewerbs- oder WCAG-Konformitätsnachweis.

PR Completion watcher meldete blocked wegen fehlender gh-CLI-Anmeldung. Verbundener GitHub-Connector funktioniert; Reviews/PRs/SHAs wurden darüber gelesen. #663/#664/#665 hatten keine offenen Reviewthreads. Keine Credentials kopiert oder Rechte erweitert.

## Nächster sicherer Schritt

Versionierten Source-Kandidaten in #665 SHA-verifiziert sichern, parallele PRs bis zur gemeinsamen Abnahme erhalten; Budget-/Browser-/rsync-Lücken in geeigneter qualifizierter CI beheben. Danach erst vollständige Source-/Bot-/Server-ZIP-/Installer-/Worker-/Pages-/Finalize-Gates und Stable-Promotion. Die 15-Punkte-Matrix bleibt ehrlich offen für visuell unbewiesene Verdichtung, Layergruppierung, Fehlerzustände und globale A11y-/Motion-Abnahme.
