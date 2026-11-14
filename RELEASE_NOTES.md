# MID v0.9.85.479

- Changelog direkt in MID öffnen und über „Zurück zu MID“ zur bisherigen App-Ansicht zurückkehren – ohne neuen Browser-Tab oder PWA-Fenster.
- Bedienbarkeit: Schließen über Escape, Wiederherstellung des Fokus, mobile Safe Areas, Light/Dark-Modus und verständliche Fehlermeldung mit weiterhin nutzbarem Rückweg.
- Codequalität: Bestehende Prüfwerkzeuge, deren Status und deren Grenzen verbindlich dokumentiert. actionlint, zizmor, Biome und axe bleiben optionale Diagnosen mit nachvollziehbarer Befundpflicht; alle bisherigen Release- und Schutzgates bleiben erhalten.

# MID v0.9.85.478

- Wetter im Umfeld: dieselbe hochwertige OpenFreeMap-/MapLibre-Kartengrundlage wie im MID-Kartenbereich mit Wasser, Länder- und Regionalgrenzen sowie Orts- und Flussbeschriftungen statt schematischer SVG-Grenzlinien.
- Temperaturwerte erscheinen bei bis zu vier tatsächlich benannten, nach regionaler Bedeutung ausgewählten Städten bzw. Orten. Die bisherigen frei gewählten Modellrasterpositionen entfallen. Werte stammen aus echten ortsbezogenen Open-Meteo-Best-Match-Abfragen; fehlende und unplausible Werte werden nicht als 0 dargestellt.
- Niederschlagsradar und Satellitenbilder liegen georeferenziert auf der Kartenbasis. Der gewählte Ort bleibt als dezente Standortmarkierung mit seinem eigenen aktuellen Temperaturwert erkennbar.

# MID v0.9.85.477

- Stabilere GitHub-Actions-Artefaktübertragung bei HTTP-429-Drosselung: Die offizielle GitHub-Action `actions/download-artifact` verwendet jetzt v8.0.2 mit berücksichtigt­em `Retry-After`, ohne MID-Daten, Wetterberechnungen oder Benutzeroberfläche zu ändern.
- Sicherheitswartung: SHA-verifizierte Action in zehn kanonischen Workflow-Paaren, im Installer-Spiegel, im Workflow-Synchronisierer und in den zugehörigen Regressionen aktualisiert. Herkunfts-/Digest-Fehler bleiben blockierend; die vollständigen Release- und Stable-Gates bleiben verpflichtend.

# MID v0.9.85.476

- Extremwetter-Ausblick: Kurz- und Mittelfrist können mit einer validierten lokalen Vorschau sofort geöffnet werden. Kürzere begrenzte zentrale Abruffristen und kontrollierter serieller Direkt-Fallback vermeiden doppelte Datenanforderungen; fehlende Modelllauf-Metadaten und unvollständige Gefahrenfelder bleiben ausdrücklich gekennzeichnet. Eigene MID-Diagnostik ist keine amtliche Warnung.

- Wetter im Umfeld: vier echte, georeferenzierte Modelltemperaturen rund um den gewählten Ort, ergänzt durch Kartengrenzen und Ortsnamen. Bei fehlenden Daten erscheinen keine erfundenen Nullwerte.
- Open-Meteo Best Match als eigenständiger, begrenzter Vierpunktabruf: Quelle, tatsächliche UTC-Gültigkeitszeit und verfügbare Punkte werden ausgewiesen; ein unbekannter individueller Modelllauf wird nicht behauptet. Radar und Niederschlagsphase beeinflussen die Temperaturabfrage nicht.
- Dezente, kontrastgesicherte Orts- und Temperaturbeschriftungen auf heller und dunkler Karte, einschließlich Schnee- und Wolkenbildern.
- Kostenneutrale, optionale P1-Qualitätsprüfungen für actionlint, zizmor und Biome sowie axe-core/Playwright im Revisionsworkflow. Die neuen Piloten verändern oder ersetzen keine bestehenden Source-/Review-/Release-Gates; ihre Findings sind unabhängig zu bewerten.

# MID v0.9.85.475

- Sicherheits-/Qualitätswartung: CodeQL-Workflow auf die offiziell verifizierte GitHub-Action v4.39.3 aktualisiert. Initialisierung und Analyse verwenden denselben festgeschriebenen Commit.
- MID hält beide GitHub-Workflowspiegel und den Pin-Generator synchron. Eine neue Pflichtregression schützt vor einem erneuten Rückfall auf die alte Action-Version.
- Wetterdaten, Warnungen, Bedienoberfläche und bestehende Funktionen bleiben unverändert.

# MID v0.9.85.474

Der Release-Bot kann nach einem nachgewiesenen Installerfehler vor dem Deployment einen vollständig geprüften Folge-PR übernehmen.

# MID v0.9.85.473

- „Wetter im Umfeld“ ergänzt die Startseite um Radar, Satellit und zeitlich passende Temperaturwerte.
- MID lädt den Systemstatus erst beim Öffnen des Einstellungsbereichs, um das Startpaket zu verkleinern.

# MID v0.9.85.472

- Unter Aktuell zeigt „Wetter im Umfeld“ eine kompakte Radar- und Satellitenvorschau. Bestätigte DWD-Nowcast-Termine sind auswählbar.
