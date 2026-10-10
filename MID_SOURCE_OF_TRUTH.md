# MID v0.9.85.230 · kanonische Skybar unter Aktuelles und Heute

Basis main=mid-stable b88efe2f3ba580aad5a0e692037f2c9814f69547 (.229), Source-Gate38059167998 und Installer38059674163 einschließlich Worker/Pages/Stable erfolgreich. Keine überlappende offene Source-PR. Aktuelles verlor leichte kurze Regenphasen, weil ausschließlich die endgestempelte Stundenreihe unmittelbar als vorwärts gerichtete Skybar verwendet wurde. Current erhält jetzt die finalisierten displayMinutes15 und denselben shortTermAnchor wie Heute. Derselbe buildShortTermForecast-/shortTermProfileHourlyPoints-Pfad liefert Niederschlag und Bewölkung für Band und Stundenquadrate, ohne Radar doppelt einzurechnen.

Der gemeinsame detailSkyBarTimedSegments-Renderer verortet explizite Intervallgrenzen auf der echten Epoch-Achse. Intensität bleibt aus der ursprünglichen Menge und Dauer berechnet, nur Randgeometrie wird beschnitten; fehlende Intervalle werden nicht überbrückt. Temperaturreihe und +12h-Differenz bleiben volle Stunden. Regression reproduziert positive 0,06mm bei trockener grober Reihe und prüft Aktuelles/Heute-Parität, Clipping, Lücken, Squares und Missing. Echte Komponenten werden in 48 Browserkombinationen geprüft. Der Gesamtaudit bleibt mit den unter .229 dokumentierten Einschränkungen offen.

# MID v0.9.85.229 · UTCI, 14d-Entwicklung und reale Werte-Referenz

Basis main=mid-stable ada0f6c54a7ed1faf56d4d202d8a897abf567157 (.228), Source-Gate38050995420 und Installer38051448345 erfolgreich; keine überlappende Source-PR. UTCI wird aus dem bestehenden kanonischen aktuellen Wert prominenter dargestellt, ohne Formel-/Einheitenänderung. Die14d-Entwicklung bündelt kompakte Wetterphasen und verbundene Tmax/Tmin-Tageswerte mit unveränderten echten Ensemblequantilen. Verbindung nur opt-in im gemeinsamen Renderer und nur bei vollständigen aufeinanderfolgenden UTC-Daten; periodische Produkte bleiben diskret.

Reale Werte-Referenz: DWD2026-10-10T09:00,66 Dateien mit zwölf Kernparametern, CLAT/CLON und20EPS-Mitgliedern bei+0/+1h. Vollständiges native Gitter542040 wurde dekodiert und vor Packing geprüft; Niederschlagskonservation maximal0mm Abweichung. 35 exakt dekodierte Zellvektoren, URLs/Hashes, Coverage und Wire-Goldens archiviert. derive_core_fields ist die unveränderte aus main extrahierte Produktionsrechnung und wird für Replay wiederverwendet. Offline-Goldens prüfen Einheiten, physikalische QC, Missing-Bitwerte und Packingfehler, keine neuen Warnschwellen. Roh-GRIBs sind nicht archiviert; Hashes ersetzen keine vollständige Rohdaten-Reproduzierbarkeit. Weiter offen: volle14h-/Rapid-/optionale Produkt-/Lookup-/E2E-Referenz, Leakage-freie Verifikation, Regridding/Nähte, Langzeit-SLOs und reale Geräte-/Kontoevidenz.

# MID v0.9.85.228 · kalibrierte Kern-GRIB- und Gitterverträge

Verifizierte Basis main=mid-stable bc7c73a818714420474b688b48b7ef3fdf2893b1 (.227); Source-Gate38047969482 und Installer38048324417 erfolgreich, Pages Versuch1. Keine überlappenden offenen Source-PRs. Kernverträge verwenden discipline/category/number und rohe Fixed-Surface-Codes mit dekodierten skalierten Werten, nicht allein Dateiname/shortName/typeOfLevel. CLCL: Druckfläche100/80000 Pa bis Boden1/0; CAPE_ML/CIN_ML: lokale Mischschicht192/0, kein zweites Level255. Legitime unknown-Anzeigenamen bleiben erlaubt. Alle dekodierten unstrukturierten Felder müssen das kalibrierte Gitter UUID c6b12daa91ad64045b26c1b6452a2a20, Nummer47, Referenz1,542040 Punkte verwenden. DWD-Gitterrevisionen erfordern explizite Neukalibrierung; gleiche Zellzahl ist kein Identitätsnachweis.

Kern-Zeitvertrag trennt UTC-Initialisierung, Vorlauf, Gültigkeit und Bounds: instant start=end; TOT_PREC accum start0; VMAX_10M max über vorangegangene native Stunde, Nullfenster am Laufstart. init+lead=valid zwingend. ecCodes-Schritte numerisch oder mit m/h/s-Suffix werden gemäß deklarierter Einheit in ganze Sekunden überführt; unbekannte/kontradiktorische Einheiten und ungültige Bounds brechen ab. Produktions-EPS erwartet explizit IDs1..20; ein über alle Termine fehlendes Mitglied darf nicht aus der beobachteten Vereinigungsmenge verschwinden. sourceGribContract in latest.json dokumentiert Quellsemantik und erwartete IDs getrennt von den unveränderten gepackten Niederschlags-Intervallmengen. Bitlayouts, Missing-Werte, Warnschwellen und Freigabegates bleiben unverändert.

Echte ecCodes-Negativfixtures prüfen falsche Parameter/Schichten/Processing, UUID-/Referenzwechsel bei gleicher Zellzahl, Dateinamenverwechslung, UTC/DST-Tag, Sub-hourly und Metadaten-Persistenz. DWD-Laufkennungen ohne Offset werden explizit UTC gelesen, nicht als Host-Lokalzeit; Subprozess mit TZ Europe/Berlin prüft den früheren Versatz. Read-only scientific_grib_contract_probe prüfte vollständig584 native Dateien des Laufs2026-10-10T06:00: zwölf Kernparameter +0..14h, CLAT/CLON, benötigte 5-/15-Minuten-Termine +0..6h und EPS1..20 +0..14h. URL/Hash/Member/Bounds/Grid archiviert; Einheiten aller584 Header separat gegen Produktionsnormalisierung geprüft. Lokal47 GRIB-/Integritäts- und3 Temperaturtests,955 App-Regressionen,14 Browserfälle, Build/Types/Syntax und Produktionsaudit0 Vulnerabilities erfolgreich. Ablagefehler einer neuen Release-Notiz durch Verschieben unter docs korrigiert; Hygiene-Regel unverändert. Keine Werte-/QC-/Packing-/E2E-/Skill-Score-Abnahme daraus behaupten. Weiter offen: feste optionale Produkt-/Levelverträge, kompletter reproduzierbarer Werte-Referenzlauf, Leakage-freie Verifikation, Regridding/Nähte, langfristige SLOs und echte Geräte-/Kontoevidenz.

# MID v0.9.85.227 · wissenschaftlicher Audit: deklarierte Kern- und Koordinateneinheiten

Verifizierte Basis main=mid-stable 6c7d493c65cf1046fc1a5ed2f89bf10b0ea3ffca (.226), Source-Gate38031626313 und Installer38032074847 erfolgreich. Gesicherte Header-Evidenz aus codex/v0.9.85.227-audit-header-evidence unverändert übernommen; keine überlappenden offenen Quell-PRs. Die Größenheuristik für CLAT/CLON wird durch deklarierte Einheiten ersetzt: Degree N/Degree E beziehungsweise degrees_north/degrees_east, oder explizite Radiant-Einheiten. Kleine Gradwerte bleiben Grad; vertauschte Richtungs-/unbekannte Einheiten brechen vor Lookup ab. Geographische Bounds und Endlichkeitsprüfungen bleiben verbindlich.

normalize prüft nun auch u10/v10/wind_gusts_10m auf m/s, cape/convective_inhibition auf J/kg und precipitation_acc auf kg/m² beziehungsweise äquivalente mm Wassersäule. Keine Rate-/Energie-/Windgrößenumdeutung anhand von Werten, keine neuen Warnschwellen, keine Missing-Auffüllung. Native ecCodes-Einheiten sind durch archivierte Header-Stichproben dokumentiert. Verpflichtende Python-Fixtures prüfen gültige Einheiten, trockene Null/Missing, unbekannte/falsche Einheiten, kleine Koordinaten und unveränderte Inputs. read_first_values bleibt für bestehende Verbraucher kompatibel.

Dieses Paket ist bewusst eine begrenzte Einheitenkorrektur, kein vollständiger GRIB-Produktvertrag: feste Parameter-/Raw-Levelmatrix, Bounds/Lead-Zeitsemantik und gemeinsame UUID-Prüfung aller Daten-/Koordinaten-/EPS-Felder bleiben offen. Ebenso vollständiger realer DWD-Referenzlauf, Verifikation/Leakage/Regridding, historische SLOs und Geräte-/Kontoevidenz. Bestehende Source-/Release-Gates unverändert; Veröffentlichung ausschließlich über die bestehende Bot-/Installer-Kette.

# MID v0.9.85.226 · wissenschaftlicher Audit, erstes Umsetzungspaket

Ausgangspunkt main=mid-stable 391ed9334c0335fb9678884f6b67354e53d24dc3 (.224). PR #319 (.225) hatte nach unveränderter Chromium-CDP-Wiederholung grünes Source-Gate und wurde vom Release-Bot zusammengeführt. main 075e0b39fa651b5da8dc7c687b8790d7cd876912 ist der serverseitige Paketcommit; Stable-Promotion war während .226-Vorbereitung wegen Installer-Browserprüfung noch nicht erfolgt. .226 integriert diesen exakt verifizierten main-Stand verlustfrei auf dem aus .224 entstandenen Arbeitsbranch; keine .225-Änderung wird rückgenommen und kein Stable manuell verändert.

Bestätigter P0-Befund: nansum wertet fehlende RUC-Niederschläge in Extremwetter-Aggregaten als 0; fehlende EPS-Mitgliedsperioden werden trocken gezählt. .226 propagiert Missing in vollständigen Periodensummen, rollierenden Fenstern, EPS-Wahrscheinlichkeiten/Quantilen, Phasen- und Kompatibilitätsfeldern. Bestehende Wetter-/Warnschwellen bleiben bestehen. Negativfälle prüfen all-missing, partielle Mitgliedsperioden, echtes trockenes Null und Input-Unveränderlichkeit.

Update-Browsergate auf .224 lokal reproduziert: CSS min-height44 wurde während der Transform-Einblendanimation als43.99999237060547 gemessen. Test wartet jetzt das Animationsende ab und behält die strikte44px-Mindestgröße;14 Browserfälle (7 Viewports×2 Themes) bestanden. Kein Testbudget gelockert.

Inventar/Referenzbaseline erfasst Quell-SHA, Worktree, Hashes der Verträge/Dependencies, Python-Pakete, native ecCodes-API, NumPy/BLAS-Build und Threadkonfiguration. Synthetische Kern-/Missing-/Mitglieds-/Integrationsfixture besitzt festen semantischen Hash. Laufzeit/CPU/RSS separat, unbekannte I/O-Zähler null. Kein vollständiger DWD-Referenzlauf oder CF-/Grid-/Leakage-/Kalibrierungs-/Geräteabschluss behauptet. Details und geordnete Folgearbeiten in docs/implementation/MID_SCIENTIFIC_AUDIT_BASELINE_2026-10-10.md. Weitere P0/P1-Anwendbarkeitsprüfungen, numerische Cross-Model-/Reprojektionsnähte, echte VoiceOver/WKWebView-Abnahme, langfristige SLO-/Alarmierung und Cloudflare-Kontoevidenz bleiben offen.

# MID v0.9.85.225 · MID-C26: Metadaten statt Werteheuristik

Basis main=mid-stable391ed9334c0335fb9678884f6b67354e53d24dc3 (.224), Installer38026620448 erfolgreich. .225 ersetzt normalize-Heuristiken für Temperatur/Druck/Bewölkung/relative Feuchte durch explizite Einheiten. Die frühere max<=1.2-Regel konnte 1 Prozent zu100 Prozent machen; Medianregeln konnten Ausreißer als Einheitenwechsel umdeuten. Explizite K/C, Pa/hPa und Prozent/Bruchteile; unbekannte Einheiten brechen fail-closed ab. Native Missing-Zellen bleiben unverändert. Gleiche physikalische Felder in verschiedenen Einheiten werden numerisch verglichen; Ausreißer bleiben für die bestehenden physikalischen Gates sichtbar.

Acht reale DWD-GRIB-Header am10.10.2026 gelesen und als docs/implementation/MID_C26_RUC_HEADER_SAMPLES_2026-10-10.json mit URL/Hash archiviert: T_2M/TD_2M K, PMSL Pa, RELHUM/CLCT/CLCL Prozent. Samples stammen aus einzelnen live verfügbaren Dateien, nicht aus einem vollständig dekodierten gemeinsamen Lauf; kein vollständiger Produkt-/Level-Vertrag daraus behauptet. CAPE_ML/CIN_ML-Metadaten ebenfalls archiviert.

Der Gesamt-Intensivaudit ist noch nicht abgeschlossen: feste vollständige Parameter-/Levelverträge, Cross-Model-/Reprojektion-/Tile-Nähte, echte Geräteperformance und VoiceOver/WKWebView/macOS, kalibrierte Missing-Grenzen und historische SLO-Auswertung/Alarmierung erfordern weitere Umsetzung/Evidenz. Kein Zugriff auf reale Geräte/macOS in dieser Umgebung. Cloudflare am10.10.2026 erneut direkt geöffnet: normales Anmeldeformular, früherer Verifikationsfehler derzeit nicht sichtbar; Konto-/Cron-Abnahme benötigt sichere Anmeldung. Aktueller Code und CI allein schließen diese Abnahmen nicht.

# MID v0.9.85.224 · MID-C26: vollständiger Kernparametervertrag

Basis main=mid-stable 4c875804953290fdf048b93c72b716c6781064d4 (.223), Installer37991713944 erfolgreich einschließlich Core/Heavy, Pages und Stable. Live-Version am10.10.2026 bestätigt. RUC38022529847 veröffentlichte tatsächlich run03:00; Publish114130462693 bestätigt Pages/Worker, LiveHealth04:56 UTC ready/fresh/schemaValid. Kanonische Standortprobe50.815/7.04 nutzt je13 RUC-/RUC-EPS-Stunden und20 Mitglieder.

Auditbefund: validate_core_fields forderte zehn der zwölf Builder-Kernfelder, pressure_msl und convective_inhibition fehlten im Pflicht-/Wertevertrag. .224 ergänzt beide und verlangt eindeutige EPS-Mitgliedskennungen. Druck in normalisierten hPa muss positiv sein; CIN nach Betrag-Normalisierung nicht negativ (0.01 Rundungstoleranz). Keine neue Missing-Quote oder erfundene obere physikalische Grenze. Tests entfernen jeden einzelnen Pflichtparameter; bestehende Dimensions-/Missing-Fixtures erhalten realistischen Druck statt bislang ungeprüfter Null.

Weiter offen bleiben feste echte GRIB-Produktverträge, numerische Cross-Model-/Einheiten-/Reprojektions-/Tile-Nähte, Geräteperformance, VoiceOver/WKWebView, dauerhafte SLO-Auswertung und Alarmierung sowie direkter Cloudflare-Kontonachweis.

# MID v0.9.85.223 · MID-C26: automatische Updates und eindeutige Wirkung

Verifizierte Basis main=mid-stable 5c52d4fc1ca3c32b9c9abd4acd6ebaf23780e4a1 (.222). Source-Gate37987384825 und Release-Bot37988004602 erfolgreich; Installer37988046040 vollständig erfolgreich einschließlich Core, fünf Heavy-Gates, Worker, Pages im ersten Versuch und Stable-Finalisierung. .221 wurde zuvor durch Installer37985757652 veröffentlicht. Alte Replit-Arbeitsfläche .195 bleibt unprivilegierter UI-Workbench-Stand, keine Veröffentlichung daraus.

Der Screenshot zeigte widersprüchliche Bereitschaft („vollständig vorbereitet“ trotz fehlender Dateien) und einen unbegrenzt deaktivierten Rückfallknopf. Codebefunde: Die Rückfall-Aktion wartete ohne Timeout auf ready/MessageChannel; der normale Knopf suchte trotz bereits neuem Controller und altem Rückfallcache nur nach einem weiteren wartenden Worker. Die automatische PWA-Aktivierung ignorierte die gespeicherte Automatik-Auswahl. Kein Beweis, welcher Einzelfehler die konkrete iOS-Sitzung ausgelöst hat.

.223 korrigiert diese Pfade: klar benannte Download-/Aktivierungsaktion, versionierter ausstehender Zustand und konkrete Fehler, expliziter Neustart des bereits geprüften neuen Caches, Navigation unter bereits bestätigtem neuen Controller, zehn Sekunden begrenzte Rückfallantwort, spätes Reply ohne Navigation, deduplizierte Versuche, Online-Recheck und sichtbares Ende des Retry-Budgets. Die Automatik-Auswahl gilt für PWA-Aktivierung und startet beim Einschalten den aktuellen Versuch. Sitzungsausblenden verhindert weitere automatische Versuche dieser Version. HTML-Metaversion, descriptor und Worker müssen übereinstimmen; aktuelle Caches ohne Gültigkeitsmarker und Aktivierung eines anders versionierten Workers werden abgewiesen. Parallele Downloader schließen vor dem Löschen eines fehlgeschlagenen Caches ab.

Touchflächen mindestens44px, Umbruch und zugeordnete Statusbeschreibung sind in einer eigenen C26-CSS-Schicht enthalten. Die geschützte .169-CSS-Kaskade bleibt unverändert; der CSS-Test erlaubt ausdrücklich die neue geprüfte Ergänzung. Der alte Wartungstest verlangte die sofortige Entfernung des Rückfallbalkens und einen Variablennamen; er prüft jetzt bestätigten Erfolg/Navigation und verspätungsfesten Abschluss. Kein Release-, Meteo- oder Performancebudget gelockert.

Lokale Fehlerfalltests führen die echten Rückfall-/Reload-/Cache-/Message-Funktionen aus: fehlender Controller, Sendefehler, verlorene/abgelehnte/späte Antworten, erfolgreicher Neustart, bereits aktiver neuer Controller, alter Controller, verworfener Cachewechsel, stale HTML/Versionsdatei, fehlender Marker und falsch adressierte Aktivierungs-Version. Finaler .223-Produktionsbuild/Types und alle955 lokalen App-Regressionen erfolgreich;31 echte ecCodes-/GRIB-Tests, Worker-/Service-Worker-Syntax und Produktionsaudit mit0 Vulnerabilities bestanden. Ein erster finaler Prüflauf endete ohne Abschlussbericht; vollständige Wiederholung mit laufender Prozesskontrolle bestätigt exit0. Reguläres Source-/Installer-Gate bleibt erforderlich. Neue Pflicht-Browsermatrix:320/390/412/844/834/1024/1440px jeweils light/dark mit Klickwirkung, ausstehendem Status, Mindest-Touchfläche, Umbruch, Seitenbreite und Sitzungsausblenden. Lokal Browserdownload möglich, Browserstart durch socket()-Umgebungsregel blockiert; deshalb keine lokale Browser- oder Geräteabnahme behaupten. CI führt diese Matrix verbindlich aus.

Fortsetzungsgrenzen des Intensivaudits: .222 misst native Missing-Zellen pro Parameter/Termin/Mitglied, setzt keine erfundene prozentuale Grenze. Archivierte feste produktbezogene GRIB-Metadatenmatrix, kalibrierte optionale Produktquoten, numerische Cross-Model-/Einheiten-/Reprojektions-/Rasternahtprüfungen, reale Geräteperformance und VoiceOver/WKWebView bleiben offen. RUC-Health am2026-10-09T20:35:14Z: run18:00, ready/fresh/schemaValid,542040 Punkte,15 Termine,20 EPS-Mitglieder; dies ist keine Aussage über spätere Aktualität. Längerfristige SLO-Aggregate/Alarmierung und gemeinsame Build-/Daten-/Render-IDs bleiben offen. Direkte Cloudflare-Konto-/Cron-Abnahme blockiert durch Login-Verifikationsfehler. Ausgeführte GitHub-prepare-Logs113938814905/113978381400 belegen cloudflare-watchdog-Dispatches, ersetzen die Kontoabnahme nicht. MID-C26 behält diese offenen Nachweise ausdrücklich als Fortsetzungsauftrag bei.

# MID v0.9.85.222 · MID-C26: differenzierte native Missing-Data-Diagnostik

Verifizierte Integrationsbasis main=mid-stable 270287e8858a2f26cd1ad02968b868baf49b7e08 (.221), Installer 37985757652 erfolgreich inklusive aller Core/Heavy/iOS-Webasset-Prüfungen, Pages im ersten Versuch und Stable-Finalisierung. Source-Gate .221 hatte zuvor einen Bergwetter-Close-Timeout; gezielte Wiederholung bestand unverändert. Keine Budgetlockerung. .222 wurde zunächst isoliert auf verifiziertem .220 vorbereitet, lokal SHA-gesichert und danach verlustfrei auf den veröffentlichten .221-Stand übertragen. .221-RUC-Metriken und Watchdog-Nachweise bleiben erhalten.

meteo_integrity verwendet die bereits berechneten Endlichkeitsmasken für Quoten je Kernparameter/Termin und EPS-Mitglied/Termin. persistentMissingCount beobachtet durchgehend fehlende Zellen; additionalMissingCount benennt zusätzliche Ausfälle. Keine Bitmap-Ursache aus Persistenz erraten, keine Werte auffüllen und keine Prozent-Freigabegrenze erfinden. Native Indexierung und trockene Nullwerte bleiben erhalten. EPS mit leerer Zeitachse wird ausdrücklich durch den Dimensionsvertrag abgewiesen. Builder schreibt schema mid.ruc.missing.v1 und UTC validTimes in vorhandene Joblogs nach erfolgreichen Gates, vor Packing/Aggregation. EPS-Messung betrifft Akkumulation, Kern-Niederschlag betrifft Intervalle. Quoten für optionale Rapid-/Spezialistfelder, kalibrierte Grenzwerte und Archivierung bleiben offen.

Neue verpflichtende ecCodes-Tests prüfen persistent/zusätzlich fehlende Zellen, exakte Bruchteile, trockene Nullen, Inf, echte Member-IDs, JSON-Roundtrip und Builder-Log mit UTC-Terminbindung, unveränderte Inputs sowie leere Dimensionen. Vollraster-Fixture: 542040 Zellen, 16968 dauerhafte fehlende Randzellen, korrekte Quote ohne zusätzliche Missing-Zellen. Lokale Abnahme: 31 echte ecCodes/RUC-Tests, 3 Temperaturdiagnosen, Scheduler-Metriktests, isoliertes npm ci, Produktionsbuild/Types, Worker-Syntax und alle 954 App-Regressionen erfolgreich; Produktionsaudit ohne Vulnerabilities. Chromium ist lokal nicht vorhanden; reale Browsermatrizen bleiben deshalb verpflichtend im Source-/Release-Gate und werden nicht als lokale Geräteabnahme ausgegeben. Kein Testbudget oder Sicherheitsgate wird gelockert.

Cloudflare-Dashboard am 09.10.2026 erneut direkt geprüft: login-Verifikationsfehler und deaktivierte Anmeldung bleiben nach einmaligem Reload bestehen. Konto-Deployment-ID/Cron dadurch nicht direkt abgenommen; GitHub-Dispatchnachweise aus .221 bleiben als separate Evidenz gültig. Keine Secrets, Anmeldung, Credentials oder Schutzregeln geändert. RUC37985156293 wurde erfolgreich aufbereitet, sein Publish wegen .220→.221-Übergang korrekt übersprungen; Erfolg des Workflows allein ist kein Nachweis eines neuen produktiven RUC-Laufs.

Weiter offen: feste echte produktspezifische GRIB-Header-/Parameterverträge, kalibrierte Missing-Freigabequoten, numerische Cross-Model-/Einheiten-/Reprojektions-/Tile-Nähte, Geräteperformance, VoiceOver und echte WKWebView/macOS-Abnahme, dauerhafte SLO-Auswertung/Alarmierung und Build-/Data-/Render-Korrelation. Keine vollständige Audit-Erledigung behaupten. Veröffentlichung ausschließlich Source-PR-Gate → bestehender SHA-gebundener Release-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable-Promotion.

# MID v0.9.85.221 · MID-C25: RUC-Aktualitätsdiagnostik und Watchdog-Nachweis

Basis main=mid-stable 42dbffde19d546eb847207409c746283e6f6c349 (.220), Installer 37978521219 vollständig erfolgreich inklusive Pages im ersten Versuch und Stable-Finalisierung. Cloudflare-Watchdog-README mit inactive-Label war veraltet: echte ausgeführte GitHub-prepare-Ausgabe nennt cloudflare-watchdog bei RUC37965530049/Job113938814905 (17:20:20 UTC) und RUC37977200345/Job113978381400 (19:00:20 UTC). Dies belegt akzeptierte externe Recovery-Dispatches; keine direkte Cloudflare-Konto-/Deployment-ID-/Cron-Abfrage, keine Aktivierung/Secrets geändert. Früheres inactive-Label nicht als Kontowahrheit weiterführen.

check_ruc_schedule_guard ergänzt mid.ruc.freshness.v1: UTC observedAt, gemeinsam angekündigter dwdRun, publishedRun, pagesMetaValid, unveränderte shouldRun/reason sowie upstreamRunAgeMinutes, publishedRunAgeMinutes und availabilityLagMinutes. Fehlende/ungültige Metriken sind null; negative Werte bleiben als Zeitstempel-/Listing-Anomalie sichtbar. JSON erscheint im bestehenden stdout, GITHUB_STEP_SUMMARY und zusätzlichem GITHUB_OUTPUT freshness_metrics. Keine neue Warn-/SLO-Grenze, keine Entscheidungsschwelle, kein zusätzlicher Netzabruf oder Scheduler. Der DWD-Verzeichnisabgleich ist keine Zusage fertig dekodierter Daten. availabilityLagMinutes ist Initialisierungszeit-Differenz, keine gemessene Discovery→Publish-Latenz.

