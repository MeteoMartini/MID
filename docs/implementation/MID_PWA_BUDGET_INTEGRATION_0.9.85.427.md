# .427 · sichere Sammelintegration #652/#653

Live geprüft: main=mid-stable .425 `7e998730daaa4a409cd3e15d4f4cf0f70efaaeda`. AGENTS, Baseline, Source of Truth, Logo-, PWA-/Offline- und Startup-/Recovery-/Releaseverträge sowie offene PRs gelesen. Eingänge exakt #652 `999aa5601d06431b5c4f568d97afa86080f2efe4`, #653 `11f63707d4d231ac7626ca006b2b5e1362636307`. Alte Drafts nicht gemergt; Integration auf autorisiertem Branch aus Stable.

## Tatsächlicher Produktfehler statt Test-Wartezeiten

Der neue ereignisgebundene Harness registriert Listener VOR register()/registration.update(), bindet das wirkliche installing-Workerobjekt und beobachtet dessen Zustände. Kein async waitForFunction, kein eingesäter Cache, keine probabilistischen Wiederholungen. Cold-controllerchange kann vor dem Ende des activate-Events auftreten; der Test wartet gesondert auf activated.

Vor Korrektur: installierte .427 blieb im realen Update in activating. Das activate-event.waitUntil wartete auf navigateClientsForUpdate(), welches auf die Antwort von client.navigate() wartete. Der von eben diesem Worker bediente Navigationsfetch wartet seinerseits auf dessen abgeschlossene Aktivierung. Das belegt die Deadlock-Ursache; eine längere Deadline behebt sie nicht.

Minimaler Produktfix in beiden identischen Workerdateien: bestehende Clientliste während activate ermitteln und die Navigationen beauftragen, aber ihre Antworten nicht an die activate-Lebensdauer koppeln. Fehler einzelner geschlossener Clients bleiben wie bisher isoliert. Explizite Aktivierungsentscheidung, Cache-/Versions-/Healthy-/Rollbackregeln und alle SHA-/Buildguards bleiben erhalten. Ein zusätzlicher regulärer Unit-/Vertragstest hängt simulierte Navigationsantworten dauerhaft an und beweist, dass der tatsächliche Helper trotzdem beendet wird.

## Vollständige reale Chromium-Registrierungsabnahme

verify-brand-registration-update-0985427.mjs, begrenzt auf 90s, tatsächlicher HTTP-Server mit echten public-PNGs, gleiche Origin, echte CacheStorage, KEIN kopierter Vorversionscache:

- .425: installing→installed→activating→controllerchange→activated, echte alte App-Shell und Healthy.
- echte registration.update(): updatefound/installing→installed; wirklicher registration.waiting bleibt installed, alter Cache und alte Shell bleiben verfügbar, kein vorzeitiger Versionswechsel.
- ausdrückliches MID_ACTIVATE_UPDATE: activating/controllerchange/activated, vom Worker ausgelöste echte Navigation zur .427-Shell, Healthy bestätigt .427.
- sämtliche Alias-Cache-URLs und Light-/Dark-Bilddecodes offline SHA-identisch, keine PNG-Netzabrufe.
- tatsächlicher MID_ROLLBACK verwendet den zuvor real installierten .425-Cache; echte Navigation zeigt wieder .425 und alle Marken funktionieren offline.
- erneutes echtes Registrierungsupdate mit beschädigtem kanonischen Download endet redundant, ohne waiting-Worker oder gültigen neuen Cache. Alter Offlinecache und aktive .425-Version bleiben erhalten.

Diese Abnahme schließt die in #653 ausdrücklich offene Registrierungsupdate-Lücke. Es ist keine physische iOS-Abnahme. JSON/Eventprotokoll und genaue Input-/Dateihashes liegen unter pwa-budget-integration-0985427.

## Konfliktfreie gemeinsame Quellen

Einzige gemeinsame Datei der beiden Eingangsdiffs: MID_BASELINE.json. Beide neuen Regressionen plus der neue Aktivierungsregressionstest sind in beiden Listen erhalten; Version und alle Spiegel .427. #652-Checker und beide Workflowdateien wurden aus dem exakten Input selektiv übernommen, die übrigen #653-Produktblobs bleiben erhalten; einzige zusätzliche PWA-Fachänderung ist der beschriebene Deadlockfix. Ein Nutzer-/Technikchangelog für das gemeinsame Paket, keine zweite Version .426 als Apprelease.

Vorhandene Messung bleibt gültig: 18→12 PNG-Abrufe, 3.914.236→2.980.845 PNG-Bodybytes, 933.391 B / 23,85% weniger im Shell-Aufbau. Keine PNG-/URL-/iOS-/Exportkopie entfernt, keine Paketgrößenersparnis behauptet.

Gesamt-gzip bleibt oberhalb 8.500.000 B. Der volle Checker bleibt im getrennten Revisionsworkflow; kein bestehendes Source-/Installer-Vorfreigabegate wird umgangen. Sein dateigenauer Bericht wird jetzt als CI-Artefakt erhalten. Exakten kombinierten Buildwert siehe budget.json.

Gezielt lokal: tatsächliche Lifecycle-Browserprüfung, Aktivierungshelper-Unit, Brandgruppen-/Divergenzschutz, Budget-CLI einschließlich Fehlerartefakt, Updater, Logo-/PNG-Integrität, Typecheck und gemeinsamer Produktionsbuild. Keine vollständigen Regressionen lokal. Alle vollständigen Pflichtgates verbleiben beim regulären Source-PR→SHA-Bot→ZIP→Installer→Worker/Pages/Finalize→Stable-Pfad. Dieser Stand behauptet vor deren Abschluss keine Veröffentlichung.

## Source-Gate-Korrektur der aktuellen RUC-Browserfixture

Source-Gate 41801517293 auf e19c1020b20f6480449556f5c0425b502546dd1d: core-2/4 scheiterte in test-ruc-concurrency-offline-0985263 nach 240s. Der aktuelle Worker wurde vom Fixture-HTTP-Server mit einem generischen 1×1-PNG statt seiner SHA-gebundenen Markenbytes beliefert; die neue Integritätsgrenze verweigerte deshalb zu Recht die Installation. Minimaler Fixturefix: nur das Profil current liefert bei PNGs die echten unveränderten public-Dateien. Das historische Profil .257, dessen bytegebundener Originalworker und alle Assertions bleiben unverändert. Der gezielte echte Browserlauf (60s-Deadline) besteht danach sowohl legacy-257 als auch current einschließlich Cache-Poisoning, warm/kalt offline, Missing und Wiederherstellung. Kein Produkt-Fallback oder Integritätsgate abgeschwächt. Der erste lokale Aufruf benötigte Browser-/Unterprozessrechte; mit dem normalen freigegebenen Browser-Executor erfolgreich, kein Infrastrukturfehler behauptet.
