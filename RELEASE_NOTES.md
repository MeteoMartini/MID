# MID v0.9.85.476

- Extremwetter-Ausblick: Kurz- und Mittelfrist öffnen schneller und zeigen vorhandene, validierte Modellinformationen unmittelbar. Ältere Datenstände bleiben ausdrücklich als nicht aktuell gekennzeichnet.
- Beim Aufruf aus dem Warnbereich verhindert MID doppelte Vorababrufe. Der zentrale Dienst wird zeitlich begrenzt geprüft; falls nötig, folgt die vorhandene direkte Ersatzberechnung mit verständlicherer Ursache.
- Fehlende Modelllaufzeiten und nicht verfügbare Gefahrenfelder werden nicht als sichere Entwarnung dargestellt. Modellprognosen bleiben klar von amtlichen Warnungen getrennt.

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
