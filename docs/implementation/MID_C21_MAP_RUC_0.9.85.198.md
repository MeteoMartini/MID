# MID-C21 · 0.9.85.198

Stable-Basis b27bd472e228c59a9cc36e7305307b775623288a. OSM-Ozeanpolygon-Küsten und admin2-Grenzen werden gemeinsam über dem Wetterraster angezeigt, mit erhöhtem Kontrast und Linienbreite. Der bestehende Grenzen-Schalter steuert beide. Die Zeitwahl verwendet dieselben geprüften Timeline-Einträge wie die Wiedergabe; keine erfundenen Termine.

Synoptik: Fehlender veröffentlichter Katalog wird als Fehler statt endloser Vorbereitung ausgewiesen. Der Abruf hat ein 20-s-Zeitlimit und einen manuellen Wiederholungsweg. Hash-, Zeit-, Modell- und Einheitenprüfungen bleiben unverändert.

RUC: Run 37714976679/2 erzeugte vollständige 0300Z-Daten (20 EPS-Mitglieder), scheiterte aber bei zwei gleichnamigen Pages-Artefakten. Producer-Artefakt-ID und run_attempt-Namen beseitigen die Mehrdeutigkeit. Keine Artefakte werden gelöscht. Scheduler-Datensätze älter als 42 min dürfen nur bei bestätigter total_count=0 und leerer Jobs-Liste übersprungen werden. API-Fehler verhindern einen Dispatch. run_started_at schützt frische Wiederholungen alter Run-IDs. Vor Recovery müssen main und mid-stable gleich sein. EPS-Minimum 10, Uploadbudget 900 MB und sämtliche Releasegates bleiben bestehen.

Der vorhandene .197-Geographie-Test erwartet jetzt acht statt fünf Style-Layer; die zusätzliche OSM-Küste ist bewusst Bestandteil desselben auswählbaren Referenzrenderers. Der Cloudflare-Watchdog-Quellcode wird synchron korrigiert; seine tatsächliche Aktivierung wird hier nicht behauptet.

Validierung: vollständiger TypeScript-/Vite-Build; 941 Regressionen (Budget nach bereinigtem Build separat wiederholt), echte Browsermatrix mit Terminwahl und kontrolliertem Katalogfehler/Retry; iPad-Rückkehr in vier Chromium-Touch-Ansichten. Keine Behauptung eines Hardware-Safari-Tests.

Die schmale Kontrastkante benutzt exakt dieselbe Geometrie und Filter wie die Vordergrundlinie. Sie erhält die Lesbarkeit auch über hellen DWD-Flächen im dunklen Design, ohne einen zweiten geografischen Datensatz oder versetzte Grenzen einzuführen.
