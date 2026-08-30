# MID v0.9.76.8 – Prognose-Cockpit-Register und RUC-Watchdog-Selbsttest

- Das Prognose-Cockpit behält bei Kurzfrist, 7 Tage und 14 Tage dieselbe Kopf-/Registertypografie, dieselben Icons, Unterzeilen und Mini-Grafiken. Die 14-Tage-Kompaktierung wirkt nur auf den Inhaltsbereich, nicht mehr auf das Register.
- Der RUC-Watchdog verwendet für Recovery-Dispatches explizit `-R "$GITHUB_REPOSITORY"` und übt den guarded `force=false`-Recovery-Pfad bei einem Workflow-Datei-Push einmal aktiv aus. So wird der kritische Dispatch-Pfad bei der administrativen Synchronisierung real verifiziert, auch wenn der primäre Scheduler gerade gesund ist.
- Keine Änderung an Forecast-Fusion, RUC-Datenfachlogik oder Worker-Semantik.
