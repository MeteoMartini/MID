# MID v0.9.85.440 · Zuverlässigere automatische Qualitätsprüfung

Die automatische Prüfung von Wetterkarten, Bedienoberflächen und Performance erhält eine stabile Browserumgebung. Dadurch können vollständige Qualitätskontrollen nach Aktualisierungen wieder zuverlässig ausgeführt werden. An den Wetterdaten und Prognosen ändert sich nichts.

# MID v0.9.85.439 · Gleichmäßige Kartenübergänge und markante Gefrierpunktachsen

Wolken- und Signifikantwetterkarten behalten beim Wechsel desselben Modells über einen neuen Lauf den letzten geprüften Frame, bis der neue Frame bereitsteht. Die angezeigte Vorlaufzeit folgt dem tatsächlich sichtbaren Wetterfeld. Temperaturdiagramme heben die 0-Grad-Referenz und ihre Achsenbeschriftung deutlicher hervor.

# MID v0.9.85.438 · Ruhige Karten und Wetterlagen im erweiterten Trend

Der Kartenrand ist dezenter; Touch und Maus hinterlassen keinen blauen Fokusrahmen. Tastaturbedienung bleibt erkennbar. Die Kurzfristzeile verzichtet auf den langen 24-Stunden-Abdeckungshinweis.

Die erweiterte Witterungstrend-Ansicht ergänzt für Mitteleuropa eine grafische DWD-Wetterlagenvorhersage bis sieben Tage. Außerhalb dieses Kontexts wird nur der passende euro-atlantische ECMWF-Originalzugang angeboten; für andere Regionen erscheint kein unpassender Block. Großräumige Klassifikation und lokale MID-Prognose bleiben getrennt. Die Basisansicht lädt keine zusätzlichen Regimedaten.

# MID v0.9.85.437 · Ruhige Kartenwechsel und klare Radarphasen

Beim Wechsel des Kartentermins bleibt das bisherige Bild sichtbar, bis der Nachfolger geladen ist. Modell- und Wolkenbilder wechseln mit einer kurzen Überblendung; schnelle Mehrfachwechsel und Ladefehler erhalten den letzten gültigen Stand. Die angezeigte Gültigkeitszeit bleibt dem tatsächlich sichtbaren Feld zugeordnet.

Niederschlagsart-Zeichen erhalten einen deckenden hellen Hintergrund und klare meteorologische Grundformen. Sie kennzeichnen ausschließlich feste, gemischte und gefrierende Niederschläge über dem aktivierten Radar. Reiner Regen und Wolken-/Modellkarten erhalten keine solchen Marker. Die zeitliche und räumliche OPERA-Echoprüfung bleibt erhalten. Modellgestützte Klassifikation ist keine amtliche Stationsmeldung oder Warnung.

# MID v0.9.85.436

- Bottom-Bar auf iOS: feste Bildschirmverankerung statt scrollabhängiger Dokumentposition; Tastatur und Zoom werden getrennt behandelt.
- Einstellungsgruppen besitzen klar getrennte, semantische Überschriften und Beschreibungen.
- Fehlgeschlagene DWD-Bilddarstellung zeigt eine Meldung mit erneutem Ladeversuch.
