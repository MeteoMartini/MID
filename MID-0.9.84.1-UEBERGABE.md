# MID v0.9.84.2 · Übergabe

## Ausgangspunkt

Diese Version basiert auf `MID-professional-replacement(20260908-213010).zip`, Version `0.9.84.1`.

Der aktuelle Build ist der Wartungsstand `0.9.84.2`; `package.json`,
`package-lock.json`, `MID_BASELINE.json`, iOS-Status, Worker und ZIP werden
gemeinsam auf diese Version synchronisiert.

## Erledigt

1. Neues Beta-Design vollständig auf fünf Hauptbereiche ausgerichtet: **Heute**, **Vorhersage**, **Karte**, **Planen**, **Mehr**.
2. Desktop-Layout mit fester vertikaler Navigation ergänzt.
3. Smartphone-Hochformat und Querformat über bestehende responsive Regeln zusammengeführt.
4. Nur der aktuell gewählte Arbeitsbereich rendert seine großen Module; Detailfunktionen bleiben über Mehr bzw. die vorhandenen Module erreichbar.
5. Expertenbereiche progressiv gruppiert; klassischer Modus bleibt als Fallback bestehen.
6. Letzte Auswahl und vorhandene Deep-Links bleiben kompatibel.
7. Keine unnötigen YAML- oder GitHub-Workflow-Wechsel vorgenommen.

## Fortsetzung · 24-h-Profil und MID-Hinweise

8. Der Beta-Button **24 h** schaltet den Kurzfrist-Horizont und scrollt nach der
   Cockpit-Umschaltung gezielt auf das vollständige 24-Stunden-Wetterprofil.
9. Die Hazard-Bänder des 24-h-Profils verwenden dieselbe kanonische MID-Warnlogik
   wie der Warnbereich. Wenn die Umfeld-EPS vorliegt, werden Standort plus vier
   12-km-Umfeldpunkte und beide unabhängigen Modellfamilien einbezogen; ohne
   Umfeld-EPS bleibt der deterministische Fallback aktiv.
10. Damit gelten die probabilistischen Gültigkeitsfenster und die Umfeldstützung
    über das gesamte angezeigte Profil, nicht nur für den aktuell ausgewählten
    Zeitpunkt. Alle neun Warnparameter bleiben über die gemeinsame
    `hazardSupportScore`-Logik gekoppelt.

## Fortsetzung · Regenmeldungen

11. Push-Einstellungen für Niederschlag enthalten neben Vorlauf und Mindestmenge
    jetzt eine persistierte **Mindestdauer** (keine, 15/30/60/120/180 Minuten).
    Der Default bleibt ohne Mindestdauer, damit bestehende Abonnements ihr
    bisheriges Verhalten behalten.
12. Worker und App gruppieren zusammenhängende 15-Minuten-Modell- bzw.
    Radarintervalle zu einem Niederschlagsereignis. Ein Ereignis wird nur dann
    ausgelöst, wenn Mengen- und optionaler Dauerschwellwert erfüllt sind.
13. Die Meldung nennt den erwarteten Beginn, die voraussichtliche Dauer und –
    wenn belastbar – die erwartete Menge. Radar/Nowcast wird gegenüber dem Modell
    bevorzugt, wenn es früher oder mindestens gleich relevant ist.
14. Die Einstellung wird über den bestehenden Push-Payload synchronisiert; ältere
    Worker-Einträge werden sicher auf `minimumDurationMinutes: 0` normalisiert.

## Beta-Design · Neustartpersistenz

15. Die Auswahl **Klassisch** bzw. **Bottom-Leiste · Beta** wird beim Umschalten
    synchron in `mid:navigationMode:v1` gespeichert und zusätzlich über den
    bestehenden React-State-Effekt nachgeführt.
16. Beim nächsten Start werden Beta-Navigation, letzter Arbeitsbereich und der
    zuletzt gewählte Prognosehorizont gemeinsam wiederhergestellt; der klassische
    Fallback bleibt unverändert verfügbar.

## Sofortiges Fortsetzen

Im Projektordner ausführen:

```bash
npm install
npm run test:modern-five-workspaces
npm run verify:types
npm run build
npm run test:regressions
npm run release:preflight
npm run release:pack
```

