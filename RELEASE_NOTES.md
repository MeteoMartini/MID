# MID v0.9.85.476

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