Pflicht-Scheduler-Tests prüfen getrennte Metriken, echten Nullrückstand, unbekannten Upstream, ungültige Pages-Meta/Kalenderdaten, negative Werte, Zeitzonenidentität und JSON-Roundtrip über stdout/Summary/Output. Bestehender Node-Wrapper bindet sie im normalen Regression-Gate ein. Weitere SLO-Aggregate/Alarmierung, universelle Build-/Data-/Render-Korrelation, feste Parameter-/Member-Verträge, Missing-Quoten, numerische Nähte/Cross-Model und reale Hardware-/VoiceOver-/WKWebView-Abnahme bleiben offen.

RUC-Catch-up auf .220 vor neuem Source-PR abgeschlossen: Workflow37979807681 mit prepare113987136219 und publish113992506618 vollständig erfolgreich. Produktive Health bestätigt ready/fresh/schemaValid und Lauf2026-10-09T18:00; Standort50.815/7.04 bestätigt je13 RUC-/RUC-EPS-Stunden und20 EPS-Mitglieder. Worker meldet eigene Version.195; keine Gleichheit mit App.220 behaupten. Direkte Cloudflare-Kontoabnahme bleibt offen: Dashboard führt zur Anmeldung mit Verifikationsfehler; keine Credentials eingegeben oder Sicherheitsprüfung umgangen.

Lokale Abnahme: isoliertes npm ci, Produktionsbuild/Types, npm audit --omit=dev ohne Vulnerabilities, Worker-Syntax, direkte Scheduler-Metriktests,29 echte ecCodes/RUC-Tests und alle954 App-Regressionen bestanden. Erster App-Lauf zählte im übernommenen dist alte/neue Hauptbundles doppelt; Ausgaben gesichert und sauberer Build plus vollständige Suite danach erfolgreich. Keine Budgetlockerung. System-Python fehlte requests; RUC-Prüfung anschließend in vorhandener isolierter ecCodes-Umgebung erfolgreich.

# MID v0.9.85.220 · MID-C25: RUC-Snapshot-Transport

Basis main=mid-stable c620e672b330f4f35e2d43f7451e27f7773bdb2a (.219). Installer 37974045646: Source-/Release-Core und alle Heavy-Gates erfolgreich; Snapshot-Vorbereitung scheiterte an http.client.IncompleteRead beim CDN-Download, zweiter regulärer Pages-Versuch und Stable-Finalisierung erfolgreich. Einzelner vorbereitender Job war fehlgeschlagen; keine Behauptung eines fehlerfreien Gesamtlaufs.

restore_ruc_pages_snapshot.fetch wiederholt jetzt auch IncompleteRead innerhalb des bisherigen endlichen Retry-/Backoff-Vertrags. Neue Anfrage liest das Objekt von Anfang an; Teilbytes werden nie verkettet oder akzeptiert. Größe/SHA, Objektpfadvertrag, Workerlimit 8, atomare Ersetzung, 404-/andere HTTP-Gates bleiben unverändert. Tests reproduzieren Read-Abbruch im Response-Kontext, Recovery, endliche Erschöpfung, persistente Fehler mit Erhalt des bestehenden Snapshots, Tmp-Cleanup sowie nicht wiederholte Größen-/SHA-Fehler. Dies verbessert REL-001/Observability-Betrieb, ist kein neuer Scheduler oder meteorologischer Fallback. Lokale Abnahme: direkte Transport-/Atomaritäts-/SHA-Negativtests, bestehende Restore-Regression, 29 ecCodes/RUC-Tests, Scheduler-Guard-Tests, isoliertes npm ci, Produktionsbuild/Types, Produktionsaudit ohne Vulnerabilities und alle 954 App-Regressionen. Erster App-Lauf meldete doppelte alte/neue Hauptbundles im lokalen dist; alte Ausgaben gesichert, sauberer Build und vollständige Suite danach grün. Keine Budgetlockerung.

Aktualitätsmechanismus: Primärslots :11/:41, GitHub-Watchdog :23/:53, neuester gemeinsamer DWD-/Pages-Laufvergleich, aktive Läufe nicht abbrechen, Datenpublikation unter gemeinsamer Pages-Sperre. Externer Cloudflare-Watchdog ist im README ausdrücklich source-prepared/inactive; keine Aktivierung oder neues Credential in diesem Paket. Harte maximale Aktualitätsgarantie ist wegen DWD-Verfügbarkeit/GitHub-best-effort-Timern nicht möglich. SLO-Messung soll Run-Alter und Discovery→Publish-Latenz unterscheiden. Weitere feste Header-/Mitgliederverträge, Missing-Quoten, numerische Nähte/Cross-Model, Geräteperformance, VoiceOver, WKWebView und langfristige SLOs bleiben offen.

# MID v0.9.85.219 · MID-C25: EPS-Mitgliederabdeckung

Basis main=mid-stable e4951e420b21f96a308a9f309b79728780ae676c (.218), Installer 37970763374 erfolgreich inklusive Worker/Pages/Stable. Der bisherige EPS-Sammler konnte teilweise vorhandene Mitglieder über eine Schnittmenge still entfernen. Ein vollständig leerer Mitgliedstermin bestand die globale Endlichkeitsprüfung, solange andere Mitglieder Werte enthielten. Kein Nachweis eines tatsächlich fehlerhaft publizierten Laufs.

collect_eps verlangt jetzt dieselben tatsächlich gelieferten Mitglieds-IDs an jedem Zieltermin. validate_eps_member_coverage prüft mindestens eine endliche native Zelle je Termin und Mitglied vor Akkumulationsprüfung und Aggregation. Diagnosen nennen echte Mitglieds-IDs und maximal 24 Termin/Mitglied-Paare. Unveränderte Mindestzahl 10; keine neue feste 20-Mitglieder-Zusage, kein Erraten völlig fehlender IDs, keine prozentuale Missing-Data-Quote, keine neue Warnschwelle, kein Auffüllen. Partielle authentische Masken und trockene Nullen bleiben gültig.

Neue verpflichtende Python-Tests prüfen unveränderte maskierte Inputs, jeden leeren Mitgliedstermin, Dimensionsfehler und den echten Sammler mit 20 ungeordneten Mitgliedern: sortierte IDs, identische Intervallwerte, fehlendes Mitglied am ersten/mittleren/letzten Termin sowie leerer Termin blockieren. 29 ecCodes/RUC-Tests, 6 Bitmap-Tests, alle 954 App-Regressionen, isoliertes npm ci, Produktionsbuild/Types, Produktions-Audit ohne Vulnerabilities sowie echte Chromium-Headless-Shell-Bergmatrix (6 Viewports × 2 Themes) lokal bestanden. Weitere Missing-Data-Quoten, feste produktspezifische Header-/Mitgliedsverträge, numerische Nähte/Cross-Model, Geräteperformance, VoiceOver, WKWebView und dauerhafte SLOs bleiben offen. Echter produktiver RUC-Lauf auf neuer Stable-Version bleibt nach Veröffentlichung nachzuweisen.

# MID v0.9.85.218 · MID-C25: RUC-Terminabdeckung und gemeinsame Dimensionen

Basis main=mid-stable fb4b93c01c24b2d6ff2f1c81ed817b97a2f0c8f6 (.217), Installer 37967615851 vollständig erfolgreich inklusive Worker/Pages/Stable. Reproduziert auf dieser Basis: vollständig leere einzelne Wolken-/Akkumulationstermine sowie abweichende Wolkenfeld-Gitter/Zeitdimensionen bestehen das bisherige globale finite.any(). Abweichende Dimensionen wurden bereits später im Packer abgewiesen; sie werden nun früher durch das semantische Gate diagnostiziert. Kein Nachweis eines tatsächlich veröffentlichten dimensionswidrigen Laufs.

meteo_integrity.py prüft nun vor Packing für jeden stündlichen Kernparameter (auch Druck/CIN ohne zusätzliche physikalische Grenzwerte) identische 2D-Zeit/Gitterdimensionen und mindestens eine endliche Zelle je Termin. Akkumulationen prüfen mindestens eine endliche Zelle je Termin über die übrigen Raum-/Memberachsen. Fehler nennen maximal 24 Null-basierte Terminindizes. Keine neue prozentuale Missing-Data-Grenze, kein Auffüllen, keine Neugitterung, keine Einheitenänderung. Authentische maskierte Randzellen, gültige Extreme und trockene Nullen bleiben unverändert. Die bereits berechnete Endlichkeitsmaske wird für die bestehenden Grenzprüfungen wiederverwendet. Bestehende Origin-/GRIB-/Bitmap-/Taupunkt-/Akkumulationsgates bleiben verbindlich.

test_meteo_integrity.py ergänzt jeden Kernparameter inklusive Druck/CIN, getrennte Zeit-/Gitterabweichung, teilweise NaN-Ränder, unveränderte Inputs, trockene 2D-/3D-Akkumulation sowie vollständig fehlenden mittleren Termin. Ein synthetischer 15x542040-Fall mit16968 maskierten Randzellen bleibt gültig; ein vollständig leerer Termin wird abgewiesen. Die Tests sind bereits über test_fetch_resilience.py im verpflichtenden echten ecCodes-Gate enthalten. Lokale Abnahme: 27 ecCodes/RUC-Tests, 3 Temperaturdiagnose-Tests, 6 Bitmap-Tests, alle954 App-Regressionen, isoliertes npm ci, Dependency-Audit ohne HIGH/CRITICAL und Produktionsbuild/Types. Gemeinsamer node_modules-Symlink wurde nach dessen inkonsistentem Auditbefund durch isolierte Installation ersetzt; keine Audit-Ausnahme. Kein Workflow-/Secret-/Ruleset-/UI-/Widget-Umbau. Vollständige Parameter-/Level-Matrix, differenzierte Missing-Data-Quoten, einzelne EPS-Member-Abdeckung, numerische Naht-/Cross-Model-Prüfung, Geräteperformance, VoiceOver, echte WKWebView-Abnahme und dauerhafte SLO-Aggregate bleiben offen. Keine vollständige Audit-Erledigung behaupten.

# MID v0.9.85.217 · MID-C25: zugängliche Kartenwertanzeige

Basis main=mid-stable 77a6336554a2ceb32fdbfa3dc988d4dc7fc8012a (.216). Der gemeinsame ModelMapProbe enthält interaktive Inhalte und verwendet daher den bestehenden AppPortalPopover-Dialog mit Fokusführung, Escape und Fokusrückgabe, nicht die Tooltip-Semantik. Automatische Schließung nach sechs/zehn Sekunden entfällt; bewusstes Schließen, Außenklick und Kontext-/Kartenbewegung bleiben erhalten. Keine Daten-/Zeit-/Einheiten-/Farbänderung. Bestehende Browsermatrix prüft nun Dialog, Lesedauer, Tab/Shift+Tab und Rückkehr zum Auslöser statt des absichtlich aufgehobenen Ablaufvertrags. Keine echte VoiceOver-/WKWebView-Abnahme behauptet.

RUC-Liveprobe 2026-10-09 17:22 UTC: ready/fresh/schemaValid=true, Run 15 UTC, 542040 Punkte, 15 Zeiten, 20 EPS-Mitglieder. Niederkassel forecast-fusion: active=true, rucAppliedHours=13, rucEpsAppliedHours=13, rucEpsMemberCount=20. Health-Worker meldet .195; das ist nicht die Web-/Stable-Version .216 und wird nicht als synchronisierte Buildidentität ausgegeben. Universelle Build-/Daten-/Render-IDs, Daten-/Nahtverträge, produktive Geräteperformance, VoiceOver und echte iOS-Abnahme bleiben offen. Veröffentlichung ausschließlich durch bestehendes Source-Gate/Bot/Installer/Stable-Verfahren.

Lokale Abnahme: npm ci, Produktionsbuild/Types, Produktions-Dependency-Audit ohne HIGH/CRITICAL, alle 954 Regressionen, echte Chromium-Native/WMS/Export/Navigation-Matrix auf fünf Viewports mit Light/Dark sowie 24 echte Skybar-Viewport/Theme/Design-Fälle erfolgreich. Ein erster zusätzlicher Browserlauf öffnete nach Schließen vor der bestehenden requestAnimationFrame-Fokusrückgabe; der Test wartet nun zwei Paint-Zyklen vor dem nächsten Tastaturflow. Vollständige Matrix erneut grün, ohne Abschwächung der Fokus-/Escape-/Cancel-/Missing-Data-Prüfungen. Generierte dist-/native-Webassets gehören nicht in den Source-PR.

# MID v0.9.85.216 · Intensivaudit: Widget-Renderbereitschaft und Erstfehlernachweis

Basis: verifiziertes main=mid-stable 5dbb92411193ffecb17216952ed4e0ce9f7622f5 (.215), Installer 37888419430 erfolgreich. Keine überlappende offene Entwicklungs-PR. Bestehende Skybar-/RUC-/Karten-/Release-Verträge bleiben erhalten.

Der gemeinsame Widget-Paint-Helper wartet auf Fonts, dekodierte nicht-defekte Bilder, zwei Paint-Zyklen und sichtbare verbundene Geometrie. URL-Exporte melden bei Fehlern ausdrücklich error statt ready; auch manuelle PNG-/Clipboard-Exporte verwenden denselben Helper. Veraltete asynchrone Abnahmen werden beim Effect-Cleanup verworfen. Ready-Ereignisse führen Versions- und Zeitbereichsmetadaten mit; der Zeitbereich ist kein behaupteter Modelllauf.

Der CDP-Renderer bewahrt je Ziel den ersten Fehler in einem separaten diagnostics-Unterordner: Screenshot, begrenzte Ladefehler ohne URLs/Headers/Response-Bodies, erwartete öffentliche Version, Stable-SHA, Renderstatus und verfügbarer Datenzeitbereich. Retry/Recovery überschreiben diese Dateien nicht. Terminale App-Fehler brechen sofort ab; fehlende Bereitschaft läuft weiter mit bestehendem Timeout. Das Workflow-Artefakt wird auch nach Renderfehlern gesichert; die Publish-Stufe bleibt fail-closed. Diagnosen werden nicht in das öffentliche 12-PNG-ZIP aufgenommen. Kanonischer Workflow und aktiver Spiegel werden gemeinsam synchronisiert.

Abnahme: Produktionsbuild und Types bestanden; neue Positive-/Negative-Regression einschließlich Font-/Bildfehlern; 24 bestehende App-/Widget-Fälle mit tatsächlichem PNG; weitere 24 URL-/Widget-Fälle mit echtem Bildfehler und Recovery; echter Chromium/CDP-Erstfehler-Screenshot, unveränderte Erstdiagnose über Retry und erfolgreicher PNG-Recovery bestanden. Bestehende iOS-Webasset-/Lifecycle-Gates werden beibehalten. Keine reale Geräte-/WKWebView-Abnahme behauptet.

Die konsolidierte Widget-Golden-Prüfung erhält nur für die bewusst geänderte Widget-Deklaration einen .216-Fingerprint; 116 weitere Deklarationen, CSS-Cascade, gemeinsame Kurve und SVG-Paint-Restore bleiben unverändert geschützt.

Auditpunkt 7 ist damit für Widget-Erstfehler/Ready-Gates weiter umgesetzt; langfristige SLO-Aggregate, universelle Build-/Daten-/Render-IDs, Geräte-/VoiceOver-/WKWebView-Abnahme und weitere Meteorologie-/Performance-Abnahmen aus dem .215-Statusdokument bleiben offen. Keine vollständige Audit-Erledigung behaupten.

# MID v0.9.85.215 · MID-C24: durchgehende Skybar und konkrete Intensivaudit-Abnahme

Gleiche angrenzende Skybar-Darstellungen werden im gemeinsamen SVG-Renderer einmal gezeichnet; Originalintervalle/Titel, Datenlücken und Niederschlags-Paint-Reihenfolge bleiben erhalten. Konkrete offene Auditschritte und Abnahmegrenzen: docs/implementation/MID_C24_SKYBAR_AUDIT_STATUS_0.9.85.215.md. Basis main=mid-stable a4e0031df84d46614b7fc5889f92577236d01680 (.214). Veröffentlichung ausschließlich durch Source-Gate, bestehenden Bot und Installer/Pages/Stable-Promotion.

# MID v0.9.85.214 · Intensivaudit Phase 3b: isolierte Karten-Speicherprobe

Verifizierte Basis main = mid-stable = 19b28d9e28bb05efa6e5e690f5e224566f62c551 (.213), Installer 37882113485 erfolgreich. Paralleländerungen .207–.213 vollständig erhalten. Branch codex/v0.9.85.214-audit-map-memory.

Die bestehende vollständige 24-Fälle-Kartenmatrix bleibt erhalten. Nach ihrem Abschluss läuft im Heavy-Shard 2/3 (oder lokal ohne Shard) ein zusätzlicher, isolierter 390px/Light/Next-Fall. Zwei Warmup-Rundwechsel ICON-EU→ICON-D2 füllen beide geprüften Modellcaches; danach 20 echte Rundwechsel über dieselben sichtbaren Controls. Jeder Wechsel wartet auf den aktuellen Modellstatus ohne Ladezustand sowie genau eine Synoptik-Flächenebene. Dieselbe ursprüngliche MapLibre-Instanz und genau eine Karte bleiben Pflicht. Die zusätzliche Probe ist klar als isolated-memory-cycles gekennzeichnet, damit ihre GC-/Stress-Frametimings nicht als unveränderte Phase-3a-Baseline verglichen werden.

Chrome DevTools Protocol sammelt nach Garbage Collection H0/H5/H10/H15/H20: V8-Isolate used/allocated heap, optional ArrayBuffer/external-string backing storage sowie DOM-Dokumente/Knoten/Listener. Das ist weder gesamter Browser-/GPU-/Worker-Speicher noch ein WKWebView-Profil. Ein synthetischer Trend allein beweist keinen Leak. Ausgabe enthält absolute Proben, Deltas, strictlyIncreasingHeap als rein beschreibenden Befund und p95 der 20 Roundtrip-Laufzeiten. Keine willkürlichen Heap-/FPS-Grenzen, keine Budgetlockerung, keine User-Telemetrie. Defekte/unvollständige Pflichtmessungen oder fehlerhafte Modellwechsel bleiben fatal; fehlende optionale backingStorage-Metrik wird null statt 0.

MID_MAP_TRACE=1 schreibt einen Chromium devtools.timeline/v8/blink.user_timing-Trace ausschließlich während der isolierten Zyklen nach /tmp/mid-map-cycles-390-light-next.json. Der Trace wird auch nach einem Zyklusfehler gestoppt; CDP-Session wird per finally freigegeben. CI-Normalweg erhebt Speicherproben ohne Tracing-Overhead. Schema mid.map.runtime.fixture.v2 nennt die echte package.json-Version statt der bisher fest codierten .210. Raw-JSON bleibt in bestehenden CI-Logs und /tmp; kompakte Speicherwerte ergänzen das Step-Summary. Keine Workflow-/Secret-/Ruleset-Änderungen.

Pflichtregression scripts/test-map-memory-profile-0985214.mjs prüft 2+20 Cycles, fünf GC-Proben in richtiger Reihenfolge, wachsende/fallende Werte, fehlende/kaputte Messungen, Durchreichen von CDP-/Modellfehlern und vollständiges Browser-Wiring. Beide Baseline-Inventare verlustfrei erweitert. Bestehende Core/Heavy/Responsive/iOS/Release-Gates bleiben unverändert.

Parallelstand: RUC-Bitmap-Reparatur .213 freigegeben. Issue #305 bleibt bis zur erfolgreichen neuen echten DWD-RUC/RUC-EPS-/Pages-Freshness-Abnahme offen. Die aktuelle Repo-Synchronität allein beweist keine frischen Wetterdaten. Weitere Auditpakete: Widget-readiness/Erstfehlerdiagnostik, produktfeste GRIB-Level-/shortName-Verträge mit echten Headern, Cross-Model-/Missing-Data-Prüfungen, A11y-Kartenalternative und iOS-Simulator-Lifecycle. SEC-001 aus dem PDF war durch aktive Rulesets bereits widerlegt (.207); Schutz nicht neu/parallel umbauen.

Primärquellen: https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage ; https://chromedevtools.github.io/devtools-protocol/tot/Memory/#method-getDOMCounters ; https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/#method-collectGarbage . Freigabe ausschließlich über Source-PR-Gate → MID Agent Source Release → serverseitiges ZIP → Installer → Worker/Pages → SHA-gebundene Stable-Promotion.

# MID v0.9.85.213 – Intensivaudit: DWD-RUC/GRIB2-Bitmap-Reparatur

## Gesicherte GitHub- und Produktivbasis
Verifizierter Ausgangsstand `main = mid-stable = e71171c0d477c0fbef51e17e9c21c399525ec94d`, v0.9.85.212. Vollständig freigegeben über PR #306 und Release-Installer. Neuer Branch: `chatgpt/v0.9.85.213-ruc-bitmap-recovery`. Offener Produktionsblocker #305.

## Ursachennachweis (nicht aus bloßer Vermutung)
Reale GitHub-Action-Protokolle, u.a. Run 37876446456: Pro `T_2M`-Vorhersageschritt genau 542.040 dekodierte Werte, Kelvin, davon 16.968 konstante 9999-K-Einträge (ca. 3,13 %) entlang des ICON-D2-RUC-Gitterrandes. Der bisherige Parser übernimmt ecCodes-`values` vor Prüfung des GRIB2-Section-6-`bitmap` direkt; seine Kelvin-Umrechnung macht daraus 9725,85 °C. Die korrekte Validierung `validate_core_fields` stoppt deshalb fail-closed mit `temperature_2m: decoded values exceed physical/semantic bounds`. Mehrere Stundenläufe nach v0.9.85.212 reproduzieren dieselbe maschinenlesbare Ursache.

## Umsetzung und semantische Grenzen
`tools/ruc/grib_bitmap.py`: Die GRIB2-`bitmapPresent`- und tatsächliche ecCodes-`bitmap`-Maske wird verbindlich angewendet, bevor die Originalwerte interpretiert oder in Einheiten normiert werden. Bitmap-Bit 0 = nicht definiertes Gitterelement (IEEE NaN). Bitmap-Bit 1 = physikalischer Modellwert. **Alle Zellen und ihre Indizes bleiben erhalten; keinerlei Kürzung, Neugitterung oder Maskenraten**. Unbekannte Indicator-Werte, fehlende/anders lange oder mehrwertige Bitmaps führen zu `MeteoIntegrityError`. Bloßer Zahlenwert 9999 ohne authentische Bitmaske darf nicht stillschweigend eliminiert werden. Auf dieselbe Funktion gehen die Kernfelder, optionalen Rapid-/Phasendaten, RUC-EPS-Member und Koordinaten-Grib. Unmaskierte CLAT/CLON bleiben unverändert.

Im bestehenden Wire-Packer werden IEEE NaN als der bereits etablierte Int16-Wert -32768 (oder bei EPS der UInt16-Wert 65535) kodiert. Unmaskierte, real falsche physikalische Werte werden weiterhin abgewiesen. Der bisherige WMO-/DWD-Phasenvertrag, native DWD-Signatur-/Provenienzprüfer, meteorologische Grenzwerte, fehlende Provider-Backups und alle RUC-Wire-Schemas bleiben unverändert.

## Tests und Abnahme
`tools/ruc/test_grib_bitmap.py`: produktive echte Zellanzahl und fehlender Randbereich, Kelvin->°C nur für gültige Zellen, native Grid-Ausrichtung, Wire-NODATA, fehlende/kaputte/mehrwertige Bitmap, kein unerlaubtes Erraten fehlender Daten bei unmaskierten 9999, physikalischer Validator weiterhin fail-closed. Die Tests sind in den verbindlichen Python-Testpfad `tools/ruc/test_fetch_resilience.py` eingebunden. Nach grünem vollständigen Source-Gate/Installer **muss ein echter vollständiger DWD-RUC-/EPS-Job inklusive Pages-Free-Veröffentlichung und Worker-Datenaktualität grün nachgewiesen** werden; vorher Issue #305 nicht schließen und niemals behaupten, die gesamte Produktionspipeline sei wiederhergestellt.

## Audit-Fortsetzung
Offene Schritte: vollständiger RUC-Probelauf samt Maskenquoten/Panel-Freshness; dokumentierte DWD-Parameter-/Level-Matrix; Karten-Timeline-Traces, mehrfache Performance-Proben, mobile Barrierefreiheit, iOS-WKWebView-Simulator. Bestehende Risiken #270 (Audit-Dependencies), #246 (alte einzigartige Branches), #176 (Agent-Broker) und PR #252/#253/#260 unverändert getrennt.

## Referenzen
DWD ICON-Modellbeschreibung https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf ; DWD ICON-D2-RUC Open Data https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/ ; dokumentierter Bitmap-Befund mit 16968 Randzellen https://github.com/KnownStormChaser/master-weather-model-list/blob/main/models/nwp_models/regional/germany/icon-d2-ruc.md .


# MID v0.9.85.212 · Intensivaudit: Karten-Themekontrast und RUC-Provenienz

Source-of-truth-Basis: main = mid-stable 055a6ead7b76b68751079935f1994fc8984bf534 (v0.9.85.211); ausschließlich chatgpt/v0.9.85.212-dark-map-ruc-audit für den Source-PR.

## I. Dark Mode, Accessibility, mobile Darstellung

