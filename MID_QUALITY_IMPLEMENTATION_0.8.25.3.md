## MID v0.8.25.3 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.25.2**, da vorhandene Trend- und Warnlogik fachlich korrigiert wurde, ohne eine neue Hauptfunktion einzuführen.

### I. Dauerregen und Tagesprognose

- Langfristige 12-/24-/48-/72-Stunden-Niederschlagsfenster können nicht mehr rückwirkend eine Regenwarnung auf einen trockenen Kalendertag setzen.
- Stark- und Dauerregenhinweise werden für einen Tag nur übernommen, wenn an diesem Tag auch tatsächlich modellierter Flüssigniederschlag vorhanden ist.
- Für Dauerregen ist zusätzlich eine minimale zeitliche beziehungsweise mengenmäßige Tagesstützung erforderlich.
- Dadurch bleiben Tageskarte, Detaildiagramm, Warnbadge und 7-Tage-Trend konsistent.

### II. Tropennacht im 7-Tage-Trend

- Die Tropennacht wird nicht mehr aus dem Tiefstwert desselben Kalendertags abgeleitet.
- MID wertet die auf den Tag folgende Nacht von 20:00 bis 08:00 Uhr aus.
- Bei unvollständigen Stundendaten wird der Tiefstwert des Folgetags verwendet.
- Beispiel: Für Freitag gilt die Nacht Freitag auf Samstag. Ein prognostiziertes Samstag-Minimum von 18 °C erzeugt daher keine Tropennacht-Aussage für Freitag.

### Prüfung

- neuer dynamischer Regressionstest für Tropennacht und vorgezogene Dauerregenwarnungen
- bestehende 7-Tage-Trendtests
- Warnmarker- und Warnfiltertests
- Detail-/Gewitter-Trendkonsistenz
- Worker-Syntaxprüfung

### Worker

- **Kein funktionaler Worker-Umbau erforderlich**
- Worker nur auf **v0.8.25.3** versionssynchronisiert