Wenn Credits oder Laufzeit in einer Sitzung enden, kann die Arbeit mit diesem Dokument und derselben ZIP-Datei unmittelbar fortgesetzt werden. Zuerst `npm run test:modern-five-workspaces`, danach die vier Prüfkommandos ausführen; anschließend nur noch die erzeugte Release-ZIP ausliefern.

## Bekannte Produktentscheidung

Die neue Navigation blendet im Beta-Modus nicht aktive Großmodule aus. Dadurch bleibt der Einstieg ruhig und touchfreundlich; die vollständige fachliche Tiefe ist weiterhin über **Mehr**, Einstellungen und die klassische Ansicht verfügbar.

## Widget · kompakte 3/7-Tage-Kurve

Das Widget bietet jetzt ausschließlich 3 oder 7 Tage sowie die zusätzliche Darstellung **7-Tage-Kurve**. Die Kurve nutzt die vorwärts normalisierten Stundenwerte, eine monotone Temperaturkurve und optionale Niederschlagsbalken. Wind, Niederschlag, Sonnenscheindauer und Hazards sind in einer kompakten Optionsgruppe ein-/ausblendbar; Abstände zwischen Temperaturwerten und Kurve wurden reduziert. Alle Widget-Auswahlen werden unter `mid:0.7.1:widget-settings` persistiert und beim nächsten Start wiederhergestellt.

## Wetterprofil · Tagesansicht standardisiert

Beide Ansichten beziehen sich auf dieselbe von `App.tsx` finalisierte `displayHours`-Reihe und denselben Vorwärts-Slotvertrag. Das Kurzfristprofil darf bei bereits kanonisch assimilierter Radarprognose keine zweite Radarassimilation ausführen; `buildShortTermForecast` verwendet dann nur noch die 15-Minuten-Reihe zur zeitlichen Verfeinerung. Damit bleiben Temperatur, Niederschlagsphase/-menge, Wind, Wolken und Wetterpiktogramme zwischen Tageskarte und Profil konsistent.

## Workflow-Optimierung · kürzere Veröffentlichungswartezeit

17. Die drei automatischen GitHub-Pages-Versuche laden jetzt ausschließlich den
    geprüften `RELEASE_SHA` mit `--depth=1`. Zuvor wurden bei jedem Versuch die
    vollständigen `main`- und `mid-stable`-Historien zusätzlich geladen. Das
    reduziert Transfer, Checkout-Zeit und die Belastung des Codeload-/Git-Servers,
    besonders bei den 75-/180-Sekunden-Retries.
18. Die Fast-Forward- und Stable-Prüfung in `finalize_release` bleibt bewusst
    historienfähig; diese Sicherheitsprüfung wurde nicht verkürzt. Ebenso bleibt
    der gemeinsame `mid-pages`-Lock für Release und RUC bestehen, damit keine
    parallelen Deployments ein neueres Pages-Artefakt überschreiben.
19. Die RUC-Pipeline ist dafür jetzt in `prepare` und `publish` geteilt: Download,
    Dekodierung und Fachtests laufen ohne `mid-pages`; nur das Zusammensetzen aus
    dem aktuellen `mid-stable`, Upload und Pages-Deploy nehmen den seriellen Lock.
    Der Snapshot wird als kurzlebiges, unveränderliches Artefakt übergeben.
20. Vor dem RUC-Publish wird ein laufender oder wartender `install-mid.yml`-Lauf
    erkannt und der RUC-Publish fail-closed beendet. Dadurch kann kein alter
    Stable-Stand einen gerade geprüften Build überschreiben; der Watchdog holt die
    Veröffentlichung im nächsten Lauf nach. Alle bestehenden SHA-/Artifact-/Pages-
    Sicherheitsprüfungen bleiben aktiv.

Nebenbefund der Workflow-Governance-Prüfung: CODEOWNERS, SECURITY.md, eine
maschinenlesbare Dependency-Update-Policy und strukturierte Issue-Forms fehlen
noch. Sie verlängern den Publish-Lauf nicht, sollten aber unabhängig davon als
Repository-Härtung ergänzt werden.