Screenshotbefund: Die direkte Karten-Terminsteuerung in RadarPanel.tsx besitzt in UnifiedWeatherMap.css die Regel background:var(--card,#fff). --card ist nicht kanonisch definiert und der weiße Fallback produziert unter dunklem Theme ein kontrastarmes, sehr helles Formular mit nahezu unsichtbarer Schrift. Appweite native MID-Farbvariablen --surface, --text und --border statt nicht definiertem --card oder hartem Weiß; korrekter nativer color-scheme und Option-Hintergrund, sichtbarer Tastaturfokus, 44px Ziele, mobil <=430px Aufteilung des zusätzlichen Aktuell-Buttons auf volle Zeile. Keine JS-Zeit-/Radar-/Datenänderung.

Tests: scripts/test-map-direct-time-theme-0985212.mjs schützt CSS/Fokus/Touch-/Theme-Vertrag als Core-Regression. Die bestehende echte Chromium-/MapLibre-Matrix scripts/verify-unified-map-browser-0985167.mjs prüft für alle dort verfügbaren Viewport-/Light-/Dark-/Designkombinationen Hintergrundhelligkeit und WCAG-AA-Textkontrast >=4,5 der aktivierten Bedienelemente sowie bereits vorhandene 44px und Overflow-Prüfungen. Browserwerte stammen aus synthetischer kontrollierter Kartenfixture, nicht aus Telemetrie realer Nutzender.

## II. RUC-Integrität: ISSUE #305, bewusst offen

Lauf https://github.com/MeteoMartini/MID/actions/runs/37853501210 scheitert in prepare weiterhin an unplausibel dekodiertem T_2M; Fail-Closed-Meteorologie-Gate bleibt unverändert. Bis zur nachgewiesenen Ursache darf kein ungeprüfter Fallback in die produktive RUC-Veröffentlichung einfließen. tools/ruc/build_ruc_bundle.py protokolliert nur bei Validierungsfehlern begrenzte per-Lead-Provenienz: GRIB-Dateiname, UTC-Valid-Time, Einheiten, Anzahl und Zahl nicht endlicher Zellen, Minimum/Maximum nativer und normierter Werte, Anzahl außerhalb des bestehenden °C-Sanity-Bereichs. Kein Rohfeld, kein Geheimnis, kein vollständiges GRID-Logging; Validator wird weder abgeschwächt noch abgefangen, sondern Fehler bleiben fatal. tools/ruc/test_temperature_decode_audit.py prüft Kelvin->C, C unverändert, NaN/Sentinel-Aggregat und fortdauernde Fehler bei physikalisch ungültigen Temperaturen. Der nächste echte DWD-Preprocessing-Run muss erst Ursache (Encoding, Bitmap/Missing, Unit) belegen. Anschließend separate validierte Korrektur, erneuter vollständiger RUC-Run und Pages-Snapshot. Issue NICHT abschließen ohne Produktivbeleg.

## III. GitHub offene Arbeit geprüft, nicht überstürzt gelöscht oder gemergt

- #305 offen: blockierter DWD-RUC-Produktivlauf; .212 liefert Diagnostik, keine Ursachenbehauptung, keine Gate-Umgehung.
- #270 offen: nächtliche Revision Audit failure; Beispiel https://github.com/MeteoMartini/MID/actions/runs/37764900622 bestätigt npm-audit-Befunde uuid@7.0.3 sowie source-map-js@1.2.1. Auch im verifizierten .212-Lockfile vorhanden; @capacitor/cli steht bereits bei 8.5.2. Abhängigkeitsgraph, Advisory-Fix und CI-/iOS-Kompatibilität müssen separat nachgewiesen werden. Keine npm-audit-Ausnahmeregel.
- #246 offen: zwei alte Branches mit einzigartigen Commits, niemals ohne SHA-verifizierte Sicherung löschen.
- #176 offen: Agent-Ref-Broker ist bewusst ein dauerhaftes Steuer-/Integrationsobjekt.
- PR #260 (13 Dependencies), #252 (pako v2→v3, API-/Export-Breaking-Change) und #253 (Wrangler Action) sind aktuell mergeable=false, z. T. veraltet. Keine automatische Versionserhöhung, Rebase, manuelle Merge-Umgehung oder Workflow-Änderung. Nach getrennten Kompatibilitäts-/Security-Tests und neuem Stable-Base-Check über normalen Source-PR einarbeiten.

## Auditfortsetzung und Freigabe

Map-/Timeline-Performance-Baseline aus .210 bleibt unverändert (Phase 3a); weiterführende Profile für Speicher und Interaktion (3b) erst aus reproduzierbaren Chromium-Traces, getrennt von diesem UI-/RUC-Blocker. Vollständiges Source-PR-Gate, deterministische Regressionen, Heavy-Map/Responsive, Python/RUC, Security/Build/iOS, Agent-Automerge, Release-ZIP, Installer und Worker/Pages- sowie SHA-geprüfte Stable-Promotion bleiben verbindlich.


# MID v0.9.85.211 – Sonderprüfung WMO-Niederschlagsphase und Kurzfrist-Zeitbezug

SHA-verifizierte Basis: main = mid-stable fb289175c0eb4e414900d6d645f9c5ed814c5d44 / v0.9.85.210. WMO-4677 Codes 66/67 stehen für gefrierenden Regen, 68/69 für Regen und Schnee gemischt. Positive Lufttemperatur allein schließt gefrierenden Regen bei kalter Oberfläche nicht aus. MID prüft die modellierte warme Oberfläche >=1,5 °C sowie T2m >=1,5 °C und Feuchtkugel >=1 °C als konservative Plausibilitätskorrektur nur von unbestätigten Forecast-Codes auf gewöhnlichen Regen. Fehlende oder kalte Bodenwerte bleiben vorsichtshalber kein Widerspruch. Ein bei positiver Luft-/Feuchtkugeltemperatur verbleibendes unbestätigtes Gefriersignal wird als möglich formuliert, ohne den WMO-Code oder vorhandenes Gefährdungssignal zu verfälschen. Diese MID-Fachgrenzen sind keine amtlichen DWD-Warnschwellen. Beobachtete Phänomene werden niemals umklassifiziert. FZRA und FZDZ verwenden ein eigenes Glätte-Oberflächenzeichen statt der mit Schneeregen verwechselbaren Schneekristallmarkierung; Schneeregen bleibt Regen plus Schneekristall.

Die Kurzfristüberschrift referenziert nun dieselben aggregierten vorwärts gerichteten Stundenintervalle wie das sichtbare Wetterprofil, bevorzugt innerhalb der ersten betroffenen Stunde den frühesten tatsächlich nassen nativen 15-min-Slot und verwendet dessen Intervallbeginn. Wahrscheinlichkeit bei 0 mm ist kein sicherer Regenbeginn. Die 90-min-Kacheln zeigen keine redundante Wolken-%-Zeile; der wissenschaftliche Skybarwert und seine Erklärung bleiben erhalten. Regressionen: scripts/test-precipitation-shortterm-coherence-0985211.mjs und aktualisierter C23-Sunset-Browsercheck; bestehende Mountain-Kälte-/Regen-Gates unverändert. Kein neuer Datenprovider, kein Release-Shortcut, keine Workerfunktion oder Kosten. Vollständige Source-/Installer-/Pages-/Stable-Gates erforderlich.

Primärquellen: https://confluence.ecmwf.int/spaces/ECC/pages/45023980/WMO%2B6%2Bcode-flag%2Btable ; DWD https://www.dwd.de/DE/leistungen/pbfb_verlag_vub/pdf_einzelbaende/vub_16_gesamt_pdf.pdf?__blob=publicationFile&v=5 .

# MID v0.9.85.210 · Intensivaudit – Schritt 3a: automatische Karten-/Timeline-Laufzeitbaseline

Verifizierte Basis main = mid-stable 722ca3b96f142e96cb6e99d1b7038f48d6386fec (v0.9.85.209). Das bestehende echte Headless-Chromium-QA-Szenario scripts/verify-unified-map-browser-0985167.mjs erhält optionale, nichtproduktive PerformanceObserver- und requestAnimationFrame-Proben. In allen vorhandenen isolierten Heavy-Karten-Shards werden 390px/Tablet/Desktop sowie weitere bisherige Viewports, Light/Dark und klassisches/modernes Design durchlaufen, sofern bereits vom Shard unterstützt. Gemessen werden Zeit bis zum initialen interaktiven Kartenstatus, p95 der aufgezeichneten Frame-Abstände, Anzahl/Maximum der Long Tasks und die im Browser verfügbare letzte LCP-Zeit. Vor vorhandenen Page-Reloads und am Testende werden einzelne Phasen snapshotsicher ausgewertet. Messwerte stehen als schema-versionierte JSON-Datei /tmp/mid-map-runtime-baseline-<shard>.json und als Tabelle im jeweiligen GitHub-Step-Summary. Neue nichtproduktive Statistik-/Browser-Probe-Module: scripts/lib/mapBaselineStatistics.mjs und scripts/lib/mapBrowserPerformanceProbe.mjs; der Pflichtregressionstest scripts/test-map-runtime-baseline-0985210.mjs prüft positive/negative Perzentilfälle und das reale QA-Wiring.

Abgrenzung: Dies ist eine **synthetische Vite-/MapLibre-Karten-Fixture mit simulierten Daten** unter CI-Last, nicht Real-User-Monitoring und nicht die Feldmetrik p75-LCP/INP/CLS. Daher werden keine unkalibrierten Laufzeitgrenzwerte oder feste FPS-Regressionsgates eingeführt; bestehende harte Bundlesicherheitsbudgets aus MID_PERFORMANCE_BASELINE.json und sämtliche Produkt-/Source-/Installer-Gates bleiben unverändert. Der nächste Audit-Schritt vermisst nach mehreren stabilen CI-Durchläufen die Varianz, erstellt gegebenenfalls Chrome-Trace/Heap-Baselines für 20 Karten-Zyklen und prüft Preview-Lighthouse und mobile/Native-WKWebView separat. Keine kostenpflichtigen Angebote, keine Datenquellen-/Workerlogik- oder UI-Änderungen.

Freigabe ausschließlich über Source-PR-Gate → Bot-Merge → serverseitiges Release-ZIP → Installer → Worker-/Pages-Prüfung → Stable-Promotion.

# MID v0.9.85.209 · Intensivaudit – GRIB2-Metadatenhärtung (Schritt 2b)

Verifizierte Basis main = mid-stable 419da8d3d780a142a9b25e50ae6e210be06acddb (v0.9.85.208). GRIB-Herkunft in tools/ruc/grib_metadata.py, fetch_and_build_ruc.py und build_ruc_bundle.py gehärtet: GRIB-Edition 2 und WMO-Ursprungszentrum 78 (DWD/Offenbach) aus der tatsächlichen Nachricht prüfen, Herkunft und Initialisierung der dynamischen deterministischen, Rapid-, optionalen und Ensemble-Felder sowie deren Gültigkeitszeiten kontrollieren. Innerhalb jedes logischen Produktparameters bleiben GRIB discipline/parameterCategory/parameterNumber/typeOfLevel/level/gridType/numberOfPoints invariant; doppelte Rapid-Zeiten oder EPS-Member-Zeitpaare werden abgewiesen. Koordinaten-GRIBs prüfen Edition und Zentrum, bleiben aber aufgrund ihrer Zeitunabhängigkeit von der strikten Run-Initialisierung ausgenommen.

Neue ecCodes-Positiv-/Negativtests in tools/ruc/test_grib_metadata.py sind im bereits verbindlichen Source-PR-Python-Testpfad aufgenommen. Die meteorologischen Plausibilitäts-, Taupunkt- und Niederschlagsakkumulationsprüfungen von v0.9.85.208 bleiben vollständig erhalten. Kein Parameter darf allein aufgrund des Dateinamens als fachlich richtig gelten. Weiter offen bleiben produktfeste shortName-/Level-Abbildungen nach vollständiger Verifikation echter DWD-v1-Produktheader: die jetzige Signaturprüfung erkennt innerhalb eines Produkts gemischte Felder, aber keine vollständig gleichförmig falsch etikettierte Produktfolge. Kein Sicherheits-/Workflow-/Secret-Umbau und keine neuen Kosten.

Quellen: WMO Manual on Codes 306 (gültig 01.06.2026) https://community.wmo.int/site/knowledge-hub/programmes-and-initiatives/wmo-information-system-wis/about-manual-codes-volume-i2/latest-version ; DWD GRIB2 https://www.dwd.de/DE/leistungen/opendata/help/modelle/grib2_erlaeuterungen.pdf?__blob=publicationFile&v=1 ; DWD ICON-D2-RUC v1 https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ . Freigabe ausschließlich über Source-PR-Gate, Agent-Merge, serverseitiges ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.208 · Intensivaudit – DWD/RUC-Integrität (Schritt 2)

Verifizierte Basis main = mid-stable: 2f3cd42a56fbf6625a901d68329d388889350754 / v0.9.85.207. Neuer fail-closed-Guard in tools/ruc/meteo_integrity.py; GRIB-Datenlauf-Initiierung und doppelte deterministische Gültigkeitszeiten werden im frühzeitigen Core-Coverage-Check geprüft. Vor der verlustbehafteten Serialisierung werden physikalische Grenzen der RUC-Kerndaten und der Taupunkt/Temperatur-Vertrag geprüft. Vor allen kumulativ→Intervall-Umrechnungen werden echte negative Sprünge unter -0,05 mm erkannt, statt wie bisher ohne Befund auf 0 mm gekappt zu werden (Deterministik, Rapid/Phase, EPS). Der numerische Toleranzwert ist ausdrücklich ein MID-Validierungs-Gate und keine amtliche DWD-Warnschwelle. Test: neue Offline-Positiv-/Negativfälle einschließlich extremer gültiger Temperaturen und fehlender Daten in tools/ruc/test_meteo_integrity.py, automatisch zusammen mit dem bereits Source-Gate-pflichtigen tools/ruc/test_fetch_resilience.py. Keine neue Quelle, kein Secret, keine UI-Änderung und keine abgeschwächten Release-Gates.

Offene weitere Schritte des Audits: strikter GRIB-Parameter-/Level-Metadatenvertrag auf Basis real nachgewiesener DWD-Felder, granulare Missing-Data-Quoten, Cross-Model-Prüfung, Performance-Baselines und iOS-Simulator-Smokes. Release ausschließlich nach vollem Source-Gate, Server-ZIP, Installer, Worker/Pages und Stable-Promotion.

# MID v0.9.85.207 · Intensivaudit – Build-Identität

Intensivaudit-Schritt 1: Der Auditbefund, main/mid-stable seien ungeschützt, war falsch. GitHub bestätigt aktive MID Production Branch Guard, MID Stable Protection mit Pflichtcheck und gesonderte Agent-/Replit-Regeln. Verifizierte Basis: main = mid-stable = 541ba0b77dc932288bf68ab78b0efd7925045a47 (v0.9.85.206). Nach dem Vite-Build erzeugt scripts/write-build-identity.mjs eine dist/mid-build-identity.json mit exakter Quellversion, möglicher Quell-SHA, Build-UTC, Anzahl Dateien und SHA-256 der gebauten Assets. Fehlerhafte Versionen oder fehlende JavaScript-Assets stoppen den Build. Neue Positiv-/Negativregression scripts/test-build-identity-0985207.mjs. Build-Quell-SHA, Release-Packaging-SHA und Stable-Promotion-SHA sind verschiedene vertragskonforme Identitäten und dürfen nicht blind gleichgesetzt werden. Wetter-, Daten-, Release- und Sicherheitsfunktionen bleiben unverändert.

# MID v0.9.85.206

Die 90-Minuten-Kacheln zeigen zusätzlich den Bewölkungswert ihres jeweiligen Zeitschritts. Die Skybar erklärt ihre Schwellen und die breite Nacht-Hinterlegung. Vorhandene Werte unter den Bandschwellen bleiben als solche erkennbar und werden nicht als fehlende Daten bezeichnet.

Fehlende Bewölkungswerte werden in gemeinsamen Wetterzeichen, Periodenmitteln, Wolkenschichten und Kurzfrist-Fallbacks nicht mehr als 0 % ausgewertet. In den 3-Stunden-Details folgen trockene Wetterbeschreibung und Wetterzeichen nun demselben Bewölkungsmittelwert. Das 24-h-Profil besitzt einen korrigierten Erklärungstext und kompakter angeordnete Hinweise auf breiten Bildschirmen. Echte Nullwerte, Bandfarben und meteorologische Schwellen bleiben erhalten.

Verifizierte Basis: main = mid-stable = 5abd95581f254b2612d94612dcab73b6c8ba75ce (.205). Details: docs/implementation/MID_C23_CLOUD_AUDIT_0.9.85.206.md. Synoptikhorizonte und sämtliche Veröffentlichungsgates bleiben erhalten.

# MID v0.9.85.205 · Vollständiger veröffentlichter Kartenhorizont

Nachprüfung von MID-C23: Die feste 204h-Navigationsgrenze würde die neu gültigen IFS-/GFS-Endpunkte abschneiden. Das Kartenfenster wird daher aus dem letzten tatsächlich veröffentlichten Modelltermin abgeleitet; es erzeugt keine Termine. Verifizierte Basis main = mid-stable = fe2f97fb77fe401ae86bf8b7d2d6330c7490762b (.204), live bestätigt. Gezielte Funktionsregression und sämtliche 24 Karten-Browserfälle schützen +360/+384h, Wochentag und Rückwechsel auf D2. Die vorhandenen Quelltexttests werden auf diese ausdrücklich erweiterte Grenze präzisiert. Details: docs/implementation/MID_C23_FULL_HORIZON_0.9.85.205.md.

# MID v0.9.85.204 · Bewölkung und längere Synoptik

Das 24-Stunden-Profil verwendet für Bewölkungswerte, Wetterzeichen und Skybar denselben Stundenstand. Die 90-Minuten-Ansicht behält ihre feinere Auflösung. Nachtfelder nennen den tatsächlichen Bewölkungswert und werden bei unbekannten Daten nicht als klare Nacht ausgegeben.

Die Synoptik prüft zusätzlich ICON Global sowie modellabhängige längere Horizonte: ICON-EU bis +120 h, ICON Global laufabhängig bis +120/+180 h, IFS bis +360 h und GFS bis +384 h. Angeboten werden ausschließlich vollständige Termine desselben Laufs, soweit Daten und das unveränderte Speicherbudget verfügbar sind. Spätere Termine nutzen ein gröberes, gekennzeichnetes Übersichtsraster. Navigation und Terminauswahl zeigen den zweibuchstabigen Wochentag.

Integrationsbasis: main = mid-stable 19447694b3077dc2332784d3feb6477de06eef5c (.203), vollständig freigegeben; Refreshkorrektur erhalten. Details: docs/implementation/MID_C23_CLOUD_SYNOPTIC_0.9.85.204.md. Bestehende Gates und Budgets bleiben verbindlich.

# MID v0.9.85.203 · Synoptik-Katalog ohne Terminverlust aktualisieren

Beim Neuladen bleibt der letzte geprüfte und noch gültige Synoptikkatalog sichtbar. Modellwahl, Kartenzeitachse und manuell gewählte Gültigkeitszeit bleiben während einer verzögerten Antwort erhalten. Das angebotene Zeitfenster hängt vom bestätigten Modellkatalog ab, auch wenn der bisherige Termin außerhalb eines neu gewählten Modells liegt.

Die Kartenprüfung kontrolliert feste Gültigkeitszeiten statt veränderlicher Listenpositionen und hält die Katalogantwort gezielt zurück. Die Synoptikdarstellung, erweiterten Modelltermine und RUC-Recovery aus .202 bleiben erhalten.

Basis: main = mid-stable 7139d589f8b0c2bee94d0c64942bb78e25c22589 (.202). Details: docs/implementation/MID_C23_SYNOPTIC_REFRESH_0.9.85.203.md. Unveränderte Release-, Sicherheits-, Frische- und Datenbudgetgates.

# MID v0.9.85.202 · Synoptik-Komposit und Kartenzeitsteuerung

Theta-E 850 hPa erhält dezente graue Konturen; die Linienbeschriftung erscheint nur bei Vielfachen von 12 °C. Die blauen Feuchtelinien in 700 hPa bleiben ohne Linienbeschriftung.

Die fokussierte Wetterkarte wechselt mit den Pfeiltasten links/rechts zum vorherigen/nächsten bestätigten Termin. Eingabefelder und Regler behalten ihre eigene Bedienung.

Für ICON-EU, GFS und IFS werden zusätzlich +60 und +72 Stunden angeboten, soweit vollständige Felder aus demselben Lauf verfügbar sind und das bestehende Datenbudget ausreicht. ICON-D2 bleibt auf seinen regionalen Ausschnitt und 48 Stunden begrenzt. Der große Europa-Ausschnitt und die 6-Grad-Farbstufen aus .200 bleiben erhalten.

Basis: main = mid-stable f654bd172a7afc43f307f6dd0663e9ce00b625cb (.201). Details: docs/implementation/MID_C22_SYNOPTIC_TIMELINE_0.9.85.202.md. Bestehende Release-, Sicherheits- und RUC-Frischegates bleiben verbindlich.

# MID v0.9.85.201

RUC-Kurzfristdaten werden nach erfolgreichen MID-Veröffentlichungen automatisch auf Aktualität geprüft und bei Bedarf nachgeholt. Ein erfolgreicher Verarbeitungslauf ohne tatsächlich veröffentlichte Daten unterdrückt die Wiederaufnahme nicht mehr.

RUC-Übergabeartefakte erhalten pro Ausführungsversuch eindeutige Namen. Der bestehende Vier-Stunden-Frischevertrag, Datenbudgets sowie Release- und Sicherheitsprüfungen bleiben erhalten.

Basis: main = mid-stable c3f3abebfd5e3da86013063d7b051b05399e3876 (v0.9.85.200). Details: docs/implementation/MID_C22_RUC_RECOVERY_0.9.85.201.md.

# MID v0.9.85.200 · MID-C21 Synoptik und Bildwechsel

Verifizierte neue Basis: main = mid-stable = `5b8632355396ff1d6bf25dc20d7edd83415c021e` (.199), parallele Widget-Korrektur erhalten. Europaausschnitt, 60-kt-Pfeile, Theta-E-Stufen/RH700-Konturen, optionale vollständige Termine sowie gepufferte Bildwechsel. Details: docs/implementation/MID_C21_SYNOPTIC_BUFFERING_0.9.85.200.md. Bestehende Source-/Installer-Gates und Datenbudgets bleiben verbindlich.

# MID v0.9.85.199 · Widget-Kurvenkopf kompakt

Verifizierte Ausgangsbasis `main = mid-stable = 36110a193328b0e4a5978e742e3768a8fcd9664f` (.198). Alle Parallelstandsänderungen bis hierher bleiben erhalten. Widget-only Headerrendering via `presentationReady`; 7d-App-Ansicht unverändert. Regressionsschutz in scripts/test-widget-curve-label-spacing-0985191.mjs; reguläres Source-/Installer-/Pages-/Stable-Gate. Details: docs/implementation/MID_C21_CURVE_WIDGET_COMPACT_0.9.85.199.md.

# MID v0.9.85.198 · MID-C21 Karten und RUC-Veröffentlichung

Basis b27bd472e228c59a9cc36e7305307b775623288a (.197). Details: docs/implementation/MID_C21_MAP_RUC_0.9.85.198.md. Bestehende Source-/Installer-Gates bleiben verbindlich.

## MID v0.9.85.197 · MID-C21 Wetterkarte, Synoptik und iPad-Rückkehr

Verifizierte Basis: main = mid-stable = `55bde6e4ed20127a32403c54546379fb6e86943c` (.196). Current-UI mit Skybar über dem Graphen, eine auswählbare OSM-Topologie, native fünfteilige GRIB-Synoptik und getrennte Inhalts-/Menü-Rückkehr. Handoff grün: Run 37694186641 für Head 6e4d3fc39ace83ae17c3b5a71e6ed9c06a902030. Details: `docs/implementation/MID_C21_CURRENT_WEATHER_0.9.85.197.md`. Sämtliche Release-/Sicherheitsgates unverändert.

## MID v0.9.85.196 · MID-C21 vollständiger Handoff

Verifizierte Basis: main = mid-stable = `cd3f88d3852591a6375fb46701f11708d118b6f1` (.195). Der read-only Handoff-Gate erhält für den unveränderten vollständigen Verify-Aufruf 25 statt 15 Minuten innerhalb des bestehenden 30-Minuten-Jobrahmens. Grund: Run 37683018228 meldete bis 900/938 Tests null Fehler und wurde am Zeitlimit beendet. UI-Übernahme folgt erst nach erneut grünem Handoff auf aktueller Stable-Basis. Details: `docs/implementation/MID_C21_HANDOFF_TIME_BUDGET_0.9.85.196.md`. Sämtliche Berechtigungen, Prüfungen und Releasegrenzen unverändert.

## MID v0.9.85.194 · MID-C20 Windereignisse statt redundanter Hinweise

Verifizierte Basis: main = mid-stable = b228e682cb8ea71979b8e296a30aaf8d5ee6fd0d (.193). Inhaltlich gleiche Windhinweise werden nach der probabilistischen Fensterbildung bei zeitlicher Überlappung kanonisch zusammengeführt. Unsicherheit bleibt sichtbar; amtliche Warnungen, verschiedene Stufen/Richtungen/konvektive Risiken und kumulative Niederschlagsfenster bleiben getrennt. Der separate Stundenkurven-Screenshot ist ohne Ort/Modell/Originalstand noch nicht reproduziert und wird nicht pauschal geglättet. Details: docs/implementation/MID_C20_WARNING_EPISODES_0.9.85.194.md. Alle bestehenden Releasegates unverändert.

## MID v0.9.85.193 · MID-C20 vollständige parallele Installerprüfung

Verifizierte Basis: main = mid-stable = 9998db3dd5358101717ecd16482f7f88e4983ebb (.192). Der Installer verteilt das vollständige Regressionsinventar auf Core und isolierte Heavy-Jobs; die Unified-Map-Matrix behält alle 24 Fälle in drei disjunkten Gruppen. Ein eventgebundener Snapshot mit Manifest-/Archiv-/Datei-Hashes wird an jedem Jobübergang vollständig geprüft. Commit und Deployment benötigen den Erfolg des Core und der ganzen Heavy-Matrix. Laufzeitberichte dienen ausschließlich der Diagnose, niemals als Prüfergebnis-Cache. Alle nachfolgenden Worker-/RUC-/Pages-/Stable- und main-Race-Gates bleiben unverändert. Details: docs/implementation/MID_C20_INSTALLER_SHARDING_0.9.85.193.md.

## MID v0.9.85.192 · MID-C20 Kurvenwidget-Ortskopf

Verifizierte Basis: main = mid-stable = df7df09c167b7c482e31c27e64aefa77148bc5ad (.191). Tageskarten und Kurvenwidget besitzen einen gemeinsamen Ortskopf innerhalb der Exportfläche. Ortsname, Koordinaten, Höhe und Ortszeit stimmen damit in Vorschau, URL-Widget, PNG und Zwischenablage überein. Ensemble und sämtliche Sicherheits-/Releasegates bleiben unverändert. Details: docs/implementation/MID_C20_WIDGET_LOCATION_0.9.85.192.md.

## MID v0.9.85.191 · MID-C20 Warnungscenter und Regressionslaufzeit

Verifizierte Basis: `main = mid-stable = 118b0fe24a66205d5d9624716719dd6b562ee0d3` (v0.9.85.190). Aktuelle und anstehende Hinweise werden explizit getrennt. Amtliche und MID-Details öffnen beim Einstieg und erneuter Warnungsnavigation; manuelles Einklappen bleibt möglich. Budgetprüfungen erfassen weiterhin sämtliche Dateien mit unveränderten Grenzen; Kompression wird nur für die ohnehin ausgegebenen 18 größten Dateien berechnet. Details: `docs/implementation/MID_C20_WARNINGS_PERFORMANCE_0.9.85.191.md`. Bestehender Source-/Installer-/Worker-/Pages-/Stable-Pfad unverändert.

## MID v0.9.85.190 · Installer-Zeitbudget und RUC-Wiederaufnahme

Verifizierte Stable-Basis: `6dd6205ab53b2f1aa4d543acb120e51cce1775da` (.188). Der vollständig bekannte .189-Quellstand aus PR #281 (`0dc39b21f8e2c3f1a98f43f241583f144b5fabca`) wird erhalten. Main steht auf dem serverseitigen .189-Release-Commit `e1d00aa04f09b956bd122a78a4c1efb4e8ccb805`; .189 ist wegen Installer-Timeout nicht freigegeben. Details: `docs/implementation/MID_C19_RUC_RELEASE_0.9.85.190.md`. Kein manueller Merge/Dispatch/Stable-Update, kein Entfernen von Release- oder RUC-Snapshot-Gates.

## MID v0.9.85.189 · Robuste Favoriten-Ortsauswahl und getrennte Prognosehorizonte

Basis: `main = mid-stable = 6dd6205ab53b2f1aa4d543acb120e51cce1775da` (.188), nach erfolgreichem Installer/Worker/Pages/Stable-Abschluss. Die gemeinsame Ortsauswahl nutzt die direkten dauerhaften Speicherfunktionen und lässt Speicherfehler nicht mehr die aktive Auswahl abbrechen. Die Favoritenleiste besitzt statt einer timerabhängigen globalen Sperre einen gesten- und favoritengebundenen, selbst ablaufenden Duplicate-Token. Details: `docs/implementation/MID_FAVORITE_RESILIENCE_0.9.85.189.md`.

Das 14-Tage-Entwicklungsdiagramm reicht die vorhandenen gewichteten Tagesquantile für Tmax und Tmin vollständig weiter (P10/P25/P75/P90), ohne Ensemble-Methodik oder Gewichte zu verändern. Best-Match-Fallback erzeugt keine künstlichen Intervalle. Die Phasenübersicht ist kompakter. 46d und Saison besitzen gegenseitig exklusive Darstellung und Datenaktivierung; Saisonabrufe starten erst bei ausdrücklicher Auswahl und werden beim Verlassen abgebrochen. Classic erhält eine explizite Horizontwahl. Der alte Texttest .097825 wurde dem ausdrücklich erweiterten Tmax/Tmin-Vertrag angepasst, nicht gelockert.

## MID v0.9.85.188 · Widget-Export viermal täglich

Basis: `main = mid-stable = 2a8370734e98f2c9c1d6da30ad30d9ee5a87aa34` (v0.9.85.187). Der serverseitige Export der zwölf festen MID-Widget-PNGs wird automatisch ausschließlich viermal täglich im 6-Stunden-Abstand ausgeführt: 00:17, 06:17, 12:17 und 18:17 UTC. Die bisherigen automatischen Zusatztrigger nach erfolgreichem MID-Release und bei `mid-stable`-Push entfallen, damit keine redundanten Renderläufe entstehen. `workflow_dispatch` bleibt als bewusster manueller Diagnose-/Notfallstart erhalten. Renderer, Profile, Validierung, Retry-Logik und das rollierende `widget-latest`-Paket bleiben unverändert. Details: `docs/implementation/MID_WIDGET_CADENCE_0.9.85.188.md`.

## MID v0.9.85.187 · Phasenprüfung und Karten-Kontrast

Basis: main = mid-stable = 251718eec0e792c4fd47eb59610a1fdaec62157c (.186). Fachlich getrennte gefrierende und gemischte Niederschlagsphasen; keine Eisregenableitung aus kaltem Schneeniederschlag. Kartenbedienung und kompakte zeitgebundene Ortswerte in allen Designs. Details docs/implementation/MID_C18_PHASE_MAP_0.9.85.187.md.

## MID v0.9.85.186 · Karten-Layer mit verlässlichen Linien

Basis: `main = mid-stable = c33588bd76a7a169cbaad0bf98539f3c99080471` (v0.9.85.185). Radar und Satellit lassen sich unabhängig vollständig abwählen. Automatische Modell-Darstellung bevorzugt darüber geprüfte Linien; Flächen bleiben optional. Responsive Layer-Schalter, einmalige Ortsbeschriftung und kompakte Favoriten vermeiden Überlappungen und irreführende Nichtverfügbarkeitsmeldungen. Native Isobaren und bestätigte DWD-WMS-Stile benötigen kein Flächenraster. Paralleländerungen .181–.185 bleiben erhalten. Details: `docs/implementation/MID_C18_MAP_LINES_0.9.85.186.md`.

## MID v0.9.85.185 · Getrennter DNS-Credential-Pfad

Basis: `main = v0.9.85.184 @ d35659371f48099676409f93add33c4599bf07ec`, `mid-stable = v0.9.85.182 @ 34d41442de1bb8e984dedca0e786dabb5b9f5ee1`. Der erneute .184-Installerlauf bestätigte Worker-Staging, 0-%-/100-%-Smoke und RUC, scheiterte aber erneut beim DNS-Lesen mit HTTP 403, weil der DNS-Schritt weiterhin den Worker-CI-Token verwendete. v0.9.85.185 trennt die Berechtigungen: Nur der Schritt für den bestehenden `www.midwx.app`-CNAME erhält `secrets.CLOUDFLARE_DNS_API_TOKEN`; Worker-Deploy und Workers Route behalten `secrets.CLOUDFLARE_API_TOKEN`. Fehlt der separate DNS-Token oder ist er unzureichend berechtigt, bleibt der Release fail-closed vor Pages und Stable. Details: `docs/implementation/MID_DNS_TOKEN_SPLIT_0.9.85.185.md`.

## MID v0.9.85.184 · Same-Origin-DNS-Hotfix

Basis: `main = v0.9.85.183 @ 61fc2634651b865e571496da6eaf3dd0378c760b`, `mid-stable = v0.9.85.182 @ 34d41442de1bb8e984dedca0e786dabb5b9f5ee1`. Der .183-Worker selbst war gesund, die bestätigte Route `www.midwx.app/api/mid-worker*` blieb jedoch öffentlich 404, weil `www.midwx.app` noch nicht durch den Cloudflare-Proxy lief. v0.9.85.184 ergänzt deshalb ausschließlich ein fail-closed DNS-Gate, das beim vorhandenen eindeutigen CNAME nur `proxied=true` aktiviert und Ziel, Typ, Name, TLS sowie alle anderen Records unangetastet lässt. Danach bleiben Route- und Same-Origin-Health-Gates unverändert verbindlich. Details: `docs/implementation/MID_WWW_PROXY_HOTFIX_0.9.85.184.md`.

## MID v0.9.85.183 · Corporate-safe Same-Origin Data Plane

Basis: `main = mid-stable = 34d41442de1bb8e984dedca0e786dabb5b9f5ee1` (v0.9.85.182). Im produktiven Web ist `https://www.midwx.app/api/mid-worker` der kanonische und einzige Browserpfad für Warnungen, ICON-D2-RUC/RUC-EPS sowie Radar-/Satelliten- und moderne Kartenbasisdaten. Geschlossene Worker-Proxys ersetzen direkte Drittanbieterabrufe; die exakte Cloudflare-Route wird vor Pages/Stable fail-closed geprüft und der Same-Origin-Endpunkt versionsgenau gesmoked. Eine neue Verbindungsdiagnose trennt „keine Wetterinformation“ von 403/Netzwerkfilter/Timeout. Details: `docs/implementation/MID_CORPORATE_SAFE_DATA_PLANE_0.9.85.183.md`.

## MID v0.9.85.182 · Resilienter serverseitiger Widget-Export

Basis: `main = mid-stable = a855f418c3fa00af40da8ccedcd2b1a7c05b02b9` (v0.9.85.181). Der Widget-Workflow erzeugte acht PNGs erfolgreich und brach anschließend bei einem transienten Wetterabruf-Timeout für eine einzelne Kürecik-Variante ab. Ab v0.9.85.182 darf jede einzelne Variante höchstens drei kontrollierte Render-Versuche mit 180-s-Zeitfenster durchführen; partielle Dateien werden vor jedem Retry entfernt. Erst nach drei Fehlschlägen wird weiterhin fail-closed abgebrochen. Matrix, Datenlogik, URLs und SharePoint-Übergabe bleiben unverändert. Details: `docs/implementation/MID_WIDGET_RENDER_RETRY_0.9.85.182.md`.

## MID v0.9.85.181 · Cross-Platform-CDP für Widget-PNGs

Basis: `main = mid-stable = 3fe968e5127a34d2e820e0d2e367d9cfb388ca35` (v0.9.85.180). Der serverseitige Widget-Workflow war fachlich korrekt getriggert, scheiterte jedoch reproduzierbar auf GitHub Ubuntu, weil der bestehende Capture-Renderer den CDP-Browserpfad noch auf Edge ausgerichtet hatte. Ab v0.9.85.181 erkennt der Renderer Edge/Chrome/Chromium plattformübergreifend, akzeptiert `MID_WIDGET_BROWSER`/`--browser`, überwacht Browserstart und -exit fail-fast und verwendet auf Linux die CI-tauglichen Headless-Flags. Der Workflow führt zusätzlich einen expliziten Browser-Preflight durch. Widgetprofile, MID-Daten und Wetterlogik bleiben unverändert. Details: `docs/implementation/MID_WIDGET_BROWSER_RUNTIME_0.9.85.181.md`.

## MID v0.9.85.180

- Profilkopf kompakt: redundante Drucktrend-Karte entfernt, relevante Hinweise vollbreit und umbrechend. RUC zeigt Kandidat und tatsächlich aufbereiteten Lauf mit Datum/HHMMZ im Log und der Ergebnisübersicht.

- Stark-/Dauerregenhinweise markieren die tatsächlich nasse Phase statt trockener Vor- und Nachlaufstunden rollierender Summenfenster.
- Regenhinweise nennen die Standort-Modellsumme und DWD-Schwellen; unbelegte Ensemble-Bestätigung und erfundene Wahrscheinlichkeitsbereiche entfallen.
- Zeitlücken und Mehrstundenwerte dürfen keine Stunden-Warnschwellen vortäuschen. Amtliche Warnungen und Extremwettervorschau behalten ihre eigenen Quellen und Kriterien.

Details: docs/implementation/MID_C18_RAIN_EVIDENCE_0.9.85.180.md. Normaler SHA-gebundener Source-/Installer-Release.

## MID v0.9.85.179 · Deterministischer Widget-Export nach Stable-Promotion

Basis: `main = mid-stable = 16c007b264599c7162bd174d03179b2a4363d7e2` (v0.9.85.178). Der in v0.9.85.178 eingeführte Widget-Workflow erhält zusätzlich einen direkten `push`-Trigger für `mid-stable`, damit jede reguläre Stable-Promotion unmittelbar einen Renderlauf erzeugt. `workflow_run`, Stundenplan und `workflow_dispatch` bleiben als redundante Startwege bestehen. Die Render-/Publikationslogik selbst bleibt unverändert und weiterhin fail-closed. Details: `docs/implementation/MID_WIDGET_EXPORT_TRIGGER_0.9.85.179.md`.

## MID v0.9.85.178 · Automatischer Widget-Bildtransport

Basis: `main = mid-stable = d771d9cfaec65f6c13538a143f2c52b620c997c0` (v0.9.85.177). Die in v0.9.85.175 festgelegten zwölf Widgetprofile werden ab dieser Version serverseitig und reproduzierbar erzeugt. Der Workflow arbeitet ausschließlich gegen `mid-stable`, verifiziert vor jedem Lauf die lokale Stable-Version gegen die öffentlich ausgelieferte `www.midwx.app/version.json` und publiziert nur bei nachgewiesener Gleichheit. Rendering und Validierung sind read-only; die rollierenden Release-Assets werden ausschließlich mit einem kurzlebigen, auf `contents: write` begrenzten MID-Release-Bot-Token ersetzt. Kanonischer Transfergegenstand ist `mid-widget-export-latest.zip` mit Manifest und SHA-256. Ein adminfreier PowerShell-Downloader übernimmt Download, Integritätsprüfung und lokale Bereitstellung. Details: `docs/implementation/MID_WIDGET_EXPORT_AUTOMATION_0.9.85.178.md`.

## MID v0.9.85.177

- Bergwetter: Die Höhenwahl allein verändert keine geografische Modellzelle mehr; Nullgrad- und Schneefallgrenzen bleiben für dieselbe atmosphärische Säule konsistent.
- Wolkenuntergrenze und lokale Kondensationshöhe werden fachlich getrennt; tiefer liegende Wolkenschichten bleiben auch bei gewählter Bergstation erhalten.
- Räumliche Unterschiede und mehrere Wolkenschichten bleiben erhalten. Fehlende Grenzhöhen und Koordinaten werden nicht zu künstlichen Nullwerten.

Details: docs/implementation/MID_C18_ATMOSPHERIC_COLUMN_0.9.85.177.md. Veröffentlichung ausschließlich über die bestehenden Source-/Installer-/Worker-/Pages-/Stable-Gates.

## MID v0.9.85.176

- Bergwetter: getrennte Tagesmaxima für Wind und Böen; fehlende Werte bleiben unbekannt.
- Dezente Wind- und Neuschneefarben in Tages-, Stunden- und Periodenansichten.
- Gleichmäßige Tablet-Spalten für Sonnenstunden; vollständige Wettertexte.
- Gemeinsame Prüfung klar warmer Gefrierregen-Prognosen mit Feuchte; kalte Böden, Beobachtungen und Grenzlagen bleiben geschützt.
- Neuschnee-Methodik transparent: Modell-Schneewasser und feste Anbieterumrechnung, getrennt von der Schneedecke.

## MID v0.9.85.175 · Widget-Exportprofile Malatya, Kürecik und Ämari

Basis: main v0.9.85.174 (`c5bcdc09ae97072ec3c6b7c9fca75d8debd248a5`). Der kanonische feste Widget-Export umfasst Malatya, Kürecik und Ämari (59,26°N, 24,20°E) mit genau zwei Profilen: 7 Tage Kurve mit Wind/Niederschlag/Sonne/ECMWF und 5 Tage Kompakt mit Wind/ECMWF; beide jeweils Light/Dark. Hazards sind in diesen SharePoint-Exportprofilen aus. Alte direkte Widget-URLs bleiben rückwärtsverträglich lesbar. Rendering und PNG-Erfassung verwenden weiterhin den aktuellen veröffentlichten WidgetGenerator und das bestehende `midWidgetReady`-/CDP-Verfahren. Details: docs/implementation/MID_WIDGET_EXPORT_PROFILES_0.9.85.175.md. Release ausschließlich über Source-PR-Gate, Installer und Stable-Promotion.

## MID v0.9.85.174

Nebel-/Dunsttexte bleiben mit den Wetterpiktogrammen konsistent. Bergwetter verwendet vorhandene Modell-Schneefallgrenzen vor der vereinfachten Höhenableitung. Temperatur und Taupunkt erreichen die bestehende Kurzfrist-Phasenprüfung.

## v0.9.85.173 · RUC-Workflow-Koordination

Entwicklungsbasis: main = mid-stable = 4d6fd8543868bb2c187f8326cb4efe4b973d2a67 (.172). Reguläre Workflow-Koordination, unabhängig von externer GitHub-Störung.

## v0.9.85.172 · Konsolidierung und RUC-Robustheit

Verifizierte freigegebene Basis .170; geprüfter .171-Parallelstand erhalten. Details: docs/implementation/MID_C18_CONSOLIDATION_0.9.85.172.md. Bis erfolgreicher Vorgänger-Promotion nur Entwicklungskandidat; Release ausschließlich über bestehende Gates.

## v0.9.85.171 · Source-Gate Heavy-Regressionen isoliert parallelisiert

Basis: `main = mid-stable = 53671910a16d5bd0d6cf9fe47945891789bb0dff` (v0.9.85.170). Das automatisch entdeckte Regressionsinventar wird im Source-PR-Gate verlustfrei in einen Core-Shard und drei isolierte Heavy-Shards für Native-Map-, Unified-Map- und Berg-Visual-QA aufgeteilt. Die drei Heavy-Shards arbeiten auf demselben PR-Merge-SHA, erzeugen jeweils einen eigenen Produktionsbuild und teilen weder Arbeitsverzeichnis noch Browserzustand. Der bekannte Required-Check `Agent-Quellstand vollständig prüfen` ist nun ein fail-closed Abschlussjob und wird nur grün, wenn Core **und alle** Heavy-Shards erfolgreich waren. Installer, Worker-/Pages-Gates und Stable-Promotion bleiben unverändert. Details: docs/implementation/MID_REGRESSION_SHARDS_0.9.85.171.md.

## v0.9.85.170 · Widget/Bergwetter und gemeinsame CSS-Kaskade
Basis main = mid-stable = 9b917ed7054903df6da983ed79fe20561af45ab9 (.169). Die Fach-, Karten-, Persistenz- und Exportverträge bleiben erhalten. Details: docs/implementation/MID_MODULE_CSS_0.9.85.170.md. Veröffentlichung ausschließlich durch Source-/Installer-Gates.

## v0.9.85.169 · Wartung und Touch-Bedienung
Basis main = mid-stable = 9fc04b670047ebe00f61ef4e6e376e4a69972b55 (.168). Releasebeschleunigung und Fach-, Karten- und Exportverträge bleiben bestehen. Details: docs/implementation/MID_MAINTENANCE_0.9.85.169.md. Veröffentlichung ausschließlich durch Source-/Installer-Gates.

## v0.9.85.168 · Releasepfad beschleunigt, Prüftiefe unverändert

Basis: `main = mid-stable = 5afebb86b585666e02ddf901c04f3c3703078aef` (v0.9.85.167). Das Source-PR-Gate und der Installer führen weiterhin die vollständige MID-Verifikation aus. Konservativ read-only klassifizierte Regressionen dürfen mit maximal vier Prozessen parallel laufen; Datei-schreibende, Browser-/Server-/Unterprozess-, Netzwerk- oder anderweitig nicht sicher klassifizierte Prüfungen bleiben seriell und jeder Test wird weiterhin exakt einmal ausgeführt. Git-Historie wird im Normalpfad nur als flacher SHA-Snapshot geladen; erkennt der Installer ein weitergelaufenes `main`, lädt er vor der bestehenden Race-/Ancestor-Prüfung die vollständige Historie nach. Das unveröffentlichte Pages-Artefakt darf parallel zum Worker-Gate vorbereitet werden, das eigentliche Pages-Deployment bleibt vom erfolgreichen Worker-Gate abhängig. Stable-Promotion verwendet GitHub Compare/Refs ausschließlich mit `force=false` und abschließender SHA-Verifikation. Keine meteorologische oder UI-Fachlogik geändert. Details: docs/implementation/MID_RELEASE_PIPELINE_PERFORMANCE_0.9.85.168.md.

## v0.9.85.167 · MID-C17 gemeinsame Wetterkarte
Basis main = mid-stable = a40e2fbc12ea4c24b206e4904c3f03a3293fadc6 (.166). Gemeinsame Vektorkarte, unabhängige Layer, native Raster aus der Summen-Publikationsstrecke, bidirektionale fachliche Modell-/Parametermatrix und bestätigte Produktzeiten. Details: docs/implementation/MID_C17_UNIFIED_MAP_0.9.85.167.md. Bestehende Prognose-/Einstellungskorrekturen bleiben erhalten; Release nur über bestehende Source-/Installer-Gates.

## v0.9.85.166 · MID-C17 dauerhafte 7d-Farbwahl
Basis main = mid-stable = d5db6da50fba9684d5584ed9f3cf26afa931f81b (.165). ForecastDisplay wird synchron über den bestehenden dauerhaften Speicherpfad gespeichert, mit monotoner semantischer Revision und Schutz vor veralteten Remote-Snapshots. Keine Meteorologie-/Layoutänderung. Details: docs/implementation/MID_C17_SETTINGS_0.9.85.166.md. Browser-Neustartprüfung ist Teil der neuen Pflichtregression unter GitHub Actions; Release nur nach erfolgreichem Source-/Installer-Gate.

## v0.9.85.165 · MID-C16 kompakte Prognoseansichten
Verifizierte veröffentlichte Basis main = mid-stable = 27285d13c94f0da54d878b09a1d3f5953ff2627a (.164); www.midwx.app/version.json bestätigt .164. Fachlicher .164-Vertrag bleibt unverändert. Kurze 14d-Phasen, aufklappbarer Wochenvergleich und Quellen-/Methodikansichten; alle Saisonmonate ohne horizontales Scrollen, konkrete Kalenderdaten im Witterungstrend, gemeinsame Texthierarchie. Details: docs/implementation/MID_C16_COMPACT_UI_0.9.85.165.md. Release ausschließlich nach geprüftem Handoff und Source-PR-Gate.

## v0.9.85.164 · MID-C16 Prognoseanomalien und RUC-Nachladung
Basis main = mid-stable = 7a9066bbb0b6babc03fc44dff93bcd6f815cddfe (.163). Fachlicher Vertrag: docs/implementation/MID_C16_OUTLOOKS_RUC_0.9.85.164.md. Himmelsdelta vor Fusion; Niederschlagsdelta unverändert nach Fusion. Saisonprozente nur gegen eigene Modellreferenz, echte Mitgliedsanomalien und alle Monatslabels. Keine erfundenen Referenzen oder Kalibrierung.

## v0.9.85.163 · Skybar-Kohärenz und Prognoseinstrumente
Basis main = mid-stable = 0f8f871d5a69d0c8293445894f0f759e653bcce5 (.162). Lokale Wolkendeltas auf native Viertelstunden übertragen; Modell-Sonnenschein bei Änderung ab einem Okta als fehlend kennzeichnen. Keine Wolkenkomplement-Sonnenscheindauer. Gemeinsame runde Skalen und platzabhängige Monatslabels.

## v0.9.85.162 · MID-C15 Horizonte und echte Saisonmitglieder
Basis main = mid-stable = c8c2a4f98892b97a104c43575dedbecd23af439f (.161). Entwicklung/Unsicherheit statt identischer Horizontkalender, echte SEAS5-Mitgliedsmonate und Einheitenkorrektur. Fachlicher Vertrag: docs/implementation/MID_C15_HORIZON_CONCEPT_0.9.85.162.md. Keine kalibrierten Wahrscheinlichkeiten aus Modellstreuung oder ERA5-Differenzen behaupten.

## v0.9.85.161 · MID-C15 sichtbare Nachtstunden und 12h-Skybar
Basis main = mid-stable = 248987161638f06f7d315882aff988fd95e0de71 (.160), live www.midwx.app/version.json geprüft. Gemeinsamer SVG-Nachtfarbtoken --mid-night-band-color mit opakem Fallback und einmaliger Deckkraft. Der 12h-Wetterstreifen erhält die volle 16-px-SVG-Höhe wie 90 min.

## v0.9.85.160 · MID-C15 optionale ECMWF-Palette und gemeinsamer Linienvertrag
Basis main = mid-stable = 6133022f71dffade571c8e94909ec4b2298462ca (.159), live www.midwx.app/version.json geprüft. Gespeicherte 7d-ECMWF-Option für Tageskarten und Stundenkurve, unabhängige Gradienten-IDs. src/parameterLineStyle.ts ist autoritativ für tatsächlich gerenderte 24h-/7d-Linien. Frühere statische Strich-/Breitenvorgaben dürfen diesen gemeinsamen Vertrag nicht überschreiben.

## v0.9.85.159 · MID-C15 gemeinsame Widget- und Skybar-Darstellung
Basis main = mid-stable = 992712a32d10009e27e83aa04e114134e7b1e4ec (.158). Shared Renderer für echte Temperaturquartile und astronomische Nachtflächen in App und Widget; gleiche Daten-/Einstellungseingänge, Exportbereitschaft nach abgeschlossenem Ensembleabruf. 90-Minuten-Skybar ohne vertikale 12/16-Stauchung: vier Stufen wie im 24h-Profil.

## v0.9.85.158 · MID-C15 sichtbare Tagesfarben
Basis main = mid-stable = b651d589886ac967a13ce4571a3259dbef9b03d6 (.157). 7d-Kurve, Legende und Tmin/Tmax verwenden die tatsächlich gerenderten 24h-Parameterfarben. Der bisherige Stopps-Vergleich erkannte die CSS-Übersteuerung im Referenzdiagramm nicht.

# MID – verbindliche Codebasis

## v0.9.85.157 · MID-C15 Tagesdiagrammfarben und Wartungsprüfung

Basis main = mid-stable = 922a78191d9ff50f3858d857f00ef3f811ac96f1 (.156). Gemeinsamer UTCI-Farbtoken im tatsächlichen Tagesdetail und 24h-Profil; Unit-Tests im Coverage-Workflow einmal statt zweimal. Keine Gate- oder Regressionsstreichung. Prüfung: docs/implementation/MID_C15_MAINTENANCE_0.9.85.157.md.


## v0.9.85.156 · MID-C14 Vorhinweise bis Tag 7 und Diagrammfarben

Basis main = mid-stable = 49d169f04b52ba9dc0a33750d621a1522b837487 (.155). Fachlich abgesicherte Regen-/Schnee-/Böenbewertung ausschließlich bis +168 h. Getrennte ECMWF-Böenergänzung, Ergebnis-Cache über Worker-Neustarts und vereinheitlichte 24h/7d-Farben. Details: docs/implementation/MID_C14_SEVEN_DAY_OUTLOOK_COLORS_0.9.85.156.md.


## v0.9.85.155 · MID-C13 reale Langfrist-Ensemblefelder

Basis main = mid-stable = 2b380aefc25239b86838e9f4afb83865b11b90f6 (.154). Parallelkorrekturen .153/.154 vollständig erhalten. Reale ICON-EPS-Mitglieder statt leerer Mean/Spread-Felder; pro Gefahr vollständige Tagesabdeckung, fehlende Böen ausdrücklich keine Entwarnung. Details: docs/implementation/MID_EXTREME_MEMBERS_0.9.85.155.md.

## v0.9.85.152 · MID-C13 Skybar-Intervallkonsistenz

Basis main = mid-stable = d6d7e0e5d5f6fb20a0e3dbaaf2351ed93c1857bc (.151). Der kontinuierliche Profilstreifen verwendet dieselben finalisierten Viertelstunden wie 90 min, statt deren Bewölkung vorher stündlich zu mitteln. Stundenquadrate bleiben aggregiert. Fehlende Kurzfristzustände sind keine Nullwerte. Details: docs/implementation/MID_SKYBAR_INTERVALS_0.9.85.152.md.

## v0.9.85.151 · Warnhorizonte

Basis main = mid-stable = 0d9205720c177243a2dec3f4f8169216cc620162 (.150). Bestehende Karten-/Bottom-Bar-Änderungen bleiben erhalten. Gestaffelte Hinweise und separater regionaler ICON-EPS-Ausblick 48–168 h. Details: docs/implementation/MID_WARNING_HORIZONS_0.9.85.151.md.

## v0.9.85.150 · iOS Bottom-Bar-Verankerung

Basis main = mid-stable = e6386ca6ed8fbab563261e7b78a96ea15e015c17 (.149). Karten-/Einheiten-/Ortswertänderungen bleiben vollständig erhalten. Nur schmale iOS-Flächen erhalten einen rAF-geführten Dokumentanker gegen WebKit-Fixed-Layer-Versatz. Desktop/Tablet behalten die bestehende feste Navigation. Details: docs/implementation/MID_BOTTOM_BAR_ANCHOR_0.9.85.150.md.

## v0.9.85.149 · Runde Kartenskalen und temporäre Ortswerte

Basis main = mid-stable = c578a947e02a6d06638870d5d762c16ecb9be8bf (.148). Gerundete Skalen umfassen alle Werte; feste absolute Anker bleiben unverändert. Einheitenbewusste Grenzen, echte Skalenpositionen für beschriftete Zwischenwerte und temporäre Kartenabfrage nutzen die kanonischen Raster- und Formatfunktionen. Portal, Außenklick und Escape bleiben in AppPortalPopover. Details: docs/implementation/MID_MODEL_MAP_PROBE_0.9.85.149.md.

## v0.9.85.148 · Einheiten und kontinuierliche Kartenfarben

Basis main = mid-stable = e28fdd42a3e68decf4b2671d3cd71751a3e711af (.147). Die parallel veröffentlichten .146/.147-Änderungen an Sonnen-/Mondzeilen, Bergwettertabelle, unterer Navigation und Kartenbereich bleiben erhalten. Der unveröffentlichte Parallelstand e3d9f7ac2567b66bfbd0f769ffc5fa5d415eb5fb ist gezielt abgeglichen; die Navigation bleibt über ein Portal und ihren bisherigen CSS-Namensraum fest am Viewport. Wind-/Böen-Ortswerte, Legenden und PNG/SVG folgen der bestehenden Einstellung über den kanonischen Windformatter. Native numerische Raster und Niederschlagssummen verwenden eine gemeinsam berechnete stufenlose Wertebereich-/Festskala; Animationen bleiben fest skaliert. Wettercodes, Datenlücken und Trockenheit werden nicht numerisch umgefärbt. Details: docs/implementation/MID_MODEL_MAP_UNITS_COLORS_0.9.85.148.md.

## v0.9.85.145 · MID-C12 Unterscheidbare Prognoseansichten

Basis main = mid-stable = 3951e8ce58239634ed48b4f13e5a58ee23c73c91. Spurenmengen vollständig lesbar, sichtbare Grenzwerte ohne P25/P75-Präfix, kombinierte 7d-Temperaturdarstellung und eigenständige 14d-Ensemble-Hierarchie. Details: docs/implementation/MID_FORECAST_VIEWS_0.9.85.145.md.

## v0.9.85.144 · MID-C12 Wochenunsicherheit, Trend und Karten

Basis main = mid-stable = 8e511937458ce06808f0487ce1c61441e87fe360. Tatsächliche stündliche Mitglieder aus den bestehenden Ensembleabrufen, keine Tagesinterpolation. Niederschlagsbeginn am Tag bleibt im Trendtext. Direkte DWD-Kartenaufbereitung unterscheidet relative Feuchte und Bedeckungsgrad. Details: docs/implementation/MID_WEEKLY_UNCERTAINTY_0.9.85.144.md.

## v0.9.85.143 · kompakte Unsicherheit

Basis .142: 4282232533fc70545d9b64676a9de1b4839f1b2e. Details: docs/implementation/MID_COMPACT_UNCERTAINTY_0.9.85.143.md. Echter P50 derselben gewichteten Verteilung statt Einzelwert/Mittelwert; fehlende P50 bleiben ohne Marker. Böen, kompakte Bänder, Tmax/Tmin-Farbtrennung. Stündliches P25–P75 nur aus tatsächlichen zeitgleichen Warnungsensemble-Quantilen, keine Tagesquantil-Interpolation.

## Technischer Ausgangspunkt

Für jede weitere Entwicklung gilt ausschließlich der GitHub-Zweig `mid-stable` im Repository `MeteoMartini/MID` als Codebasis. Dieser Zweig wird vom Release-Workflow erst aktualisiert, nachdem Build, sämtliche Regressionstests und das GitHub-Pages-Deployment erfolgreich waren.

`main`, ältere ZIP-Dateien, Chat-Anhänge, Chat-Zusammenfassungen und Erinnerungen dienen nur zur fachlichen Einordnung. Sie dürfen niemals ohne Abgleich mit `mid-stable` als Quellcodebasis verwendet werden.

## Pflichtprüfung vor jeder Änderung

1. `package.json` aus `mid-stable` lesen.
2. `MID_BASELINE.json` aus `mid-stable` lesen.
3. Releaseversion, Linie, Referenzcommit und Pflichtregressionen prüfen.
4. Erst danach den vollständigen Quellstand aus `mid-stable` übernehmen.
5. Bei fehlender oder widersprüchlicher Basis keinen neuen Release erzeugen.

## Verbindliche Anweisung für neue MID-Chats

> Nutze ausschließlich `MeteoMartini/MID`, Branch `mid-stable`, als Codebasis. Lies zuerst `MID_BASELINE.json` und `package.json`. Verwende weder ältere Uploads noch aus Chats rekonstruierte App-Stände. Brich ab, wenn die Basis nicht eindeutig verifiziert ist.


## v0.9.85.142 · MID-C11 Verlustfreies Kartenbudget

Ausgangsbasis: veröffentlichte .141, main = mid-stable = ff2e310d107a745468d788fcec678693d507a68d. Native ICON-D2-Felder werden verlustfrei als gzip-JSON .bin-Objekte publiziert; Index deklariert encoding, komprimierte und entpackte Bytezahlen sowie SHA256. Client prüft Hash und Größen vor/nach begrenzter Inflation, mit nativem Stream oder Lazy-pako-Fallback. Legacy-JSON bleibt kompatibel. Das bestehende 900-MB-Limit wird nicht erhöht. Dieselbe Pflichtregression testet zusätzlich beide Decoder, Integrität und komprimierte Browserdarstellung. Datenprodukte erscheinen mit erfolgreicher regulärer RUC-Aufbereitung.

## v0.9.85.141 · MID-C11 Adaptive Prognosen und native Wetterkarten

Verifizierte .140-Basis main = mid-stable = 87875585c773edf5fcb508cbe3466c7f98c08481. Parameterbezogene Quantilbänder, keine aus Tageswerten erfundenen Stundenintervalle. Gefallener Niederschlag aus nicht überlappenden RADOLAN RW-Stunden; unbekannte Zellen bleiben grau/unbekannt. ICON-D2-Kombinationen wechseln vom groben API-Punktraster zu direkten vollen DWD-GRIB2-Feldern, ergänzt um Temperatur/Wind/Böen/Bewölkung/Druck. Gemeinsame Quellen-/Zeit-/Ortswert-/Exportverträge. Andere Modelle bleiben WMS; nicht gelistete WW-Karten werden nicht angeboten. Kostenlose bestehende Pages-Pipeline, immutable SHA256-Objekte, kein manueller Stable-Push. Neue Datensätze benötigen eine erfolgreiche reguläre RUC-Aufbereitung nach Release.

Required regression: scripts/test-adaptive-native-maps-0985141.mjs; Details: docs/implementation/MID_ADAPTIVE_NATIVE_MAPS_0.9.85.141.md.

## v0.9.85.140 · MID-C11 Radar kompakt und native RV-Daten

Verifizierte Ausgangsbasis: `main == mid-stable == fe87c0f296be0475153fb1326977d9a23df74025` (veröffentlichte .139). Keine überlappende offene Agent-PR. Live-Bright-Sky-RV nutzt `RADARCOMP::RV`; .139 verwarf diese Kennung. Beide gültigen RV-Kennungen werden akzeptiert. Vollständige native 24-Schritt-Prognosen benötigen keine WMS-Diagnostik; Zusatzbeobachtungen dürfen ihre Mengen und Referenzzeit nicht überschreiben.

Die globale `.top`-Headerregel erzeugte auf der oberen Radar-Rasterlinie eine leere Pille. Der isolierte Chart setzt Rasterlinien auf Höhe 0, ohne Hintergrund/Padding. Browser-QA enthält nun das echte CurrentNowcards-Umfeld und prüft explizit Rasterliniengeometrie, Notizen, Summen, Balken und Scrubberanker in 24 Varianten. Wortlautregressionen wurden auf die beauftragte kompakte Phasenform angepasst; Zeitintervalle und Datenlückenverträge bleiben geprüft.

## v0.9.85.138 · Radarintensität, Niederschlagsstufen und UTCI appweit

Ausgangsbasis ist der vollständig veröffentlichte Stable-Stand `main == mid-stable == b013e6664966111fa2c466ba8cabb3520421b435` (v0.9.85.137). Die Radar-Nowcast-Grafik verwendet für ihre `mm/5 min`-Balken die native Zeitschrittintensität; die separate final kalibrierte Mengenreihe bleibt für vollständige/partielle 120-Minuten-Summen maßgeblich. Niederschlagsintensitätstexte werden aus `precipitationIntensityDescriptor` abgeleitet, sodass sichtbare Rate und Textstufe denselben Intervallvertrag verwenden.

UTCI ist der kanonische appweite Außenkomfortindex. Stündliche Reihen werden nach lokalen Forecast-Korrekturen neu berechnet; Kurzfrist, Profil/Cockpit, Event, Wasser und Bergwetter konsumieren denselben UTCI-Pfad. Tmrt wird bei fehlendem Direktfeld aus UVI, Bewölkung, Tageszeit und Höhe geschätzt; Standard-UTCI-Stressgrenzen bleiben in `src/utci.ts` zentral.

Required Regression: `scripts/test-radar-utci-consistency-0985138.mjs`. Implementierungsnachweis: `docs/implementation/MID_RADAR_UTCI_CONSISTENCY_0.9.85.138.md`.

## v0.9.85.137 · Radar-Fünfminutenwerte und gemeinsame Modellkarten

Basis: `main == mid-stable == 82fe63ea483afe74c264c15b6978726f9cb47143` (veröffentlichte v0.9.85.136). Aktive Agent-/Replit-PRs vor Beginn abgeglichen. Direkter DWD-RV-Pfad korrigiert, keine neue kostenpflichtige Quelle. Die ausdrücklich beauftragte Zusammenführung ersetzt drei Kartenreiter durch zwei und macht Summen zum ICON-D2-Kartenprodukt. Rechen-/Zeitintervall- und Geografieverträge: `docs/implementation/MID_C11_RADAR_MODEL_MAPS_0.9.85.137.md`. Die betroffenen historischen UI-Tests wurden an diesen neuen Vertrag angepasst; das vollständige Regressioninventar bleibt verbindlich.

## v0.9.85.136 · Modellabdeckung und Regressionen

Basis: `main == mid-stable == f5bcc165012597bb2320d211f43e6a6f75573096` (v0.9.85.135). Die Außenmaske übernimmt das gekrümmte rotierte ICON-D2-Grenzpolygon der bestehenden Analyse. Alle 894 automatisch erkannten Regressionen bleiben erhalten; beide Baseline-Listen werden auf das vollständige Inventar konsolidiert und im Runner auf Drift geprüft. Keine Assertions gestrichen.

## v0.9.85.135 · Unveränderliche ICON-D2-Kartenobjekte

Basis: veröffentlichte v0.9.85.134, `main == mid-stable == 5260c83caf82ccf2cf73c68973f4ca411f086639`. Die unabhängigen ICON-D2-Summen verwenden im bestehenden Pages-Manifest zusätzlich ihren Datei-Hash im Objektpfad. Dadurch kann ein neuer ICON-Lauf bei gleichem RUC-Lauf keine ältere Karten-URL mutieren. Alle Kartenfunktionen und Quellen bleiben erhalten.

## v0.9.85.134 · DWD-Niederschlagssummen im gemeinsamen Kartenbereich

Basis: verifizierter Stable-Stand v0.9.85.133, `main == mid-stable == 33cae56be8740c7bae3fed3754f6d4467c7655a4`. Selektiver Replit-Handoff `54a16f4c1aef264f4416db667a0217039075818b` für Navigation/Darstellung, ergänzt um den geprüften DWD-Datenpfad und Exporte.

Direkte ICON-D2-Open-Data-GRIBs: TOT_PREC ab T+0 desselben Laufs für 6/12/24/48 h. Bestehender RUC-/Pages-Snapshotpfad erhält das unabhängige Kartenprodukt. Keine Punkt-API-Interpolation und keine Verlängerung des RUC-Horizonts. Bright Sky ist kein vollständiger ICON-D2-Rasterersatz.

## v0.9.85.133 · Niederschlags-, Pollen- und Navigationskonsistenz

Basis: verifizierter Stable-Stand v0.9.85.132, `main == mid-stable == 3816a4332f90be6b73fd04b33bfa46e7918ac66b`.

- Radar: fehlende DWD-RV-Zeitschritte sind explizite Datenlücken und keine Trockenmeldung.
- Niederschlagsdauer: die sichtbare Fortsetzung hinter +2 h wird aus der kanonischen 24-h-Zeitreihe einschließlich mehrerer Phasen abgeleitet.
- Niederschlagsart: Intervallmengen werden mit ihrer tatsächlichen Dauer bewertet; aktuelle lokale Niederschlagsart darf die unmittelbare Kurzfrist stützen.
- Pollen: lokales Kalenderdatum und DWD-Produktzeit sind maßgeblich.
- Navigation: gespeicherter Primärbereich ist beim Start autoritativ; Untermodul und Forecast-Horizon dürfen ihm nicht widersprechen.
- Die Informationsarchitektur des Gesundheitswetters bleibt für einen separaten Replit-Design-Handoff offen und wird in diesem funktionalen Build nicht eigenmächtig verschoben.

## v0.9.85.132 · Kanonische Niederschlags-Zeitsemantik

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stable-Stand `main == mid-stable == eb1f8e5bd4dce82a1af18c762a054d5184e51806` (v0.9.85.131).

Niederschlagsaussagen mit Beginn/Ende werden aus einer gemeinsamen intervallbewussten Zeitreihe abgeleitet. Open-Meteo-Akkumulationen bleiben im Rechenkern am Intervallende, werden für sichtbare Aussagen jedoch über die bestehenden `precipitationPresentation*`-Verträge auf den Vorwärtsslot gelegt. Die finalisierte 15-Minuten-Reihe hat Vorrang, sofern sie den gesamten Kurzfristhorizont abdeckt; andernfalls wird vollständig auf die normalisierte Stundenreihe zurückgefallen. Wahrscheinlichkeiten ohne messbare Menge definieren keine sichere Niederschlagsdauer.

Implementierungsnachweis: `docs/implementation/MID_PRECIPITATION_TIMING_0.9.85.132.md`.

## v0.9.85.131 · C11-Kartenstand und Radar-Nowcast-Startpfad

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stand `main == mid-stable == 0daf09160c8f9de514d3fbb3d78c03df275604d1` (v0.9.85.130) plus der SHA-verifizierte Replit-Handoff `replit/v0.9.85.131-map-timeline-Handoff@37e726c7be865402f4ee348c8b732233e98430fb`.

Der C11-Handoff vereinheitlicht die responsive Zeitsteuerung der Kartenansichten. Zusätzlich wird der Startpfad der Radar-Nowcast-Auswertung beschleunigt. Eine ausgedünnte Schnellserie darf fehlende 5-Minuten-Zeitschritte nicht als trockene Radarwerte interpretieren. Die vollständige Darstellung bleibt an die exakte DWD-5-Minuten-Punktserie gebunden; echte Trockenphasen werden ausschließlich aus tatsächlich trockenen Zeitschritten abgeleitet. Die Sichtbarkeitsregel bleibt unverändert: Die Radar-Nowcast-Grafik erscheint nur bei relevantem Niederschlagsecho am Standort oder im Umfeld.

Implementierungsnachweis: `docs/implementation/MID_C11_RADAR_STARTUP_0.9.85.131.md`.

## v0.9.85.130 · Gesundheitswetter-Sichtbarkeit und Primärnavigation

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stand `main == mid-stable == c1db743f987cdf7ced34f9ff8c65b7c87d69fc5e` (v0.9.85.129).

Der reale Smartphone-Screenshot zeigte, dass „Gesundheitswetter“ trotz vorhandener React-Struktur nicht sichtbar war. Ursache war ein CSS-Split-Vertrag aus Arbeitspaket I: Für `settings-split-navigation` wurde die gesamte `.settings-section` ausgeblendet und ausschließlich die Modulreihenfolge eingeblendet. Damit verschwanden sowohl `settings-health-weather` als auch die navigationseigenen optionalen Inhaltsmodule. v0.9.85.130 zeigt im Navigation-Tab gezielt nur diese navigationseigenen Optionslisten und anschließend die Modulreihenfolge. Pollenflug bleibt separat und persistent ein-/ausschaltbar.

Für die Bottom-Bar wird die bestehende Untermodul-Persistenz um einen expliziten Primärbereich ergänzt: Aktuell, Heute, Vorhersage, Karten und Mehr. Das ist besonders für „Mehr“ erforderlich, weil ein Drawer kein DashboardModuleId besitzt und durch `mid:last-dashboard-section:v1` allein nicht wiederhergestellt werden konnte. Explizite `#mid-section-…`-Deep-Links werden beim Start nicht mehr durch die Modul-Initialisierung entfernt und behalten Vorrang vor dem gerätelokal gespeicherten Bereich.

Required Regression: `scripts/test-health-settings-primary-navigation-0985130.mjs`.
Implementierungsnachweis: `docs/implementation/MID_HEALTH_SETTINGS_PRIMARY_NAV_0.9.85.130.md`.

## v0.9.85.129 · Gesundheitswetter/Pollen kompakt

Ausgangsbasis ist der vollständig veröffentlichte und verifizierte Stand `main == mid-stable == 0007f5e4b0e155308950f8b098aeac0bffd9ceee` (v0.9.85.128).

Der reale Smartphone-Sichtvergleich zeigte zwei voneinander getrennte Probleme: Die Pollenkarte war durch den großen Kopf und die vollständige 8×3-Tabelle unverhältnismäßig hoch; gleichzeitig wurde die amtliche DWD-Zwischenstufe „keine bis gering“ in der kompakten Zusammenfassung fälschlich wie „keine Belastung“ behandelt. Ursache war eine UI-Zuordnung, die nur vier Textstufen kannte, obwohl der DWD-Pollenflug-Gefahrenindex sieben Legendenstufen 0, 0–1, 1, 1–2, 2, 2–3 und 3 verwendet.

v0.9.85.129 führt daher eine progressive Informationshierarchie ein: Standardzustand mit heutiger Belastung, Region und DWD-Stand; erste Detailstufe mit maximal vier in den nächsten drei Tagen relevanten Pollenarten, nach höchster 3-Tage-Stufe priorisiert; vollständige acht Arten erst nach expliziter Nutzeraktion. Die DWD-WFS-Datenquelle, die 27 Gebiete, die acht Pollenarten und die gelieferten Vorhersagewerte werden nicht verändert.

Die fachliche Auswertung erkennt die DWD-Zwischenstufen einschließlich sprachlicher Varianten und nutzt `POLLENINT` nur als defensiven Fallback. Damit wird „keine bis gering“ als Zwischenstufe > 0 priorisiert, ohne amtliche Werte neu zu berechnen.

Required Regression: `scripts/test-pollen-compact-dwd-levels-0985129.mjs`.
Implementierungsnachweis: `docs/implementation/MID_POLLEN_COMPACT_DWD_LEVELS_0.9.85.129.md`.

## v0.9.85.128 · MID 18.2.20 Screenshot-/Security-Nachgang und Gesundheitswetter

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `479d6d55322dc33f03aad868e35f2d6ee0f9197f` (v0.9.85.127). Dieser Wartungsbuild löst die im GitHub-Audit sichtbaren CodeQL-/Dependency-/Action-Befunde soweit kompatibel und fail-closed auf und ordnet Pollenflug als eigenes optionales Gesundheitswetter-Modul ein.

Die DWD-Pollenquelle, Pollenarten, Belastungsbegriffe und Vorhersagewerte werden fachlich nicht verändert. In der kompakten Aktuell-Ansicht werden lediglich vorhandene aktive Belastungen nach bestehender Stufe priorisiert; bei ausschließlich `keine` wird eine neutrale Zusammenfassung gezeigt. Die Detailansicht bleibt eine Drei-Tage-Darstellung der bereits gelieferten Werte. Amtliche Wetterwarnlogik, Modellfusion und übrige meteorologische Datenquellen bleiben unverändert.

Sicherheitsseitig wird eine nichtnumerische externe Warnwahrscheinlichkeit nicht mehr ungeprüft sichtbar weitergereicht. Der visuelle Bergwetter-Test übergibt Selektoren und Theme-Werte strukturiert an CDP statt sie in ausführbaren Seitencode einzubauen; der Chromium-Debug-Port wird lokal reserviert statt aus `DevToolsActivePort` in eine URL übernommen. `brace-expansion` wird innerhalb der bestehenden kompatiblen 5.x-Transitivreihe auf 5.0.12 angehoben. Der getrennte `uuid@7.0.3`-Tooling-Befund wird nicht per inkompatiblem Override erzwungen.

Required Regression: `scripts/test-security-pollen-maintenance-0985128.mjs`. Detaildokument: `docs/implementation/MID_SECURITY_POLLEN_MAINTENANCE_0.9.85.128.md`.

## v0.9.85.127 · Repository-Hygiene und Versionssynchronisierung

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `81d2bfb9d872ba97f4e2a3fec82e92a6f8aefab0` (formal v0.9.85.126). Die in PR #208 integrierten Pollen-/Hook-/Qualitätsindikator-Korrekturen sind dort bereits enthalten, die Versionsspiegel waren jedoch nicht auf v0.9.85.127 angehoben. Dieser Build synchronisiert Version, Baseline, README und Changelogs und ergänzt Repository-/Governance-Härtungen. Meteorologische Fachlogik, Warnschwellen, Modellfusion und Datenquellen bleiben unverändert.

Required Regressions: `scripts/test-repository-hygiene-0985127.mjs`, `scripts/test-contract-registry-0985127.mjs`, `scripts/test-branch-cleanup-safety-0985127.mjs`, `scripts/test-knmi-workflow-consolidation-0985127.mjs`. Detaildokument: `docs/implementation/MID_REPOSITORY_MAINTENANCE_0.9.85.127.md`.

## v0.9.85.116 · MID 18.2.24 deutlichere Nachtstunden im Dark-Design

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `218e6d40960c78672dd975159f9eb49973f65ddc` (v0.9.85.115). Die gemeinsame Nachtstundenkennzeichnung verwendet nun eine Theme-spezifische Deckkraft: Light bleibt bei 0,20, Dark wird auf 0,32 angehoben. Die Änderung gilt konsistent für 12-h-Temperaturtrend/Skybar, Now90-Skybar und 24-h-Wetterprofil. Sonnengeometrie, weiche Dämmerungsübergänge, Wetterfarben, meteorologische Schwellen und Datenquellen bleiben unverändert.

Required Regression: `scripts/test-mid-18-2-24-dark-night-band-0985116.mjs`. Detailvertrag: `MID_DARK_NIGHT_BANDS_0.9.85.116.md`.

## v0.9.85.115 · MID 18.2.23 Temperaturtrend-Kohärenz und Bergstunden 12 h

Ausgangsbasis ist der vollständig veröffentlichte `mid-stable`-Commit `9e81bcb21f3dbcdedc8d76fffc038a5e0b1a7ae2` (v0.9.85.114). Die hyperlokale Temperaturassimilation verwendet nun den feldspezifischen Beobachtungszeitpunkt und bestimmt den Modellwert am Messzeitpunkt durch Interpolation zwischen den benachbarten Stunden. Eine lokale Temperaturabweichung wird danach glatt und begrenzt zurückgeführt; das Ausblenden der Korrektur darf in der unmittelbaren Assimilationsphase einen belastbaren Modell-Stundentrend nicht allein in die Gegenrichtung drehen. Damit wird insbesondere eine durch die frühere lineare 120-Minuten-Rückführung mögliche synthetische Erwärmung zwischen benachbarten Stunden vermieden. Die sichtbare +12-h-Karte bleibt reiner Verbraucher derselben kanonischen finalisierten Stundenreihe.

Im Berg-/Wintersportmodul zeigt die horizontale stündliche Höhenprognose ab diesem Stand ausschließlich die nächsten **12 Stunden** und höchstens zwölf Stundenwerte. Die 7-Tage-Prognose sowie eigenständige 24-h-Schneeakkumulationen bleiben unverändert. Damit ist die in v0.9.85.108 definierte sichtbare 24-h-Stundenleiste für die aktuelle UI ausdrücklich abgelöst.

Required Regression: `scripts/test-mid-18-2-23-temperature-trend-mountain-12h-0985115.mjs`. Detailvertrag: `MID_TEMPERATURE_TREND_MOUNTAIN_0.9.85.115.md`.

## v0.9.85.114 · MID 18.2.22 responsiver Audit-Nachgang

Ausgangsbasis ist der erfolgreich promotete `mid-stable`-Commit `6371acec8458234283f8a31e29744bb222a7f9a2`. Der mobile 7-Tage-Trend darf vollständig umbrechen; die mobilen Kartenkopfzeilen ordnen Titel und Status in getrennte Zeilen; der automatische PWA-Hinweis erscheint bei ausgewähltem Wetterstandort nicht über dem Inhalt. Die Installationsaktion im Kopf bleibt verfügbar. Fachlogik bleibt unverändert. Detailvertrag: `MID_MOBILE_LAYOUT_0.9.85.114.md`.

## v0.9.85.113 · MID 18.2.21 Auditkorrekturen für Bedienbarkeit

Der Ausgangspunkt ist `mid-stable` `dc1975c3ccf99e9b749393874a48147618f6e73e`. Die gezielte Auditkorrektur stellt das Kurzfristdetail im obligatorischen Next-Design wieder her, vergrößert die Touch-Ziele der Wetterkartensteuerung, verbessert die Lesbarkeit der Szenario-Kurzlabels und macht Karten-Standortinformationen auf Touchgeräten und per Tastatur verfügbar. Die Hauptnavigation wird als Landmark ausgezeichnet. Meteorologische Fachlogik und Warnstufen bleiben unverändert. Detailvertrag: `MID_AUDIT_UI_ACCESSIBILITY_0.9.85.113.md`.

## v0.9.85.112 · MID 18.2.20 Kartensteuerung und 7-Tage-Desktopausrichtung

Der gegen die verifizierte Basis `a6afde4ce9e38965ea484a0c9c81b95bdd3dc2af` geprüfte Replit-Handoff `3148e8f3a66b433746bfe37452c786f01bec6499` vereinheitlicht ausschließlich die sichtbare Kartensteuerung und korrigiert die Desktopgeometrie der 7-Tage-Kurvenübersicht. Zoom, Position und Layersteuerung verwenden auf mobilen/touchbasierten Layouts konsistente Touch-Ziele, Abstände und eine gemeinsame rechte Kante. Die sieben Tagesbereiche unter der Kurve werden auf Desktop gleichmäßig und entlang derselben Plotgrenzen wie die gemeinsame Zeitachse angeordnet.

Meteorologische Logik, Datenquellen, Warnschwellen und fachliche Forecastverträge bleiben unverändert. Responsive Zielmatrix: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900, jeweils Light/Dark. Required Regression: `scripts/test-mid-18-2-20-map-seven-day-alignment-0985112.mjs`. Detailvertrag: `MID_MAP_SEVEN_DAY_ALIGNMENT_0.9.85.112.md`.

## v0.9.85.111 · MID 18.2.19 robuste API-Vertragsrevision

Die automatische Revision bleibt für kritische externe Datenverträge fail-closed, wiederholt jedoch ausschließlich eindeutig transiente Abruffehler begrenzt. Transportfehler sowie HTTP 408, 425, 429 und 5xx dürfen bis zu dreimal mit begrenztem Backoff erneut versucht werden. Erfolgreiche 2xx-Antworten werden inhaltlich nur einmal bewertet; ein fachlich ungültiger Payload wird nicht durch Wiederholung kaschiert. Nicht-transiente 4xx werden nicht erneut angefordert.

Hintergrund ist der wiederholte gleichzeitige `fetch failed`-Befund der automatischen Revision nach v0.9.85.110, obwohl vollständige Regression, Dependency-Audit und Build-Budget bestanden. Die Härtung betrifft ausschließlich die Prüfautomatik und ändert keine Wetter-, Berg-, Worker- oder UI-Fachlogik.

Required Regression: `scripts/test-api-contract-retry-0985111.mjs`. Detailvertrag: `MID_API_CONTRACT_RETRY_0.9.85.111.md`.

## v0.9.85.110 · MID 18.2.18 Bergwetter-Datenqualität und Höhenquellen

Die Berg-/Wintersportsektion verwendet Open-Meteo Best Match weiterhin als vollständige 7-Tage-Basis. Für den kurzfristigen Höhenvergleich wird dort, wo ein belastbares hochaufgelöstes Regionalmodell verfügbar ist, ein einziges Regionalmodell für alle konfigurierten Höhenpunkte verwendet. Dadurch werden Tal-/Mitte-/Berg-Unterschiede nicht durch unbeabsichtigte Modellwechsel zwischen den Höhenstufen erzeugt. In Österreich gilt GeoSphere AROME Austria als bevorzugter Kurzfristpfad, in Deutschland DWD ICON-D2, in der Schweiz MeteoSwiss ICON-CH1 und in Frankreich Météo-France AROME HD. Fehlende Regionalmodellfelder fallen feldweise auf die Best-Match-Basis zurück.

DWD ICON-D2-RUC bleibt im Bergmodul ein standortbezogenes 15-Minuten-Kurzfristsignal für die Höhenzonenanalyse. Solange keine getrennten RUC-Reihen für Tal, Mitte und Berg vorliegen, darf RUC nicht als höhenaufgelöster Wert ausgegeben oder auf die einzelnen Niveaus kopiert werden.

Niederschlag wird nicht künstlich mit der Höhe skaliert. Räumlich getrennte Höhenpunkte können aufgrund von Anströmung, Luv/Lee, Konvektion und Modellorographie unterschiedliche oder sogar im Tal höhere Mengen zeigen. Bei merklich horizontal versetzten Profilpunkten wird dieser Sachverhalt in der UI erklärt. Neuschnee bleibt eine eigenständige Intervallgröße; fehlende Werte werden nicht als 0 cm erfunden.

Tageszeilen der Höhenprognose sind Tageszusammenfassungen und verwenden daher ausschließlich Tagespiktogramme. Der repräsentative Zustand wird bevorzugt aus Tageslichtperioden gewählt; die geöffneten 3-Stunden-/Stundenwerte behalten astronomisch korrekte Tag-/Nacht-Symbole. In der Sommerdarstellung wird ein redundantes tägliches 0-cm-Neuschneefeld ausgeblendet.

Required Regressions: `scripts/test-mountain-data-quality-0985110.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`, `scripts/test-mid-18-2-16-mountain-redesign-0985108.mjs`, `scripts/test-mountain-seven-day-domain-1813.mjs`. Detailvertrag: `MID_MOUNTAIN_DATA_QUALITY_0.9.85.110.md`.

## v0.9.85.109 · MID 18.2.17 Bewölkungs- und UVI-Konsistenz

Der aktuelle trockene Himmelszustand besitzt nur noch eine kanonische Bewölkungsklasse. Hauptzustand, Wetterpiktogramm und Bewölkungskarte werden auf denselben dargestellten Oktas-Wert zurückgeführt; ein trockener Modell-Wettercode darf daher nicht mehr „Bedeckt“ anzeigen, wenn die gleichzeitig dargestellte Gesamtbewölkung beispielsweise 6/8 ergibt. Belastbare Sicht-/Nebel- oder Niederschlagsphänomene dürfen die reine Bewölkung weiterhin fachlich übersteuern.

Für direkte Bewölkungsbezeichnungen gilt app-weit die DWD-Systematik: 0/8 wolkenlos, 1–3/8 leicht bewölkt bzw. tagsüber heiter, 4–6/8 wolkig, 7/8 stark bewölkt, 8/8 bedeckt. Die bestehende Schutzregel für kontinuierlich hyperlokal analysierte Prozentwerte bleibt erhalten: 8/8 wird dort erst bei vollständiger Bedeckung von 100 % gesetzt.

Die sichtbare Kurzbezeichnung des UV-Index lautet einheitlich `UVI`. Ausgeschriebene fachliche Begriffe wie „UV-Index“, „UV-Schutz“ oder „UV-Gefahrenindex“ bleiben in Erläuterungen unverändert korrekt.

Required Regressions: `scripts/test-cloud-uvi-consistency-0985109.mjs`, `scripts/test-current-hyperlocal-sky-083311.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`. Detailvertrag: `MID_CLOUD_UVI_CONSISTENCY_0.9.85.109.md`.

## v0.9.85.108 · MID 18.2.16 stündliche Höhenprognose und aktuelle Bewölkungssemantik

Dieser Stand ersetzt für Berg-/Wintersport den sichtbaren bisherigen `Höhenvergleich` der v0.9.85.107 durch die ausgewählte Höhenstufe als kanonische Prognoseperspektive. Verbindlich sind eine sofortige Skeleton-Vorschau, Tal-/Mitte-/Berg-Auswahl, eine stündliche Prognose der nächsten rund 24 Stunden und kompakte 7-Tage-Zeilen mit höchstens einem inline geöffneten Tagesdetail. Die Formulierung in v0.9.85.107, wonach `Höhenvergleich` die kanonische sichtbare Bezeichnung sei, ist damit für die aktuelle UI ausdrücklich abgelöst.

Der sichtbare Höhen-Kernforecast hat Vorrang vor optionalen Open-Meteo-Anreicherungen; Diagnostik, GeoSphere-Schneemessung und Schneefallgrenzen-Ensemble bleiben progressiv. Wind/Böen, Schnee-/Messungspriorität, DWD-Schneefallgrenzenverfahren sowie die Trennung amtlicher Warnungen von automatischen MID-Hinweisen bleiben fachlich erhalten. Die unteren Berg-/Winterbereiche werden in die ruhige MID-Flächenhierarchie überführt; eine amtliche Lawinenquelle erhält ohne reale Gefahrenstufe keine erfundene Warnfarbe.

Für das aktuelle Wetter wird ein kontinuierlicher hyperlokal analysierter Bewölkungs-Prozentwert nicht mehr durch einfache Rundung zu einer scheinbar diskreten 8/8-Beobachtung. Bei dieser analysierten Prozentdarstellung ist 8/8 „Bedeckt“ vollständiger Bedeckung von 100 % vorbehalten; darunter bleibt die Textklassifikation höchstens 7/8. Direkte diskrete amtliche Beobachtungen werden dadurch nicht umgedeutet.

Der Open-Meteo-Watch vom 27.09.2026 ist in diesen Stand integriert: Der Daily-Kernforecast fordert zusätzlich `moonrise`, `moonset` und `moon_phase` an. Diese Werte werden für den lokalen Kalendertag primär verwendet; die bestehende lokale Astronomieberechnung bleibt als Fallback und für Beleuchtung, Mondalter, Phasenbezeichnung, Neu-/Vollmondabstand und Finsternisse erhalten. Der Worker-Core-Cache trägt deshalb Schema `v4`. Für die heute geprüften DMI-HARMONIE- und CMC/GEM-Pfade wurde kein belastbarer Breaking Change gefunden; Modellkennungen werden nicht auf Verdacht geändert. Detailvertrag: `MID_OPEN_METEO_WATCH_0.9.85.108.md`.

Responsive Zielmatrix: 390×844, 430×932, 412×915, 834×1194, 1194×834 und 1440×900, jeweils Light/Dark. Das stündliche Höhenraster darf intern horizontal scrollen, aber die Dokumentbreite nicht erweitern. Mobile interaktive Ziele bleiben mindestens 44 CSS-Pixel groß.

Required Regressions: `scripts/test-open-meteo-lunar-daily-0985108.mjs`, `scripts/test-mid-18-2-16-mountain-redesign-0985108.mjs`, `scripts/test-current-hyperlocal-sky-083311.mjs`, `scripts/test-mountain-progressive-ui.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`, `scripts/test-mountain-persistence-layout-071063.mjs`, `scripts/test-mountain-wind-normalization-071054.mjs`, `scripts/test-pictogram-intensity-snow-depth-098426.mjs`, `scripts/test-mountain-forecast-collapse-08153.mjs`. Detailvertrag: `MID_MOUNTAIN_FORECAST_REDESIGN_0.9.85.108.md`.

## v0.9.85.107 · MID 18.2.15 kompakte Vorhersage- und Bergwetteransichten

MID 18.2.15 übernimmt ausschließlich den gegen `mid-stable` geprüften Replit-Handoff für UI/UX und integriert ihn selektiv über ChatGPT. 7- und 14-Tage-Zeilen werden vertikal verdichtet; Nachtpiktogramme bleiben vollständig sichtbar. In der 14-Tage-Ansicht ist die kanonische `head / sky / meta`-Struktur verbindlich; Sonnenstunden und UVI verwenden die tatsächlich aktive Klasse `cockpit-fourteen-sun-uvi` und dürfen auf kleinen Displays nicht auf Mikrotypografie zusammengedrückt werden.

Im Berg-/Wintersportprofil bleiben Tal-/Mittel-/Bergstufen und meteorologische Berechnung unverändert. Flüssigniederschlag und Schneefall werden visuell getrennt. Die Schneefall-Flächenstaffelung skaliert ausschließlich die dargestellte 3-h-Schneemenge und ist ausdrücklich **keine** amtliche WMO-/DWD-Warn- oder Intensitätsschwelle. Amtliche Warnungen bleiben klar von automatischen MID-Hinweisen getrennt; lange Beschreibungen werden sekundär über Details angeboten. Die amtliche Lawinenlage wird nur als Quellen-/Statusblock verlinkt; MID erfindet keine Gefahrenstufe. `Höhenwetter-Verlauf` bleibt entfernt, `Höhenvergleich` ist die kanonische Bezeichnung.

Der ChatGPT/GitHub-Vertrag ist auf den aktuellen Source-first-Veröffentlichungsweg harmonisiert: normaler Agentweg = Source-PR-Gate → kontrollierter Merge → serverseitiges `MID-professional-replacement.zip` → Installer → Worker/Pages-Prüfung → Stable-Promotion. Ein Release-ZIP im normalen Agent-PR ist unzulässig.

Required Regressions: `scripts/test-chatgpt-github-write-contract-098510.mjs`, `scripts/test-fourteen-day-replit-fluid-grid-098593.mjs`, `scripts/test-mountain-visual-acceptance-18213.mjs`, `scripts/test-mid-collaboration-hardening-0985106.mjs`.

## v0.9.85.106 · ChatGPT↔Replit Collaboration Hardening

ChatGPT ist die alleinige Auftrags-, Prüf- und Integrationsinstanz für MID-Arbeit, die an Replit delegiert wird. Replit bleibt gezielt UI-/Design-Werkbank und beginnt keine eigenständigen MID-Arbeitspakete. Jeder Replit-Stand wird ausschließlich als unprivilegierter `replit/*`-Handoff mit verifizierter Basis-, Commit- und Remote-Ref-SHA übergeben; direkte Änderungen an `main`, `mid-stable`, `chatgpt/*` oder `codex/*` sind unzulässig. Ein fehlender lokaler SSH-Deploy-Key wird nicht durch neue Schreibschlüssel oder gelockerte Hostprüfung ersetzt. Persistente Regeln liegen in `replit.md` und `.agents/skills/mid-handoff/SKILL.md`; Governance-, CI-/Release-, Worker-, iOS-, Versions- und zentrale Build-/Deploy-Dateien sind im Replit-Handoff-Gate geschützt. Veröffentlichung bleibt ausschließlich Source-PR-Gate → kontrollierter Merge → serverseitiges Release-ZIP → Installer → Worker/Pages → Stable-Promotion. Required Regression: `scripts/test-mid-collaboration-hardening-0985106.mjs`. Detailvertrag: `MID_REPLIT_HANDOFF_CONTRACT.md`.


## v0.9.85.76 · Pages-Release-Race-Schutz

RUC- und manuelle Stable-Pages-Publisher dürfen keinen älteren App-Shell-Stand veröffentlichen, während `main` bereits eine neuere MID-Version als `mid-stable` trägt. Der RUC-Publish vergleicht deshalb beim Eintritt in den Pages-Lock und unmittelbar vor dem Upload die Releaseversionen von `main` und `mid-stable`; bei Abweichung wird der Publish fail-closed als No-op übersprungen. Required Regression: `scripts/test-pages-release-race-098576.mjs`. Detailvertrag: `MID_PAGES_RELEASE_RACE_0.9.85.76.md`.

## v0.9.85.75 · MID 18.2.2 obligatorisches Redesign

Die Umschaltung zwischen der neuen MID-Gesamtoberfläche und der bisherigen klassischen Gesamtansicht ist entfernt. Die neue Bottom-/Workspace-Navigation und der moderne Forecast-Arbeitsraum sind obligatorisch; ein alter gespeicherter `mid:designMode:v1`-Wert wird migriert und darf keinen Legacy-Pfad reaktivieren. **Die unabhängige fachliche Auswahl Skybar ↔ 24 Stundenquadrate bleibt ausdrücklich erhalten.** Required Regression: `scripts/test-mid-18-2-2-mandatory-design-098575.mjs`. Detailvertrag: `MID_MANDATORY_REDESIGN_0.9.85.75.md`.

## v0.9.85.74 · RUC-Pages-Budget und fachliche Kadenzpriorisierung

Der kostenlose RUC-Pages-Pfad darf die kombinierte GitHub-Pages-Sicherheitsgrenze nicht durch Vollgitterdiagnostik ausreizen. Zusätzlich zur 950-MB-Site-Grenze gilt deshalb ein **900.000.000-Byte-RUC-Datenbudget**, das bereits in `prepare_ruc_pages.py` geprüft wird. Native 15-Minuten-Zustandsdaten werden im operativen Free-Profil auf `VIS` und `CEILING` konzentriert. `HZEROCL` und `SNOWLMT` bleiben stündlich, weil ihre Entwicklung gegenüber Sicht/Ceiling träger ist und die Niederschlagsphase bereits separat nativ 15-minütig vorliegt. Die 15-Minuten-Solarvollfelder werden im Free-Produktionspfad nicht geladen/publiziert, solange kein sichtbarer MID-Prognoseverbraucher sie nutzt. Für T/TD/RH, MSLP, Wind/Böen und CLCT/CLCL gilt weiterhin der tatsächlich vom DWD veröffentlichten Kadenzvertrag; beim geprüften Lauf waren diese Felder stündlich. Insbesondere darf CLCT nicht als native Viertelstundenfolge bezeichnet werden. Required Regression: `scripts/test-mid-18-2-1-ruc-pages-budget-098574.mjs`.

## v0.9.85.73 · Parameter-native RUC-Kurzfrist

Für die operative 0…+6-h-Prognose gilt die feinste tatsächlich publizierte Parameterkadenz: RUC-Niederschlag 5 min; kurzfristig relevante Zustandsfelder werden nur bei vollständiger nativer Folge als 15-min-`state15` übernommen. Dazu zählen T/TD/RH, MSLP, 10-m-Wind/Böen, CLCT/CLCL sowie – sofern nativ vollständig – CLCM/CLCH, VIS, CEILING, HZEROCL, SNOWLMT und T_G. Fehlende 15-min-Felder fallen parameterweise auf den bestehenden Stundenpfad zurück; es gibt kein künstlich als nativ etikettiertes Upsampling. Radar/Nowcast und belastbare Beobachtungen behalten im unmittelbaren Zeitraum Vorrang. `displayMinutes15`, 90-Minuten-Wettertext/Piktogramm und Skybar nutzen denselben finalisierten Zustandsvektor. Required Regression: `scripts/test-mid-18-2-1-ruc-native-cadence-098573.mjs`.

## v0.9.85.72 · Kurzfrist-Skybar/Wettertext-Kohärenz

In der finalisierten Kurzfristreihe müssen trockener Wettertext, Piktogramm und Skybar denselben Himmelszustand beschreiben. Gesamtbewölkung ist dabei primär; tiefe Bewölkung ist nur Fallback bei fehlender Gesamtbewölkung. Für trockene Lagen gilt die WMO-nahe Oktaschwelle: „Bedeckt“ ab 87,5 % Gesamtbewölkung. Nebel bleibt sicht-/feuchtebasiert separat, Niederschlags- und Gewittercodes bleiben unberührt. ICON-D2-RUC CLCT/CLCL werden aktuell stündlich in den kanonischen Forecastkern übernommen; die 15-Minuten-Kurzfrist interpoliert diese Zustandsfelder und darf nicht als native 15-Minuten-CLCT-Folge bezeichnet werden. Required Regression: `scripts/test-mid-18-2-1-skybar-cloud-coherence-098572.mjs`.

## v0.9.85.71 · MID 18.2.1 Replit-Handoff

Der Replit-Redesignstand ist ausschließlich eine visuelle/UX-Referenz und keine alternative Wetterdaten- oder Releasebasis. Übernommen werden nur gegen `mid-stable` geprüfte Verbesserungen. Lange Ortsnamen dürfen im modernen Ortskopf nicht per Ellipse gekürzt werden. Ein expliziter Bottom-Bar-/Horizontsprung zu „Heute“ verwirft den zuvor gespeicherten internen Scrollstand des Kurzfrist-Cockpits und beginnt am Kopf der Ansicht. Die Kartenoberfläche darf verdichtet werden, ohne Radar-, Satelliten-, Nowcast-, DWD- oder Synoptikfunktionen zu entfernen oder Fixture-Daten an die Stelle produktiver Datenpfade zu setzen. Die bereits vorhandene amtliche DWD-Bodenanalyse und die getrennt gekennzeichnete MID-Modellanalyse bleiben kanonisch. Required Regression: `scripts/test-mid-18-2-1-replit-handoff-098571.mjs`.

## v0.9.78.2 · Installer-Spiegel-Hotfix

Der mit dem Professional-Release transportierte Installer-Spiegel `workflow-patches/install-mid.yml` muss bytegleich zum kanonischen Workflow `ci/github/workflows/install-mid.yml` bleiben. Abweichungen sind unzulässig, wenn dadurch Release-/Workflow-Regressionen gegen einen veralteten Vertragsstand laufen würden. Der Hotfix v0.9.78.2 enthält keine fachliche App- oder Workerlogikänderung; er repariert ausschließlich diese transportierte Workflow-Spiegeldatei und die dazugehörige Versionsfortschreibung.


## v0.9.78.3 · GitHub-Installer-Regressionsvertrag

Ein Release-Regressionstest darf einen ausdrücklich supersedierten UI-Vertrag nicht weiterhin erzwingen. Für die 7-Tage-Ansicht gilt ab v0.9.78.1 ausschließlich die absolute ECMWF-Temperaturskala ohne Klimaabweichungsanzeige; die signierte Klimadelta-Logik bleibt auf 14 Tage begrenzt. Außerdem darf die aktive `.github/workflows/install-mid.yml` während eines ZIP-Installationslaufs nicht bytegleich zur neu installierten kanonischen `ci/github/workflows/install-mid.yml` vorausgesetzt werden: `.github` ist absichtlich vom automatischen Release-Ersatz ausgeschlossen. Aktive Workflows werden in solchen Regressionen semantisch auf ihren Sicherheits-/Kompatibilitätsvertrag geprüft; eine tatsächliche Workflow-Synchronisierung bleibt eine explizite administrative Aktion.


## v0.9.78.4 · 7-Tage-Geometrie und Tmin/Tmax-Lesbarkeit

Die 7-Tage-Kurvenübersicht verwendet für den oberen Tages-/Piktogrammbereich exakt dieselben relativen linken und rechten Plotränder wie das gemeinsame 00–24-h-SVG. Jeder Tageskopf ist dadurch geometrisch deckungsgleich mit seinem 24-Stunden-Abschnitt im Diagramm; responsive Breakpoints dürfen diese Ausrichtung nicht mit separaten Padding-Werten überschreiben. Im 7-Tage-Modus zeigen Tmin/Tmax nur noch die Werte ohne zusätzliche „Min“-/„Max“-Beschriftungen. Die ECMWF-Farbidentität bleibt erhalten, die Hintergrundflächen der Tmin/Tmax-Badges werden jedoch deutlich schwächer gemischt. Für 14 Tage bleiben die signierten Klimadeltas fachlich bestehen, ebenfalls mit abgeschwächten Badge-Hintergründen für bessere Lesbarkeit. Required Regression: `scripts/test-seven-day-axis-badge-lock-09784.mjs`.


## v0.9.78.5 · Tmin/Tmax-Regressionsvertrag

Die in v0.9.78.4 abgeschwächten Tmin/Tmax-Hintergründe sind verbindlich und dürfen nicht durch ältere Regressionserwartungen auf stärkere Flächen zurückgesetzt werden. Für 7 Tage gilt die absolute ECMWF-Farbskala ohne Klimadelta und ohne `Min`/`Max`-Zusatzlabel. Für 14 Tage bleibt die signierte, nichtlineare Klimaabweichungsreaktion erhalten, jedoch mit bewusst gedämpftem Hintergrund und Rahmen zugunsten der Zahlenlesbarkeit.

## Versionslogik

- Funktionale Erweiterung: nächste dreiteilige Funktionsversion.
- Fehlerkorrektur, Regression oder technische Wartung: nächste vierteilige Wartungsversion.
- Die Releaseversion wird zentral aus `package.json` in App, Worker, Service Worker, `version.json` und `MID_BASELINE.json` synchronisiert.

## Release-, Abhängigkeits- und Wartungsvertrag ab v0.8.26.0

- Paketversion, Rootversion des `package-lock.json`, `MID_BASELINE.json`, Frontend, Worker, Service Worker und `version.json` werden ausschließlich über `npm run sync-version` gemeinsam fortgeschrieben.
- Der Produktionsbuild führt TypeScript-Prüfungen mit `--noEmit` aus. `*.tsbuildinfo`, generierte `vite.config.js`/`vite.config.d.ts`, `node_modules` und `dist` gehören nicht zur verbindlichen Quell- oder Releasebasis.
- Die unterstützte Laufzeit ist in `package.json` festgelegt. Releases verwenden einen reproduzierbaren npm-Lockfile-Vertrag und dürfen keine internen oder lokalen Registry-URLs enthalten.
- GitHub Actions müssen auf vollständige Commit-SHAs festgeschrieben sein. Berechtigungen werden pro Job nach dem Minimalprinzip vergeben; Sicherheits- und Abhängigkeitsprüfungen dürfen den Funktions- und Regressionstest nicht ersetzen.
- Dependabot darf Aktualisierungsvorschläge erzeugen, aber keine Hauptversionsmigration automatisch zusammenführen. Funktionskritische Bibliotheken – insbesondere Diagramm-, Karten- und React-Hauptversionen – werden nur in einem eigenständig geprüften MID-Release migriert.
- Laufzeitcaches benötigen eine fachlich angemessene Ablaufzeit und eine feste Obergrenze. Beim Begrenzen dürfen bestehende Fallbacks, Offlinewerte oder Funktionen nicht stillschweigend entfallen.
- DOM-Beobachter sind auf den kleinsten fachlich erforderlichen Container und Ereignissatz zu beschränken. Dokumentweite Attributbeobachtung ist nicht zulässig, wenn dieselbe Funktion über Komponentenereignisse, Interaktion oder `ResizeObserver` erhalten werden kann.

## Verbindlicher UI- und Architekturvertrag ab v0.9.50.0

- `MID_UI_ARCHITECTURE_CONTRACT.md` ist für neue Sektionen, Menüs, Info-Schaltflächen, Tooltips, Drawer, Formatierungen und fachliche UI-Verbraucher verbindlich.
- `MID_PARAMETER_COLOR_CONTRACT.md` ist für alle meteorologischen Visualisierungen verbindlich. Parameteridentitäten dürfen nicht durch lokale Diagrammpaletten oder unbeschriftete Wert-/Klimafarbskalen ersetzt werden.
- Neue nicht-modale, verankerte Ebenen verwenden `src/AppPortalPopover.tsx`; appweite `(i)`-Hinweise verwenden `src/AppInfoPopover.tsx`/`AppInfoHint`.
- Neue Dateien dürfen keine zweite generische `createPortal`-/Außenklick-/Escape-Engine kopieren. Historisch spezialisierte Ensemble-Diagrammtooltips sind nur als regressionsgeschützte Ausnahme zulässig.
- Neue Sektionen dürfen appweite Wetter-, Niederschlags-, Wetterzwilling-, Stations-, Zeit- oder Einheitenlogik nicht lokal neu zusammensetzen, wenn dafür bereits ein kanonischer MID-Pfad existiert.
- `MID_FORECAST_CONSISTENCY_CONTRACT.md` ist für alle Forecast-Verbraucher verbindlich: sichtbare Prognosemodule verwenden die kanonischen finalen Stunden (`displayHours`) und – soweit 15-Minuten-Daten benötigt werden – die finalisierte Reihe (`displayMinutes15`). Hyperlokal-, Radar-/Nowcast- und Konvektivkorrekturen dürfen nicht ansichtsspezifisch erneut berechnet werden.
- `MID_STATE_INTEGRITY_CONTRACT.md` ist für Favoriten und Hauptsektionen verbindlich: Orts- und Event-Favoriten bleiben strikt getrennt und verlustfrei; derselbe Ort darf parallel in beiden Domänen existieren. Ein Favoriten-Tap darf genau eine Mutation auslösen, und räumliche Näherung darf niemals eine Löschung/Toggle-Entscheidung begründen. Kein Limit, Import, Sync oder Normalisierungspfad darf Favoriten stillschweigend verdrängen. Hauptsektionen verwenden einen einheitlichen gerätelokalen `mid:module:<id>:open`-Vertrag; alte Dashboard-Hashes oder Geräte-Sync dürfen beim App-Start keine Sektion selbständig öffnen.
- `MID_NOTIFICATION_RELIABILITY_CONTRACT.md` ist für Push-Benachrichtigungen verbindlich: „Aktiv“ setzt Browser-Abonnement, Worker-Registrierung und aktuellen Scheduler-Heartbeat voraus; ein echter Ende-zu-Ende-Test muss verfügbar sein. Niederschlagsbeginn verwendet die zentrale Niederschlags-Reconciliation, und Push-Regeln/Favoriten dürfen nicht still gekappt werden.
- Codebereinigungen dürfen geschützte Funktionen nicht entfernen. Strukturelle Vereinheitlichung ist nur zulässig, wenn die bestehenden Fach- und UI-Regressionen erhalten bleiben oder auf denselben, nun zentralen Vertrag aktualisiert werden.


## Ergänzung v0.9.53.32 – Hauptsektions-Recovery-Isolation

Der Hauptsektionsvertrag ist auf `mid:module-open-contract:v5` angehoben. Hauptmodul-Offenzustände (`mid:module:<id>:open`) sind ausschließlich gerätelokaler View-State. Sie dürfen weder durch Geräte-Sync noch durch `persistence.ts`-Recovery-Snapshots oder den `storageSafety`-IndexedDB-Spiegel wiederhergestellt werden. Alte Spiegelwerte werden beim Start verworfen. Die v5-Heilungsmigration setzt alle Hauptsektionen einmalig geschlossen, damit insbesondere ein historisch kontaminierter `long-range`-Offenzustand beseitigt wird. Danach gilt wieder ausschließlich die unmittelbar und synchron gespeicherte lokale Nutzerentscheidung. Required Regression: `scripts/test-module-open-recovery-isolation-095332.mjs`.

## Ergänzung v0.9.53.33 – astronomischer Symbolvertrag

`MID_SOLAR_SYMBOL_CONTRACT.md` ist app-weit für alle zeitpunktbezogenen Wetterpiktogramme verbindlich. Primäre Tag-/Nachtentscheidung ist die astronomische Sonnenaufgangs-/Sonnenuntergangsgrenze am tatsächlichen Prognoseort (`astronomicalIsDayAt()` / `solarDaylightWindowAt()`); Provider-`is_day` ist ausschließlich ein Fallback. Die kanonischen Stunden- und 15-Minuten-Reihen tragen den exakten Sonnenstatus, Kurzfrist-/90-Minuten-Interpolation darf keinen Stundenstatus über die Sonnenuntergangsgrenze fortschreiben, und native Widgets folgen derselben Grenzlogik. Required Regression: `scripts/test-solar-symbol-contract-095333.mjs`.

## v0.9.53.34 · Event-Lifecycle / Splashscreen
Verbindliche Referenz: `MID_EVENT_LIFECYCLE_STARTUP_CONTRACT.md`. Event-Ablauf wird ortszeitzonengerecht bestimmt; abgelaufene Events werden appweit gekennzeichnet und nicht mehr automatisch refreshed. Der Splashscreen folgt dem eingestellten Theme, zeigt das vollständige MID-Logo prominent und nutzt für eine kurze Startvorladung ausschließlich den bestehenden kanonischen Forecastpfad.

## v0.9.53.35 · Produktionsbuild-Fix
Der fehlgeschlagene v0.9.53.34-Release-Kandidat wird ausschließlich technisch korrigiert: `src/eventWeatherRefresh.ts` importiert `EventCenterRecord` nicht mehr unbenutzt. Die Event-Lifecycle-/Splashscreen-Funktionen von v0.9.53.34 bleiben vollständig erhalten. Required Regression: `scripts/test-event-refresh-buildfix-095335.mjs`.

## v0.9.53.36 · Modellquellen-/Ensemble-Fallback-Vertrag

`MID_MODEL_SOURCE_CONTRACT.md` ist app-weit verbindlich. Ensembleabrufe sind success-driven: fehlgeschlagene Modelle oder nicht konfigurierte optionale Regionaladapter verbrauchen keinen Erfolgsplatz. ECMWF IFS/AIFS verwenden einen nativen Europa→Global-Fallback innerhalb derselben Variantengruppe, ohne Doppelgewichtung. Aktive numerische Modelle bleiben in der Modellstandanzeige sichtbar, selbst wenn Laufmetadaten fehlen; Status `Aktiv`, `Fallback`, `Nicht verfügbar`, `Adapter fehlt` und `Reserve` werden unterschieden. Die offizielle Mean/Spread-Reserve ist um AIGEFS, UKMO, MeteoSwiss und BOM ergänzt. Einrichtung externer Regionaladapter folgt `MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md`. Required Regression: `scripts/test-model-source-capability-contract-095336.mjs`.

## v0.9.53.37 · Kosten-Governance und Temperatur-Messkonsens

`MID_COST_GOVERNANCE_CONTRACT.md` ist für alle weiteren MID-Schritte verbindlich. Solange MID keine Einnahmen generiert, darf keine kostenpflichtige Infrastruktur, API, Subscription, Entwickler-Mitgliedschaft oder sonstige Ausgabe ohne vorherige transparente Kostenangabe und ausdrückliche Nutzerfreigabe aktiviert oder vorausgesetzt werden. Kostenfreie/Open-Data-Pfade haben Vorrang; optionale nicht eingerichtete Quellen müssen ohne Funktionsverlust zurückfallen. Insbesondere wird für den vorbereiteten KNMI-/ECCC-GRIB-Punktadapter kein kostenpflichtiger VPS beschafft, solange keine ausdrückliche Freigabe vorliegt.

Für die aktuelle 2-m-Temperatur ergänzt `MID_HYPERLOCAL_ANALYSIS_CONTRACT.md` die modellgestützte Restfeldanalyse um einen streng begrenzten direkten Messkonsens. Dieser greift nur bei mehreren frischen, nahen, voneinander getrennten Temperaturmesspunkten und verhindert, dass ein fehlerhafter räumlicher Modellgradient am Zielpunkt trotz deutlich abweichender lokaler Beobachtungen als „Temp. nahe Modell“ bestätigt wird. Die UI weist die tatsächlichen Temperatur-Messpunkte und ihren gewichteten Radius getrennt von der feldübergreifenden Stationsmenge aus. Required Regression: `scripts/test-hyperlocal-direct-temperature-consensus-095337.mjs` und `scripts/test-cost-governance-contract-095337.mjs`.

## v0.9.67.0 · gemeinsamer Browser-/iOS-Vertrag

`MID_CROSS_PLATFORM_CONTRACT.md` ist für die parallele Browser-/PWA- und
iOS-Weiterentwicklung verbindlich. Beide Produkte verwenden denselben React-/
Vite-Fachkern und denselben Worker; ein separater iOS-Fachfork ist unzulässig.
Native Fähigkeiten werden ausschließlich über Plattformadapter ergänzt.
`MID_IOS_ROADMAP.md` legt die autonome Etappenfolge und Apple-Freigabegates
fest; `MID_IOS_STATUS.json` benennt den jeweils nächsten sicheren Meilenstein.
Browserbuild, vollständige MID-Regressionen und iOS-WebView-/Capacitor-Prüfung
bleiben getrennte Pflichtstufen. Kostenpflichtige Apple-, Signierungs-,
TestFlight- oder macOS-CI-Schritte bleiben dem
`MID_COST_GOVERNANCE_CONTRACT.md` unterstellt.

## v0.9.69.2 · DWD ICON-D2-RUC/RUC-EPS-Vertrag

`MID_DWD_RUC_PIPELINE_CONTRACT.md` ist für den gemeinsamen Kurzfrist-Fachkern verbindlich. Best Match bleibt die kohärente Prognosebasis; ICON-D2-RUC darf ausschließlich 0–14 h innerhalb seines geprüften DWD-Gebiets kalibrieren und teilt sich mit der ICON-Familie das Unabhängigkeitsbudget. RUC-EPS wird nur für passende Kurzfrist-/Eventhorizonte vor ICON-D2-EPS versucht und bleibt mit diesem in derselben DWD-Ensemble-Variantengruppe. Numerische Modellwerte dürfen die Blitzbindung der Gewitterbezeichnung nicht aufheben. Rohes GRIB/BUFR wird niemals im Cloudflare Worker dekodiert. Die R2-/Actions-Pipeline ist auf lauf-immutable Objekte inklusive Lookup, voraggregierte EPS-Kurzfristwerte, atomaren `latest.json`-Wechsel, idempotente Wiederholung und Fallback-sichere Retention gehärtet. R2 bleibt private-by-default (`r2.dev` aus), ein Custom Domain ist optional und separat freizugeben. Der `ruc-health`-Pfad prüft den produktiven Storagezustand ohne Infrastrukturgeheimnisse offenzulegen. Die Pipeline bleibt gemäß `MID_COST_GOVERNANCE_CONTRACT.md` bis zur ausdrücklichen Kostenfreigabe deaktiviert. Required Regressions: `scripts/test-ruc-dwd-pipeline-09690.mjs`, `scripts/test-ruc-fusion-runtime-09691.mjs` und `scripts/test-ruc-storage-health-09692.mjs`.


## v0.9.69.3 · automatischer Worker-Deploy-Vertrag

`MID_WORKER_AUTO_DEPLOY_CONTRACT.md` ist für künftige Cloudflare-Worker-Änderungen verbindlich. Nach vollständiger Releaseprüfung wird eine fachliche Worker-Änderung gegen `mid-stable` ermittelt; reine Versionsmetadaten lösen keinen Deploy aus. Bei fachlicher Änderung wird die aktuelle Remote-Konfiguration fail-closed gespiegelt, eine neue Worker-Version zunächst mit 0 % Traffic gestaged, per Cloudflare-Versionsoverride geprüft und erst danach auf 100 % promoviert. Fehler nach dem Staging schalten automatisch auf die zuvor aktive Version zurück; Pages und `mid-stable` dürfen ohne grünes Worker-Gate nicht weitergeführt werden. Wrangler-Auto-Provisioning ist deaktiviert, Dashboard-Variablen/Secrets bleiben erhalten, unbekannte Bindings blockieren die Automatisierung. Browser/PWA und iOS bleiben auf demselben Worker-Fachkern. Required Regression: `scripts/test-worker-auto-deploy-09693.mjs`.


## v0.9.69.4 · Worker-Placement-Spiegel-Hotfix

Der automatische Worker-Deploy übernimmt Placement aus der Cloudflare-Remote-Konfiguration nur bei einer gültigen Placement-Angabe. Ein leeres `placement`-Objekt wird weggelassen. Smart Placement sowie genau ein `region`-/`host`-/`hostname`-Hinweis werden erhalten; widersprüchliche oder unbekannte Angaben blockieren fail-closed. Required Regression: `scripts/test-worker-auto-deploy-09693.mjs`.

## v0.9.69.5 · Worker-Entry-Point-Spiegel-Hotfix

Die dynamische Wrangler-Konfiguration darf unabhängig von ihrem temporären Speicherort den Worker-Einstiegspunkt nur auf den ausgecheckten Release-Arbeitsbaum beziehen. `config.main` wird deshalb als absoluter Pfad auf `worker/metar-proxy.js` erzeugt. Relative Pfade, die Wrangler bei einer unter `/tmp` liegenden Config gegen `/tmp` auflösen könnte, sind für den Auto-Deploy unzulässig. Required Regression: `scripts/test-worker-auto-deploy-09693.mjs`.


## v0.9.72.0 · Apple Push-/Background-Refresh-Quellvertrag

`MID_APPLE_PUSH_BACKGROUND_CONTRACT.md` ist für die weitere native Apple-Integration verbindlich. APNs-Callbacks und `BGAppRefreshTask` werden im bestehenden Capacitor-Haupttarget ausschließlich quellenmäßig vorbereitet; sichtbare Wetter-, Warn-, Event- und Forecastlogik bleibt im gemeinsamen React/Vite-/Worker-Fachkern. Vor dem ausdrücklichen Apple-/Kosten-Gate werden weder Notification-Berechtigung noch `registerForRemoteNotifications()`, Token-Upload, `aps-environment`, `UIBackgroundModes`, APNs-Provider-Secrets, Signierung noch Geräteinstallation aktiviert. Der vorbereitete Background-Identifier lautet `app.midwx.weather.background-refresh`. Required Regression: `scripts/test-apple-push-background-source-preparation-09720.mjs`.


## v0.9.73.0 · Apple Privacy-/Berechtigungsmanifest-Vertrag

`MID_APPLE_PRIVACY_PERMISSION_CONTRACT.md` ist für App und Widget verbindlich. Beide ausführbaren Apple-Bundles besitzen ein eigenes `PrivacyInfo.xcprivacy`; Tracking bleibt `false`. Das Haupt-App-Manifest deklariert die tatsächlich verwendeten off-device Kategorien Precise Location, den optionalen zufälligen Geräte-Sync-Identifier, verschlüsselten portablen Nutzerinhalt sowie Cloudflare-RUM Produktinteraktion/Performance. Für `@capacitor/filesystem` ist `NSPrivacyAccessedAPICategoryFileTimestamp` mit Reason `C617.1` deklariert. Die Widget-Extension bleibt auf Precise Location und frei eingegebenen Standortinhalt für `mid.native.widget.v1` begrenzt. Der Meilenstein aktiviert weder ATT, Push, Background Modes, Hintergrund-Ortung, Entitlements noch Signierung. Required Regression: `scripts/test-apple-privacy-permission-manifest-09730.mjs`.

## v0.9.77.18 · KNMI-HARMONIE-EPS-Produktivcache

`MID_KNMI_HARMONIE_EPS_CACHE_CONTRACT.md` ist für den produktiven KNMI-HARMONIE-AROME-Cy43-P4a-Cache verbindlich. Der gemeinsame Worker verwendet das bereits vorhandene KV-Binding `MID_PUSH_SUBSCRIPTIONS` ausschließlich unter dem getrennten Präfix `cache:knmi-eps:tar-index:v1:`; ein neues Cloudflare-Namespace oder ein neuer Workflow ist unzulässig. Persistiert wird nur die stabile TAR-Struktur, niemals API-Schlüssel, temporäre Download-URLs, Roh-GRIB/TAR-Inhalte oder zeitabhängige Rolling-Membernummern. TAR-Indizes leben 72 h persistent und 10 min im Isolate-Memory-Cache. Sparse-Dateibereiche werden in höchstens 16 HTTP-Multi-Ranges je Request gepackt, ohne vollständige Archive oder Zwischenräume mitzulesen. Der Push-Scheduler bleibt strikt auf `sub:` beschränkt und der Cache verwendet kein `KV.list()`. Die produktive KNMI-Daten-/Rolling-Member-Anbindung bleibt der nächste Hauptabschnitt und muss diesen Cache wiederverwenden. Required Regression: `scripts/test-knmi-eps-productive-cache-097718.mjs`.

## v0.9.77.22 · KNMI-HARMONIE-EPS-Punktdecoder

`MID_KNMI_HARMONIE_EPS_DECODER_CONTRACT.md` und `tools/knmi_eps_decoder/` sind für Abschnitt 3/4 der direkten KNMI-P4a-Integration verbindlich. Der externe Decoder konsumiert ausschließlich das vom Worker erzeugte `mid.knmi.harmonie-eps.rolling-manifest.v1`, fordert nur dessen HTTP-206-Bytebereiche an und baut weder Listing noch TAR-Index oder Vollarchivpfad nach. P4a wird als GRIB1 dekodiert; Temperatur, Regen, 10-m-Wind und Böen werden als Memberfelder ausgegeben. Akkumulierter Rolling-Regen wird je 5er-Batch am ersten gemeinsamen Gültigkeitszeitpunkt baselined und anschließend differenziert. P4a Europe ist im Modellkatalog mit 5,5 km und stündlicher Aktualisierung geführt. Hosting/Aktivierung bleibt Abschnitt 4/4 und ist ohne kostenfreien vorhandenen Runtimepfad bzw. ausdrückliche Kostenfreigabe unzulässig. Required Regression: `scripts/test-knmi-eps-point-decoder-097722.mjs`.
## v0.9.77.23 · 24-h-Skybar und KNMI-EPS-Aktivierungs-Gate

Das 24-h-Wetterprofil verwendet für die Gesamtzeile denselben zentralen `detailSkyBarSegments`-Vertrag wie die Tagesansicht; H/M/L bleiben separate graue Intensitätsbänder. Wertepillen am aktiven Zeitcursor sind leicht transparent. `MID_KNMI_HARMONIE_EPS_ACTIVATION_AUDIT_0.9.77.23.md` dokumentiert zugleich Abschnitt 4/4: Der vorbereitete ecCodes-Punktdecoder wird nicht kostenpflichtig aktiviert. Cloudflare Python Workers sind für den nativen ecCodes-Referenzdecoder derzeit kein kompatibler Runtimepfad; Cloudflare Containers setzen einen kostenpflichtigen Workers-Paid-Plan voraus. Ohne kostenfreien kompatiblen Host, validierten Wasm-/JS-Decoder oder ausdrückliche Kostenfreigabe bleibt die reale E2E-Aktivierung gesperrt.
## v0.9.77.24 · KNMI-EPS Wasm32-Punktprototyp

`tools/knmi_eps_wasm_prototype/` ist der verbindliche, nicht-produktive Forschungsstand für Abschnitt 4/4. Der Build pinnt ECMWF ecCodes 2.48.1, nutzt wasm32 und `ENABLE_MEMFS=ON`, verarbeitet bereits getrennte GRIB1-Nachrichten ausschließlich im Speicher und ruft die native ecCodes-Nearest-Point-API auf. Ein Vollgittertransfer nach JavaScript, NODEFS, Queue-/Binding-Aktivierung oder eine neue npm-Produktionsdependency sind verboten. Die Python/ecCodes-Implementierung bleibt Referenz, bis reale P4a-Numerik sowie Bundle/RAM/CPU gemessen sind. Required Regression: `scripts/test-knmi-eps-wasm32-prototype-097724.mjs`.
## v0.9.77.25 · Witterungstrend, Season-Poor-Man’s-Ensemble und Tmin/Tmax-Kästchen

Temperatur ist im Witterungstrend Tag 15–46 der fail-safe Default; `mid:subseasonal-trend:metric` speichert die letzte gültige Auswahl. Der Season-Bereich verwendet alle tatsächlich numerisch geladenen unabhängigen Modellfamilien mit genau einer Stimme je Familie als Poor-Man’s-Ensemble und zeigt dieselben verfügbaren Einzelmodelle gemeinsam in einem Diagramm. Reine Katalog-/Status-/Zusatzmodellkästen ohne Zahlenwerte werden nicht dargestellt. Tmin/Tmax erscheinen in 7-/14-Tage-Übersichten wieder als kompakte blaue/rote Kästchen; bereits etwa ±0,5 bis ±1 K zum jeweiligen Klimamittel verändern Zahl-, Hintergrund- und Rahmenintensität sichtbar. Aktuelle/stündliche Temperaturen bleiben neutral. Required Regression: `scripts/test-trend-seasonal-temperature-ui-097725.mjs`.


## 0.9.77.27
- Saison-/Langfristtrend verwendet kanonische `modelKey`-/`independenceKey`-Identitäten. Datenanbieter sind keine zusätzlichen Modellstimmen.
- C3S führt 10 aktuelle operationelle Systeme; ECCC System 4/5 bleiben getrennte Systeme. NOAA NMME wird dynamisch aus dem jüngsten ENSMEAN-Lauf übernommen.
- Poor-Man’s-Ensemble gewichtet jedes tatsächlich numerisch verfügbare unabhängige Modellsystem exakt einmal; C3S/NMME/Open-Meteo-Dubletten werden zusammengeführt.
- NOAA-NMME-Punktdaten werden primär per NetCDF-Header-Range und HTTP Multi-Range gelesen; Volldownload ist nur Fallback. Keine neue kostenpflichtige Ressource.
- WMO/APCC/CanSIPS/DWD-EPISODES werden nicht als scheinbar zusätzliche Monatsstimmen eingemischt, wenn Zeitachse, Authentifizierung oder Modellabhängigkeit das fachlich verbieten. Vollständiger Audit: `MID_SEASONAL_LONG_RANGE_SOURCE_AUDIT_0.9.77.27.md`.

## v0.9.77.28 · Tmin/Tmax-Klimamittel-Sichtbarkeit und Datenbedarf

Tmin/Tmax in 7-/14-Tage-Übersichten verwenden das jeweilige klimatologische Tagesminimum/-maximum 1991–2020 unabhängig von optionalen Summary-Anzeigen. Solange die Tagesprognose aktiv ist, muss die Klimatologie angefordert werden. Jeder Tagesbadge zeigt zusätzlich zum Temperaturwert seine individuelle Abweichung in K; fehlende Klimadaten werden als `Δ –` gekennzeichnet und dürfen nicht als echte neutrale Klimaabweichung erscheinen. Die Intensität der blauen Tmin- bzw. roten Tmax-Kästchen wird ausschließlich aus dieser individuellen Abweichung abgeleitet und reagiert bereits um ±0,5 bis ±1 K sichtbar. Ein vorhandener Klimacache darf bei vorübergehendem Archive-Endpunktfehler stale weiterverwendet werden. Required Regression: `scripts/test-climate-delta-badges-097728.mjs`.

## v0.9.77.29 · Witterungsresilienz, Nicht-EPS-Langfrist und 7-Tage-Kurvenübersicht

`MID_LONG_RANGE_SOURCE_EXPANSION_0.9.77.29.md` ist für zusätzliche Witterungs-/Saisonquellen verbindlich. Ein Modellbeitrag muss nicht aus einzelnen EPS-Membern bestehen; numerische Ensemble-Mittel oder belastbare deterministische Modellmittel sind zulässig, sofern Zeit-/Anomalieachse kompatibel ist und `independenceKey` eine unabhängige Modelllinie kennzeichnet. Jede Modelllinie erhält weiterhin genau eine Stimme. DWD GCFS2.2 ist eine eigenständige saisonale DWD-Linie; DWD Subseasonal EPISODES basiert dagegen auf ECMWF IFS ENS/Extended-Range und darf nur als regionaler Downscaling-/Qualitätsanker, nicht als zusätzliche EC46-Stimme genutzt werden. Der Witterungstrend darf die Anzeige vorhandener EC46/GEFS-Werte nicht mehr von einem vollständigen 1991–2020-Klimatologieabruf abhängig machen; Quell- und Klimabudgets sowie 36-h-Stale-Fallback sind verbindlich. Die 7-Tage-Hauptansicht besitzt direkt oberhalb der Tageskarten eine responsive Kurvenübersicht aus denselben kanonischen Tages-/Stundendaten, Wetterpiktogrammen und Parameterfarben. Required Regression: `scripts/test-witterung-seven-day-curve-097729.mjs`.

## Ergänzung v0.9.78.0 – verbindlicher appweiter Wetterpiktogramm-Standard 2.0

`MID_WEATHER_PICTOGRAM_STANDARD.md` ist ab v0.9.78.0 für alle meteorologischen Wetterzustands-Piktogramme verbindlich. `src/WeatherPictogram.tsx` ist der einzige kanonische Wetterzustandsrenderer im gemeinsamen React/Vite-Fachkern. Forecast-, Tages-, Stunden-, Event-, Reise-, Routen-, Wasser-, Berg-, Ensemble- und Widgetansichten dürfen keine parallelen Emoji-, Rasterasset- oder lokalen Wettericonpfade neu einführen. Die Symbolfamilie muss Tag/Nacht sowie Hell/Dunkel bei identischer skalierbarer SVG-Geometrie unterstützen. Niederschlagsart und Niederschlagsstärke werden getrennt kodiert; insbesondere Sprühregen, gefrierender Sprühregen/Regen, Regen/Schauer, Schnee, Schneegriesel, Schneeschauer, stratiformer und konvektiver Misch-Niederschlag, Eiskristalle, Eiskörner, Graupel und Hagel müssen unterscheidbar bleiben. Dekodierte SYNOP-/BUFR-/METAR-Present-Weather-Angaben dürfen über den zentralen `phenomenon`-Pfad eingebunden werden. Intensität darf nicht allein über Farbe vermittelt werden. Der alte Forecast-Emoji-Hilfspfad ist nicht mehr zulässig. Required Regression: `scripts/test-weather-pictogram-standard-09780.mjs`.


## v0.9.78.1 · Weather-Icon-System-Lock und 7-Tage-Stundenkurve

`MID_WEATHER_PICTOGRAM_STANDARD.md` wird verschärft: Weather Icon System 2.0 ist die appweite visuelle Referenz; Wetterglyphen sind standalone und dürfen keine eingebaute alte Sky-Plate tragen. Repräsentative Tages-/Nachtpiktogramme müssen ihre Phase aus dem kanonischen `precipitationParts(...).displayCode` ableiten, damit Niederschlagscharakter und Symbol nicht auseinanderlaufen. `Regenschauer`, Sprühregen, Schneegriesel, Schnee-/Mischphasen, Hagel und Gewitter bleiben damit auch in kompakten 7-Tage-Karten unterscheidbar.

Der 7-Tage-Temperatur-/Niederschlagsblock folgt dem freigegebenen Konzept: die Temperaturkurve basiert auf den stündlichen kanonischen Forecastwerten, Niederschlagsbalken sind stündlich und auf derselben Zeitachse ausgerichtet, 00/12-Uhr- und Tagesmarken strukturieren alle sieben Tage, horizontale Temperaturhilfslinien bleiben sichtbar. Temperatur wird wertbasiert mit der zentralen ECMWF-inspirierten Skala eingefärbt. In der 7-Tage-Ansicht werden keine Klimamittelabweichungen/±K mehr gezeigt; die ältere 7-Tage-Regel aus v0.9.77.25/v0.9.77.28 ist insoweit ausdrücklich ersetzt. Die 14-Tage-Klimaabweichungslogik bleibt bestehen. Required Regressions: `scripts/test-weather-pictogram-ui-lock-09781.mjs`, `scripts/test-seven-day-ecmwf-hourly-09781.mjs`.

## v0.9.78.9 · Weather Icon System 2.0 und Desktop-Lesbarkeit

Der sichtbare Wetterzustand darf nicht mehr durch die diagnostische H/M/L-Wolkenform in eine andere Hauptsymbolfamilie umgeformt werden. `WeatherPictogram` bleibt der einzige Forecast-Wetterrenderer; `weatherPictogramVisualForm()` ist der verbindliche sichtbare Form-Lock. Höhenwolken-/Wolkenformdiagnostik bleibt fachlich verfügbar, ist aber kein alternativer Piktogrammrenderer.

Für die 14-Tage-Ansicht gilt ab 1025 CSS-Pixel ein eigener Desktopvertrag mit mindestens 224 px breiten Karten und horizontalem Kartenband. Das 7×2-Mikrolayout ist ausschließlich Mobil-/Tablet-Querformat bis 1024 px vorbehalten.

## v0.9.78.10 · Niederschlags-Intervall- und Nowcastvertrag

`MID_PRECIPITATION_INTERVAL_CONTRACT.md` ist ab v0.9.78.10 für alle Niederschlagsmengen und -wahrscheinlichkeiten verbindlich. Open-Meteo-Stundenmengen sowie DWD/MOSMIX-RR1c werden als rückblickende Akkumulationen behandelt: der Zeitstempel bezeichnet das Intervallende, nicht dessen Mittelpunkt. Radar-, 15-Minuten-, Stunden- und Tagesaggregation müssen dieselben Intervallgrenzen verwenden. Ein „ab jetzt“-Profil darf bereits vollständig vergangene Stundenakkumulationen nicht erneut als Zukunft anzeigen; angeschnittene erste Intervalle werden nur mit ihrem Zukunftsanteil bilanziert und im direkten Nowcastfenster bevorzugt aus finalisierten 15-Minuten-/Radarwerten aufgebaut. Eine belastbar trockene Radarstrecke darf auch NWP-Stundenmengen über 1 mm dämpfen; Echo nur im Umfeld darf die PoP stützen, aber keine ungestützte Standortmenge unverändert durchreichen. Instantane Felder wie Temperatur, Wind und Druck bleiben punktbezogen. Required Regression: `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`.

## v0.9.78.46 · sichtbare Niederschlagszeit = Slotbeginn

Der Rechenvertrag aus v0.9.78.10 bleibt vollständig erhalten: providerseitige stündliche Niederschlagsmengen/-wahrscheinlichkeiten sind rückblickende, am Intervallende gestempelte Rohwerte. Für die **sichtbare Zukunftsprognose** gilt ab v0.9.78.46 jedoch zusätzlich der in `MID_PRECIPITATION_INTERVAL_CONTRACT.md` präzisierte Präsentationsvertrag: ein sichtbarer Stundenzeitpunkt `S` bezeichnet den beginnenden Slot `[S,S+1 h]`; die zugehörigen Niederschlagsfelder stammen daher aus dem unmittelbar folgenden Rohwert `S+1 h`. Menge, PoP, Niederschlagsphase und niederschlagsbestimmter Wettercode müssen dasselbe sichtbare Intervall meinen. Instantane Felder wie Temperatur, Wind, Druck und Bewölkung verbleiben am Zeitpunkt `S`. Die 15-Minuten-/1-Stunden-Grenze darf weder Lücken noch Doppelzählung erzeugen; fehlende Anschlusswerte werden nicht als falsche Zukunft umetikettiert. Der interne Radar-/Nowcast-, Assimilations-, Verifikations- und Event-Overlap-Rechenkern bleibt endgestempelt. Required Regressions: `scripts/test-precipitation-trailing-interval-nowcast-097810.mjs`, `scripts/test-precipitation-forward-slot-presentation-097846.mjs`.
## v0.9.79.0 · Optionales Bottom-Tab-Bedienkonzept

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` ist verbindlich. Die bisherige Navigation bleibt Default/Fallback. Der optionale Schlüssel `mid:navigationMode:v1` persistiert die Wahl `classic | bottom-tabs` und wird als portable Nutzereinstellung synchronisiert. Mobile Bottom-Tabs führen ausschließlich in bestehende Sektionen; Radarprodukte/-farben, Parameterfarben, Einheiten und Datenpfade bleiben unberührt. Required Regression: `scripts/test-optional-bottom-navigation-09790.mjs`.
## v0.9.79.1 · Optionales Bedienkonzept, Schritt 2

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` wird erweitert. Nur im optionalen `bottom-tabs`-Modus wird der mobile Kopfbereich kompakter und vor dem Prognose-Arbeitsraum eine gemeinsame Leiste **90 min · 24 h · 7 T · 14 T · 46 T · Saison** eingeblendet. Alle Ziele fokussieren vorhandene MID-Module/Unterbereiche; es entstehen keine zusätzlichen Datenpfade. Klassisch bleibt unverändert. Radarprodukte/-farben und Parameterfarben bleiben vollständig isoliert. Required Regression: `scripts/test-modern-navigation-step2-09791.mjs`.
## v0.9.79.2 · Optionales Bedienkonzept, Schritt 3

Im `bottom-tabs`-Modus verwendet das Kompositbild einen map-first Fokusmodus. Die bestehenden Radar-/Satelliten-/Synoptikdaten bleiben unverändert; lediglich Bedienhierarchie und Platzverteilung werden angepasst. Schnelle Overlays und Presets liegen unter **Ebenen** direkt auf der Karte, vollständige Darstellungs-/Deckkraftoptionen bleiben erreichbar. Pan/Pinch, die bestehenden MapLibre-`+ / −`-Controls, Standortzentrierung, Timeline, Play/Pause, Einzelschritt, `Jetzt` und Wiedergabegeschwindigkeit bleiben erhalten. `classic` bleibt unverändert. Radarfarbtabellen bleiben ausschließlich `dwd-standard`. Required Regression: `scripts/test-modern-map-focus-09792.mjs`.
## v0.9.79.3 · Optionales Bedienkonzept, Schritt 4

Im `bottom-tabs`-Modus ergänzt eine kompakte Heute-Übersicht die vorhandenen kanonischen MID-Daten um die Bedienebenen „Heute relevant“, Stundenkurzleiste und 7-Tage-Kurzblick. Die zugrunde liegende Current-Ansicht und sämtliche Fachpfade bleiben erhalten; der klassische Modus bleibt unverändert. Required Regression: `scripts/test-modern-today-overview-09793.mjs`.

## v0.9.79.4 · Optionales Bedienkonzept, Schritt 5

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` bleibt verbindlich. Im `bottom-tabs`-Modus ist die äußere Horizontleiste die primäre Prognosenavigation; `mid:modernForecastHorizon:v1` persistiert den zuletzt gewählten Horizont. Der Prognose-Tab kehrt bevorzugt zu diesem verfügbaren Ziel zurück. Im Cockpit-Arbeitsraum werden interne Doppel-Tabs nicht zusätzlich gerendert; `classic` bleibt unverändert. Keine Änderung an meteorologischen Datenpfaden oder Radarfarbverträgen. Required Regression: `scripts/test-modern-forecast-workspace-09794.mjs`.
## v0.9.79.5 · Optionales Bedienkonzept, Schritt 6

Im `bottom-tabs`-Modus führt **Planen** in einen Hub für Event, Reise, Berg/Winter und Wasser; **Mehr** bündelt direkte Einstellungszugriffe und deduplizierte Fachmodule. Alle Ziele verwenden vorhandene Module und Datenpfade. `classic` bleibt unverändert. Required Regression: `scripts/test-modern-plan-more-hierarchy-09795.mjs`.

## v0.9.79.6 · Parallelstand-Merge und Bedienkonzept, Schritt 7

Die nachgereichten Änderungen aus **v0.9.78.84/.85** sind verbindlich in den v0.9.79-Zweig integriert: Synoptik ohne ungültiges `smoothFactor`, Composite-v3-Persistenz einschließlich Linienfarben, Sat/Rad-Wiedergabevertrag und seriöse Event-Hitzeempfehlungen bleiben erhalten. Im optionalen `bottom-tabs`-Modus gilt zusätzlich **Übersicht → Fokus → Details**: Heute rendert die vollständige Current-Ansicht erst nach explizitem Details-Aufruf; Karte öffnet das vorhandene Kompositbild ohne zusätzliche äußere Aufklappstufe direkt im Fokus. `classic` bleibt vollständig unverändert. Radarprodukte/-farben, Parameterfarben, Einheiten und kanonische Forecastpfade bleiben isoliert. Required Regression: `scripts/test-modern-focus-detail-hierarchy-09796.mjs`.

## v0.9.79.7 · CI-Buildfix Bottom-Bar-Typvertrag

Die Prognosekandidaten der optionalen Bottom-Leiste werden vor der Deduplizierung explizit als `DashboardModuleId[]` typisiert. Dies verhindert die TypeScript-Aufweitung auf `string[]`, die Release-Run #919 mit TS2322 blockierte. Es handelt sich um einen reinen Build-/Typfix ohne Änderung an Bedienlogik, Wetterdaten, Radarfarben oder Worker-Fachlogik.

## v0.9.84.5 · Eigenständige Widget-Kurvenübersicht

Die Widgetoption **Kurvenübersicht** ist ab v0.9.84.5 ein eigenständiger Darstellungsmodus und verwendet ausschließlich den kanonischen `SevenDayCurveOverview`-Renderer. Die klassische kompakte Tagesansicht wird in diesem Modus nicht parallel angezeigt. Der Zeitraum bleibt auf **3 oder 7 Tage** begrenzt und wird zusammen mit Theme- und Sichtbarkeitsoptionen unter `mid:0.7.1:widget-settings` persistiert.

Die Kurvenübersicht muss den freigegebenen Aufbau beibehalten: Tages-/Datumszeile, zentrale Wetterpiktogramme, ECMWF-basierte Tmin-/Tmax-Pillen, eine geglättete Temperaturkurve, gerundete Skybar-Segmente mit getrennten Niederschlags-Overlays, zusammenhängende Nachtbereiche und stündliche Niederschlagssäulen auf derselben lokalen Zeitachse. Niederschlag und Sonnenschein bleiben über die bestehende Widget-Optionsgruppe schaltbar. Required Regression: `scripts/test-widget-curve-overview-09845.mjs`.

## v0.9.84.6 · Widget-Zeitraum 3–7 Tage

Die eigenständige Widget-Kurvenübersicht unterstützt als Zeitraum **3, 4, 5, 6 oder 7 Tage**. Die Auswahl wird gemeinsam mit Theme-, Sichtbarkeits- und Ansichtsoptionen unter `mid:0.7.1:widget-settings` persistiert. Ungültige Altwerte fallen sicher auf 7 Tage zurück. Kartenansicht und Kurvenübersicht nutzen dieselbe Auswahl; die Kurvenbreite wird für die gewählte Tageszahl angepasst. Der kanonische `SevenDayCurveOverview`-Renderer, die lokalen Tages-/Stundendaten sowie alle bestehenden Export-, Hazard- und Sicherheitsverträge bleiben erhalten. Required Regression: `scripts/test-widget-curve-overview-09845.mjs`.

## v0.9.84.7 · Verlustfreier Niederschlag und kompaktes Widget

Widget-Tageskopf und `SevenDayCurveOverview` verwenden dieselbe einmalig auf sichtbare Vorwärtsslots normalisierte Stundenreihe. Eine zweite Niederschlagsverschiebung ist unzulässig. Die Säulen übernehmen die kanonische Niederschlagsmenge mit konservativem Komponentenfallback; Skybar und Säulen reagieren gemeinsam auf die klar bezeichnete Niederschlagsoption. Alte Widgetstände werden einmalig auf sichtbaren Niederschlag migriert, spätere bewusste Änderungen bleiben unter `mid:0.7.1:widget-settings` persistent. Die Legende darf ausgeblendeten Niederschlag nicht als aktiv ausweisen. Kurven-SVG und Widgetmenü müssen ohne künstliche Mindesthöhe, verrutschende Selects oder unnötige Leerflächen responsiv bleiben. Required Regression: `scripts/test-widget-curve-overview-09845.mjs`.

## v0.9.84.8 · Lesbare Warnschwellen und Wind in der Widget-Kurve

- Die gelbe Windwarnstufe verwendet im hellen Widget dunkle Schrift und einen hellgelben, klar umrandeten Hintergrund mit ausreichendem Kontrast.
- Die Kurvenübersicht zeigt bei aktivierter Windoption je Tag eine kompakte, warnstufengefärbte Kombination aus Richtung, Mittelwind und Böe.
- Optionsfelder bleiben zweispaltig ausgerichtet; Checkbox und einzeilige Kurzbezeichnung dürfen nicht umbrechen oder gegeneinander verrutschen.

## v0.9.84.9 · Ensemble-Widget, Kurvenhazards und optionaler Klima-Favoritenname

Die neue Widgetansicht **14-Tage-Ensemble** rendert die drei vorhandenen vollständigen Diagramme für Temperatur, Niederschlag und Wind/Böen gemeinsam und ohne parallele vereinfachte Diagrammimplementierung. Ensemble-Daten werden erst bei Auswahl dieser Ansicht angefordert. Die Kurvenübersicht zeigt bei aktivierter Hazardoption datumsgleiche Warnsignale; Windrichtung, Mittelwind und Böen bleiben auch im hellen Export klar lesbar. Das Klima-Modul darf optional den aktiven Favoritennamen statt des technischen Ortsnamens verwenden und persistiert diese Wahl pro Koordinate. Required Regression: `scripts/test-widget-ensemble-climate-alias-09849.mjs`.

## v0.9.79.8 · CI-Regressionsmodernisierung nach Run #920

Der Produktionsbuild und die TypeScript-Prüfung von v0.9.79.7 waren bereits erfolgreich. Run #920 scheiterte ausschließlich an fünf statischen Regressionen, deren Quelltextmuster noch die vor dem optionalen Bottom-Bar-/Planen-Hub-Umbau geltende Dashboard-Struktur voraussetzten. Diese Regressionen müssen ab v0.9.79.8 den funktional gleichwertigen aktuellen Vertrag prüfen: zentrale `displayHours`/`displayDays` bleiben verbindlich, Event- und Reiseplaner bleiben separat schaltbar und gemeinsam unter Planen erreichbar, Kurzfrist-/QR-/Modulverträge bleiben erhalten, und spätere Versionslinien müssen den v0.9.78.66-Favoritenvertrag semantisch statt über ein auf `0.9.78.x` begrenztes Regex erfüllen. Die Korrektur darf keine App- oder Worker-Fachlogik verändern.


## v0.9.84.11 · Skybar Wolkenpriorität und Schauer-Overlay

`MID_24H_PROFILE_STORY_AXIS_CONTRACT.md` ist für alle sichtbaren Skybar-Verwendungen verbindlich. Bei bekannter Gesamtbewölkung bestimmt diese das gelbe/graue Grundband: ab 50 % grau, darunter tagsüber gelb mit komplementärem Aufklarungsanteil. Die WMO-Sonnenscheindauer bleibt ein eigenständiger Parameter und darf die bekannte Gesamtbewölkung in der Skybar nicht überstimmen; sie dient nur bei fehlender Gesamtbewölkung als Fallback. Niederschlag bleibt eine separate, nach dem Grundband gerenderte und auf derselben Mittellinie zentrierte Lage. Dadurch bleiben sonnige Schauer darstellbar: ist das Grundband breiter, bleibt es sichtbar; ist der Niederschlagsstreifen gleich dick oder dicker, verdeckt er es vollständig. DWD-Regenintensitäten leicht `<=0,5 mm/h`, mäßig `>0,5–4 mm/h` und stark `>4 mm/h` sind verbindlich; MID teilt „stark“ ausschließlich für die vierte grafische Dickenstufe bei `15 mm/h` weiter. Required Regression: `scripts/test-skybar-shower-overlay-cloud-priority-098411.mjs`.

## v0.9.84.12 · Skybar-Releasefix: Sonnenscheindauer bleibt eigenständig

Die visuelle Skybar-Klassifikation und die physikalische Sonnenscheindauer sind getrennte Verträge. `baseSkyVisual()` verwendet bei bekannter Gesamtbewölkung weiterhin ausschließlich den komplementären Himmelszustand für das gelbe/graue Grundband. `sunVisualShare()` darf dagegen einen vorhandenen direkten Sonnenscheindaueranteil nicht durch Wolkenkomplementierung ersetzen; Wolkenkomplementierung ist dort nur Fallback bei fehlendem Sonnenwert. Damit bleibt der Wissenschaftsaudit kompatibel, ohne den v0.9.84.11-Skybarvertrag oder sonnige Niederschlags-Overlays abzuschwächen.

## v0.9.84.13 · Feste aktuelle Widget-Live-URLs

Feste Widget-URLs verwenden eine zentral gepflegte Ortsliste und erzeugen je Ort automatisch **Kompakt** und **Kurvenübersicht** für **5** und **7 Tage**. Beim Aufruf werden aktuelle kanonische MID-Prognosedaten geladen; angezeigt wird ausschließlich die Widgetfläche. URL-Vorgaben dürfen nicht durch lokale Widgeteinstellungen überschrieben werden. Wind, Niederschlag, Sonnenschein und Hazards sind vollständig aktiv. Required Regression: `scripts/test-widget-url-exports-098413.mjs`.
# MID v0.9.84.14

- Das Ensemble-Widget besitzt eine gespeicherte Einzelauswahl für Temperatur, Niederschlag oder Wind/Böen.
- Vorschau und PNG enthalten nur das gewählte Diagramm mit Ortsname und ohne modellspezifische Begleitinformationen.
- Feste Widget-URL-Orte werden ausschließlich über `WIDGET_URL_LOCATIONS` in `src/widgetUrlExports.ts` gepflegt.

## v0.9.84.89 · Kanonische iOS-inspirierte Floating Bottom Bar

`MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md` ist in seiner ab v0.9.84.89 überschreibenden Fassung verbindlich. Die bisherige optionale Auswahl `classic | bottom-tabs`, der Einstellungs-Unterpunkt **Bedienkonzept** und **Bottom-Leiste · Beta** sind aufgehoben. Auf kompakten Web-/PWA-Viewports lautet die Hauptnavigation **Aktuell · Kurzfrist · 7 Tage · 14 Tage · Mehr**; Beschriftungen bleiben einzeilig. Die Leiste schwebt safe-area-konform über dem Inhalt, minimiert bei deutlichem Abwärtsscrollen und kehrt bei Aufwärtsscrollen/Seitenanfang/Fokus zurück. Weitere Fachmodule einschließlich Karten und Planer bleiben über **Mehr** erreichbar. Desktop-Sektionsleiste und sämtliche meteorologischen Daten-/Radar-/Warn-/Farbverträge bleiben unverändert. Required Regression: `scripts/test-ios-floating-bottom-bar-098489.mjs`.



## v0.9.85.139 · Radar-Grafikmarkierungen und Ensemble-Spannen

Radar-Balken und Auswahlanker sind keine Buttons; der gesamte Scrubber bildet das bedienbare Touch-/Tastaturziel. Native DWD-RV-Werte via Bright Sky werden als 0,01 mm/5 min dekodiert und mit expliziten Intervallgrenzen versehen. Der Forecast-Referenzlauf und maximal 20 Minuten Beobachtungsalter sind verbindlich; fehlende und negative Pixel bleiben ausgeschlossen. Direkter DWD-Abruf bleibt Reserve. 7-/14-Tage-Ansichten verwenden vorhandene gewichtete Ensemble-Quantile und kennzeichnen fehlende Spannen. P10–P90 ist kein kalibrierter Eintrittsbereich. Pflichtprüfung: scripts/test-radar-forecast-readability-0985139.mjs einschließlich echter CI-Browserprüfung.
## MID v0.9.85.195 · MID-C20 Zeitachse und Karten-Synoptik

Verifizierte Basis: main = mid-stable = 22ddd5888f010dbe72eed4b37230463149d52ba5 (.194). Die gemeinsame Warnungs-Timeline nutzt die gesamte Breite und gruppiert Ereignisse nach lokalem Starttag mit Wochentag, Datum und Ereigniszahl. Desktop erhält eine seitliche Tagesachse, Mobil eine kompakte Datumszeile. Quellenkennzeichen stehen innerhalb des Textbereichs, statt Kartenbreite zu verbrauchen. Karten erhalten dezente, nicht doppelte Verwaltungsgrenzen, fachliche Parametergruppen und ein lauf-/termin-/druckflächengebundenes ICON-Synoptik-Komposit. ECCC/GDPS ergänzt Gesamtbewölkung über einen explizit freigegebenen GeoMet-Layer; ICON-EU-2m und bestätigte 12-h-Karten erweitern den Katalog. Warnungsdaten, Farben, Zeitfenster, Sortierung und Releasegates bleiben unverändert. Kartenprüfung: docs/implementation/MID_C20_MAP_SYNOPTIC_0.9.85.195.md. Zeitachse: docs/implementation/MID_C20_WARNING_DAY_TIMELINE_0.9.85.195.md.
