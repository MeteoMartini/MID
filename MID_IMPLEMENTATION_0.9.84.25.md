# MID v0.9.84.25 – iOS Resume / letzter Ort

## Anlass
Auf iOS konnte MID nach der Rückkehr aus dem Hintergrund auf den ersten bzw. als Standard markierten Favoriten springen. Danach wurde die Kernprognose neu initialisiert und die Oberfläche blieb teilweise bei „Wettermodelle werden geladen …“ stehen.

## Ursachen
1. `mid:lastLocation` und `mid:lastTrackedLocation` waren Teil des portablen Geräte-Snapshots. Ein Remote-Stand konnte deshalb die lokale aktive Ortswahl überschreiben oder bei einem v2-Snapshot als fehlenden portablen Schlüssel löschen.
2. Der Durability-Spiegel bewertete generische Standortdaten mangels fachlicher Revision mit seinem technischen IndexedDB-Zeitstempel. Damit konnte ein älterer Spiegelstand einen vorhandenen nativen `localStorage`-Ort überstimmen.
3. iOS/WKWebView kann beim Resume sowohl einen realen als auch einen ergänzten Sichtbarkeitsimpuls liefern. Der portable Sync war dafür weder sichtbarkeitsseitig gedrosselt noch als eigener In-Flight-Vorgang entdoppelt. Ein übernommener Remote-Stand löst anschließend bewusst einen UI-Reload aus; zusammen mit Punkt 1 erklärte dies den Sprung zum Standardfavoriten.
4. Der Splash-Preload liest den letzten Ort absichtlich sehr früh. Wenn StorageSafety danach einen anderen lokalen Ort wiederherstellte, lief der erste Vorladeversuch für den falschen Ort bis zu seinem Timeout weiter.

## Umsetzung
- Aktiver Auswahlort, Auswahlrevision und letzte physische Geräteposition sind gerätelokal; Favoriten/Profile bleiben portabel.
- Jede echte `setLoc`-Auswahl schreibt `mid:lastLocation:updated-at`. Reine Forecast-Metadatenanreicherung ändert diese Revision nicht.
- StorageSafety nutzt die Standortrevision und behandelt alte Installationen ohne Revision so, dass ein bestätigter vorhandener nativer Ort nicht allein wegen des technischen Mirror-Zeitstempels verloren geht.
- Portabler Sichtbarkeits-Sync: 15-s-Cadence plus eigener In-Flight-Promise. Der 3-s-Änderungspush und der 2-min-Periodikpfad bleiben erhalten.
- Startvorladung wird nach lokaler Recovery nochmals auf denselben/ggf. korrigierten Standort gebunden.

## Funktionsschutz
Keine Änderung an Favoritenreihenfolge, Standorttracking-Option, Wetterberechnung, Skybar, Warnungen, Radar, Ensemble oder Worker-Fachlogik.
