# MID v0.9.85.292 · Barcelona-Warnungsgebiete und CAP-Revision (Source-PR-Kandidat)

- Verifizierte Stable/main-Basis fbe9c758599928f4b5ba776de670505018750dbb, v0.9.85.291. Ursprung: gesicherter .290 Draft #412 @ 3ba91d51ae883df4b38c59b2fad09634994a01fe, unverändert erhalten. .291-API-NoData-Code und Regression beibehalten.
- #411: Eindeutige Warngebietsnamen/AEMET-Gemeinde Barcelona 08019 → Litoral 690804, CAP-Polygon/-Kreis zuerst, Schweregrad im semantischen Dubletten-Schlüssel, bei belegter CAP-ID/Referenz neue Ausgabezeit vor Beschreibungslänge. Eng begrenzter AEMET-Ortshinweis ohne behauptetes offizielles Gemeindegrenzenpolygon.
- Worker-End-to-End-Test scripts/test-barcelona-warning-area-dedupe-0985290.mjs mit **synthetischen** 26 Fällen, VIS-Fallback, CAP-Polygonen/Nachbargebieten/verschiedenen Zeitfenstern und Schweregraden sowie kürzerem amtlichem Update zu längerer Vorversion. Neuer Pflichttest neben unverändertem .291-API-NoData-Test.
- Grenzen: aktuelle echte 26-Warnungen-Liste nicht als Live-API-Objekte verfügbar; MeteoAlarm VIS-BBox ist keine exakte Geometrie, Cancel-/mehrsprachige CAP-Identität noch nicht abschließend abgenommen. Issue #411 bleibt offen. Keine physische iOS-/VoiceOver-Abnahme behauptet.
- Version- und Buildspiegel 0.9.85.292 synchronisiert; Source-, Build-, Security-, Worker-/Pages- und Stable-Gates noch ausstehend. Nur SHA-gebundener MID Source-PR → Release-Bot → serverseitiges ZIP → Installer → Worker/Pages → Stable, kein Direktmerge.

# MID v0.9.85.292

- **Barcelona-Warngebiete:** Für die ausdrücklich ausgewählte Gemeinde Barcelona (AEMET 08019) gilt die amtliche Warnzone 690804 „Litoral de Barcelona“. Andere Warnzonen mit dem Wort Barcelona werden nicht allein durch Teilwortgleichheit zu Stadtwarnungen.
- **CAP-Updates:** Bei nachgewiesen gleicher Warnungsidentität hat die neuere amtliche Ausgabe Vorrang, auch wenn ihre Beschreibung kürzer ist. Unterschiedliche Warnstufen und Zeiträume bleiben erhalten.
- **Räumliche Nachvollziehbarkeit:** Echte CAP-Polygone und -Kreise gehen Namensheuristiken vor. Die MeteoAlarm-Box ist nur Vorfilter, keine bestätigte exakte Form.
- Die vom Nutzer beobachteten 26 Live-Warnungen wurden nicht als einzelne aktuelle Meldungen archiviert. Der neue Test verwendet ausdrücklich synthetische Warnungen, nicht die aktuelle reale Warnungszahl.
